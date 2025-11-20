"use server";

import supabase from "@/config/supabase-config";
import dayjs from "dayjs";
import { generateBiometricDeviceId } from "@/utils/biometric-helpers";
import { 
  addEmployeeToAllDevices, 
  updateUserBiometricStatus,
  handleBiometricOnSubscriptionPurchase  
} from "./biometric";

// Helper to update subscription status
export const updateUserSubscriptionStatus = async (userId: number) => {
  try {
    const { data, error } = await supabase.rpc('update_user_subscription_status', {
      user_id_param: userId
    });

    if (error) {
      console.error("Error updating subscription status:", error);
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update subscription status:", error);
    return { success: false, message: error.message };
  }
};

// Setup biometric for user
const setupBiometricForUser = async (userId: number, userName: string) => {
  try {
    console.log(`Setting up biometric for user ${userId}`);
    
    const biometricDeviceId = generateBiometricDeviceId(userId);
    const biometricResult = await addEmployeeToAllDevices(userId, userName);
    
    if (biometricResult.success) {
      await updateUserBiometricStatus(userId, biometricDeviceId, true);
      console.log(`Biometric setup successful for user ${userId}`);
      return {
        success: true,
        message: biometricResult.message,
        biometricDeviceId,
      };
    } else {
      console.error(`Biometric setup failed for user ${userId}:`, biometricResult.message);
      return {
        success: false,
        message: biometricResult.message,
      };
    }
  } catch (error: any) {
    console.error(`Error in biometric setup for user ${userId}:`, error);
    return {
      success: false,
      message: error.message || "Failed to setup biometric",
    };
  }
};

export const createNewSubscription = async (payload: any) => {
  try {
    // Create subscription in database
    const { data, error } = await supabase
      .from("subscriptions")
      .insert([payload])
      .select("user_id")
      .single();
      
    if (error) {
      throw new Error(error.message);
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("id, name, email, is_customer, is_bio_metric_active, biometric_device_id")
      .eq("id", payload.user_id)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
      // Continue even if user fetch fails
    }

    // Mark as customer if not already
    if (userData && !userData.is_customer) {
      await supabase.from("user_profiles").update({
        is_customer: true,
      }).eq("id", payload.user_id);
    }

    // Update subscription status
    await updateUserSubscriptionStatus(payload.user_id);

    // SMART BIOMETRIC HANDLING
    if (userData) {
      console.log(`🔐 Processing biometric for user ${userData.name} (ID: ${userData.id})`);
      console.log(`  - is_bio_metric_active: ${userData.is_bio_metric_active}`);
      console.log(`  - biometric_device_id: ${userData.biometric_device_id}`);

      const biometricResult = await handleBiometricOnSubscriptionPurchase(
        userData.id,
        userData.name || userData.email || "Unknown User"
      );
      
      if (biometricResult.success) {
        console.log(`✅ Biometric ${biometricResult.action}: ${biometricResult.message}`);
      } else {
        console.warn(`⚠️ Biometric operation failed: ${biometricResult.message}`);
        // Don't fail the subscription creation if biometric fails
      }
    }

    return {
      success: true,
      data,
      message: "Subscription created successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const getCurrentUserActiveSubscription = async (user_id: string) => {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("* , plans(*)")
      .eq("user_id", user_id)
      .eq("is_active", true)
      .gte("end_date", dayjs().format("YYYY-MM-DD"))
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    // Update the user's subscription_status
    await updateUserSubscriptionStatus(parseInt(user_id));

    if (data.length === 0) {
      return {
        success: false,
        data: null,
      };
    }

    const sub = data[0];
    sub.plan = sub.plans;
    
    return {
      success: true,
      data: sub,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const getAllSubscriptionsOfUser = async (user_id: string) => {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("* , plans(*)")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    let formattedData = data.map((item: any) => ({
      plan: item.plans,
      ...item,
    }));

    // Update user's subscription_status
    await updateUserSubscriptionStatus(parseInt(user_id));

    return {
      success: true,
      data: formattedData,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const getAllSubscriptions = async () => {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        plans(name),
        user_profiles(name, email, profile_image, clerk_url),
        coupons(code)
        `
      )
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    let formattedData = data.map((item: any) => ({
      plan: item.plans,
      user: item.user_profiles,
      coupon: item.coupons,
      ...item,
    }));

    return { success: true, data: formattedData };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};


export const deleteSubscription = async (subscriptionId: number) => {
  try {
    // Get user_id before deleting
    const { data: subData, error: fetchError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("id", subscriptionId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", subscriptionId);

    if (error) throw error;

    // Update user's subscription_status after deletion
    if (subData?.user_id) {
      await updateUserSubscriptionStatus(subData.user_id);
    }

    return { success: true, message: "Subscription removed 🗑️" };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const getExpiringSubscriptionsSimple = async () => {
  try {
    console.log("Calling get_expiring_subscriptions_detailed...");
    
    // Call the Supabase function
    const { data, error } = await supabase.rpc("get_expiring_subscriptions_detailed");

    if (error) {
      console.error("Supabase RPC error:", error);
      return {
        success: false,
        message: error.message || "Database function error",
        data: {
          expiringSubscriptions: [],
          expiredSubscriptions: [],
        },
      };
    }

    console.log("Raw data from function:", data);

    if (!data || data.length === 0) {
      return {
        success: true,
        data: {
          expiringSubscriptions: [],
          expiredSubscriptions: [],
        },
      };
    }

    // Transform data - map the exact column names from the function
    const transformedData = data.map((sub: any) => ({
      id: sub.s_id?.toString() || "",
      user_id: sub.s_user_id,
      user_name: sub.user_name || "Unknown User",
      user_email: sub.user_email || "",
      user_contact_no: sub.user_contact_no || "",
      user_profile_image: sub.user_profile_image || null,
      user_clerk_url: sub.user_clerk_url || null,
      plan_name: sub.plan_name || "Unknown Plan",
      start_date: sub.start_date,
      end_date: sub.end_date,
      amount: Number(sub.amount) || 0,
      days_remaining: sub.days_remaining || 0,
    }));

    // Separate expiring vs expired
    const expiringSubscriptions = transformedData.filter(
      (sub: any) => sub.days_remaining >= 0
    );
    const expiredSubscriptions = transformedData.filter(
      (sub: any) => sub.days_remaining < 0
    );

    console.log("Expiring:", expiringSubscriptions.length);
    console.log("Expired:", expiredSubscriptions.length);

    return {
      success: true,
      data: {
        expiringSubscriptions,
        expiredSubscriptions,
      },
    };
  } catch (error: any) {
    console.error("Error in getExpiringSubscriptionsSimple:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch expiring subscriptions",
      data: {
        expiringSubscriptions: [],
        expiredSubscriptions: [],
      },
    };
  }
};
