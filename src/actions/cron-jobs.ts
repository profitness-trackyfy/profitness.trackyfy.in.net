"use server";

import supabase from "@/config/supabase-config";

export const syncAllUserSubscriptionStatuses = async () => {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from("user_profiles")
      .select("id");

    if (usersError) throw usersError;

    // Update each user's subscription status
    const updates = users.map(async (user) => {
      try {
        await supabase.rpc('update_user_subscription_status', {
          user_id_param: user.id
        });
      } catch (error) {
        console.error(`Failed to update status for user ${user.id}:`, error);
      }
    });

    await Promise.all(updates);

    return {
      success: true,
      message: `Updated subscription status for ${users.length} users`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};
