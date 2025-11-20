"use server";

import supabase from "@/config/supabase-config";
import { updateUserSubscriptionStatus } from "./subscriptions";
import { generateBiometricDeviceId } from "@/utils/biometric-helpers";
import { 
  addEmployeeToAllDevices, 
  updateUserBiometricStatus,
  handleBiometricOnSubscriptionPurchase  
} from "./biometric";

export interface ICashPaymentRequest {
  user_id: number;
  plan_id: number;
  amount: number;
  original_amount?: number;
  discount_amount?: number;
  coupon_id?: number;
  start_date: string;
  end_date: string;
  total_duration: number;
  user_name: string;
  plan_name: string;
}

export const createCashPaymentRequest = async (payload: ICashPaymentRequest) => {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .insert([{
        user_id: payload.user_id,
        plan_id: payload.plan_id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        total_duration: payload.total_duration,
        amount: payload.amount,
        original_amount: payload.original_amount || payload.amount,
        discount_amount: payload.discount_amount || 0,
        coupon_id: payload.coupon_id || null,
        payment_id: `CASH_${Date.now()}`,
        is_active: false,
        is_cash_approval: false,
      }])
      .select("user_id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Update subscription_status (will be false until approved)
    if (data?.user_id) {
      await updateUserSubscriptionStatus(data.user_id);
    }

    return {
      success: true,
      data,
      message: "Cash payment request submitted successfully. Awaiting admin approval."
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const getAllPendingCashPayments = async () => {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *, 
        plans(name), 
        user_profiles(name, email, is_bio_metric_active),
        coupons(code, name, discount_type, discount_value)
      `)
      .eq("is_cash_approval", false)
      .eq("is_active", false)
      .like("payment_id", "CASH_%")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const formattedData = data.map((item: any) => ({
      plan: item.plans,
      user: item.user_profiles,
      coupon: item.coupons,
      ...item,
    }));

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

// UPDATED: Cash payment approval with smart biometric handling
export const approveCashPayment = async (subscriptionId: number) => {
  try {
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("user_id, coupon_id")
      .eq("id", subscriptionId)
      .single();

    if (fetchError) throw fetchError;

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("id, name, email, is_bio_metric_active, biometric_device_id")
      .eq("id", subscription.user_id)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
    }

    // Approve the subscription
    const { data, error } = await supabase
      .from("subscriptions")
      .update({
        is_cash_approval: true,
        is_active: true,
      })
      .eq("id", subscriptionId)
      .select("user_id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Mark user as customer
    await supabase.from("user_profiles").update({
      is_customer: true,
    }).eq("id", data.user_id);

    // Update subscription status
    await updateUserSubscriptionStatus(data.user_id);

    // SMART BIOMETRIC HANDLING
    if (userData) {
      console.log(`🔐 Processing biometric for user ${userData.name} (ID: ${userData.id}) after cash approval`);
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
        // Don't fail the approval if biometric fails
      }
    }

    // If coupon was used, increment usage count
    if (subscription.coupon_id) {
      const { data: couponData, error: couponError } = await supabase
        .from("coupons")
        .select("used_count")
        .eq("id", subscription.coupon_id)
        .single();

      if (!couponError && couponData) {
        await supabase
          .from("coupons")
          .update({ 
            used_count: couponData.used_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq("id", subscription.coupon_id);
      }
    }

    return {
      success: true,
      message: "Cash payment approved successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const rejectCashPayment = async (subscriptionId: number) => {
  try {
    // Get user_id before deletion
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

    if (error) {
      throw new Error(error.message);
    }

    // Update subscription_status after rejection
    if (subData?.user_id) {
      await updateUserSubscriptionStatus(subData.user_id);
    }

    return {
      success: true,
      message: "Cash payment request rejected and removed",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};
