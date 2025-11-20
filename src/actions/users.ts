"use server";

import supabase from "@/config/supabase-config";
import { currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { updateUserSubscriptionStatus } from "./subscriptions";

export const getCurrentUserFromSupabase = async () => {
  try {
    const clerkUser = await currentUser();

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("clerk_user_id", clerkUser?.id);

    if (error) {
      throw error;
    }
    
    if (data && data.length) {
      const existingUser = data[0];
      const clerkImageUrl = clerkUser?.imageUrl || clerkUser?.imageUrl;
      
      // Update subscription_status when user logs in
      await updateUserSubscriptionStatus(existingUser.id);
      
      if (clerkImageUrl && existingUser.profile_image !== clerkImageUrl) {
        const { data: updatedUser, error: updateError } = await supabase
          .from("user_profiles")
          .update({ 
            profile_image: clerkImageUrl,
            clerk_url: clerkImageUrl
          })
          .eq("id", existingUser.id)
          .select("*");
          
        if (updateError) {
          console.error("Error updating user profile image:", updateError);
        } else {
          return {
            success: true,
            data: updatedUser[0],
          };
        }
      }
      
      return {
        success: true,
        data: existingUser,
      };
    }

    const clerkImageUrl = clerkUser?.imageUrl || clerkUser?.imageUrl;
    
    const newUserObj = {
      clerk_user_id: clerkUser?.id,
      email: clerkUser?.emailAddresses[0].emailAddress,
      name: clerkUser?.firstName + " " + clerkUser?.lastName,
      is_active: true,
      is_admin: false,
      profile_image: clerkImageUrl || null,
      clerk_url: clerkImageUrl || null,
      subscription_status: false, // New users have no subscription
    };

    const { data: newUser, error: newUserError } = await supabase
      .from("user_profiles")
      .insert([newUserObj])
      .select("*");
      
    if (newUserError) {
      throw newUserError;
    }

    return {
      success: true,
      data: newUser[0],
    };

  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const updateUserContactNumber = async (contactNo: string) => {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      throw new Error("No authenticated user found");
    }

    if (!contactNo || contactNo.length < 10) {
      throw new Error("Please enter a valid contact number");
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .update({ contact_no: contactNo })
      .eq("clerk_user_id", clerkUser.id)
      .select("*");

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error("User not found");
    }

    return {
      success: true,
      data: data[0],
      message: "Contact number updated successfully"
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const checkProfileCompletion = async () => {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      throw new Error("No authenticated user found");
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("contact_no, name, email, id")
      .eq("clerk_user_id", clerkUser.id)
      .single();

    if (error) {
      throw error;
    }

    // Update subscription_status when checking profile
    await updateUserSubscriptionStatus(data.id);

    const isComplete = !!(data.contact_no && data.name && data.email);

    return {
      success: true,
      isComplete,
      missingFields: {
        contact_no: !data.contact_no,
        name: !data.name,
        email: !data.email
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase.from("user_profiles").select("*");
    if (error) {
      throw error;
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const getAllCustomers = async () => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("is_customer", true);
    if (error) {
      throw error;
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const deleteUserById = async (userId: string) => {
  try {
    console.log("Starting user deletion process for userId:", userId);

    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('clerk_user_id, name, email')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
      throw new Error('User not found in database');
    }

    console.log("Found user data:", userData);

    console.log("Deleting user subscriptions...");
    const { error: subscriptionsError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);

    if (subscriptionsError) {
      console.error('Error deleting subscriptions:', subscriptionsError);
    } else {
      console.log("Successfully deleted user subscriptions");
    }

    if (userData.clerk_user_id) {
      try {
        console.log("Deleting user from Clerk with ID:", userData.clerk_user_id);
        
        const clerk = await clerkClient();
        await clerk.users.deleteUser(userData.clerk_user_id);
        
        console.log("Successfully deleted user from Clerk");
      } catch (clerkError: any) {
        console.error('Error deleting user from Clerk:', clerkError);
        throw new Error(`Failed to delete user from Clerk: ${clerkError.message}`);
      }
    } else {
      console.log("No Clerk user ID found, skipping Clerk deletion");
    }

    console.log("Deleting user from Supabase...");
    const { error: supabaseError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (supabaseError) {
      console.error('Error deleting user from Supabase:', supabaseError);
      throw new Error('Failed to delete user from database');
    }

    console.log("Successfully deleted user from Supabase");

    return {
      success: true,
      message: "User and all associated data deleted successfully from both Clerk and Supabase"
    };
  } catch (error: any) {
    console.error("Delete user error:", error);
    return {
      success: false,
      message: error.message || "Failed to delete user"
    };
  }
};

export const getUserSubscriptionCount = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      count: count || 0
    };
  } catch (error: any) {
    return {
      success: false,
      count: 0,
      message: error.message
    };
  }
};

export const updateCustomerContactNumber = async (customerId: string, contactNo: string) => {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      throw new Error("No authenticated user found");
    }

    const { data: adminData, error: adminError } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("clerk_user_id", clerkUser.id)
      .single();

    if (adminError || !adminData?.is_admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    if (!contactNo || contactNo.length < 10) {
      throw new Error("Please enter a valid contact number (minimum 10 digits)");
    }

    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(contactNo)) {
      throw new Error("Contact number should contain only digits (10-15 characters)");
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .update({ contact_no: contactNo })
      .eq("id", customerId)
      .select("*");

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error("Customer not found");
    }

    return {
      success: true,
      data: data[0],
      message: "Customer contact number updated successfully"
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const getCustomerById = async (customerId: string) => {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      throw new Error("No authenticated user found");
    }

    const { data: adminData, error: adminError } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("clerk_user_id", clerkUser.id)
      .single();

    if (adminError || !adminData?.is_admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", customerId)
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};
