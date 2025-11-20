// src/app/api/cron/daily-sync/route.ts

import { NextRequest, NextResponse } from "next/server";
import supabase from "@/config/supabase-config";
import {
  blockUserOnAllDevices,
  unblockUserOnAllDevices,
  getAllBiometricUsers,
} from "@/actions/biometric";
import dayjs from "dayjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max execution time

// Type definition for subscription with user profile
interface SubscriptionWithUser {
  id: number;
  user_id: number;
  end_date: string;
  is_active: boolean;
  user_profiles: {
    id: number;
    name: string;
    email: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized cron request - invalid token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Starting daily sync (subscriptions + biometric)...");

    const results = {
      subscriptions: {
        total_checked: 0,
        expired: 0,
        users_updated: 0,
      },
      biometric: {
        total_checked: 0,
        blocked: 0,
        unblocked: 0,
        errors: 0,
      },
      timestamp: new Date().toISOString(),
    };

    // ==========================================
    // PART 1: SYNC SUBSCRIPTIONS
    // ==========================================
    console.log("\n📋 STEP 1: Syncing subscriptions...");

    const { data: subscriptions, error: fetchError } = await supabase
      .from("subscriptions")
      .select(
        `
        id,
        user_id,
        end_date,
        is_active,
        user_profiles!inner (
          id,
          name,
          email
        )
      `
      )
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
    } else {
      // Cast to proper type
      const typedSubscriptions = subscriptions as unknown as SubscriptionWithUser[];
      
      results.subscriptions.total_checked = typedSubscriptions?.length || 0;
      const today = dayjs().format("YYYY-MM-DD");

      for (const subscription of typedSubscriptions || []) {
        const endDate = dayjs(subscription.end_date).format("YYYY-MM-DD");
        const isExpired = dayjs(endDate).isBefore(today);

        if (isExpired && subscription.is_active) {
          // Now user_profiles is correctly typed as an object
          const userName = subscription.user_profiles?.name || "Unknown User";
          
          console.log(
            `⏰ Expiring subscription ID ${subscription.id} for user ${userName}`
          );

          const { error: updateSubError } = await supabase
            .from("subscriptions")
            .update({ is_active: false })
            .eq("id", subscription.id);

          if (!updateSubError) {
            results.subscriptions.expired++;

            const { error: updateUserError } = await supabase
              .from("user_profiles")
              .update({ subscription_status: false })
              .eq("id", subscription.user_id);

            if (!updateUserError) {
              results.subscriptions.users_updated++;
              console.log(`✅ Updated user ${userName} subscription status`);
            } else {
              console.error(`❌ Failed to update user ${userName}:`, updateUserError);
            }
          } else {
            console.error(`❌ Failed to expire subscription ${subscription.id}:`, updateSubError);
          }
        }
      }
    }

    console.log(`✅ Subscriptions synced: ${results.subscriptions.expired} expired`);

    // ==========================================
    // PART 2: SYNC BIOMETRIC ACCESS
    // ==========================================
    console.log("\n🔐 STEP 2: Syncing biometric access...");

    const biometricUsersResult = await getAllBiometricUsers();

    if (biometricUsersResult.success && biometricUsersResult.data) {
      const biometricUsers = biometricUsersResult.data;
      results.biometric.total_checked = biometricUsers.length;

      for (const user of biometricUsers) {
        try {
          if (!user.is_bio_metric_active || !user.biometric_device_id) {
            console.log(`⏭️ Skipping ${user.name} - no biometric setup`);
            continue;
          }

          const { data: userProfile, error: userError } = await supabase
            .from("user_profiles")
            .select("subscription_status")
            .eq("id", user.id)
            .single();

          if (userError) {
            console.error(`❌ Error fetching profile for ${user.name}:`, userError);
            results.biometric.errors++;
            continue;
          }

          const hasActiveSubscription = userProfile?.subscription_status === true;

          // Unblock if subscription is active but access is blocked
          if (hasActiveSubscription && !user.bio_metric_access) {
            console.log(`🔓 Unblocking user ${user.name} (ID: ${user.id})`);
            const result = await unblockUserOnAllDevices(user.id, user.name);
            
            if (result.success) {
              results.biometric.unblocked++;
              console.log(`✅ Successfully unblocked ${user.name}`);
            } else {
              console.error(`❌ Failed to unblock ${user.name}:`, result.message);
              results.biometric.errors++;
            }
          }
          // Block if subscription is inactive but access is granted
          else if (!hasActiveSubscription && user.bio_metric_access) {
            console.log(`🔒 Blocking user ${user.name} (ID: ${user.id})`);
            const result = await blockUserOnAllDevices(user.id, user.name);
            
            if (result.success) {
              results.biometric.blocked++;
              console.log(`✅ Successfully blocked ${user.name}`);
            } else {
              console.error(`❌ Failed to block ${user.name}:`, result.message);
              results.biometric.errors++;
            }
          } else {
            console.log(
              `✓ User ${user.name} already in correct state (sub: ${hasActiveSubscription}, access: ${user.bio_metric_access})`
            );
          }

          // Delay to avoid overwhelming API
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error: any) {
          console.error(`❌ Error processing user ${user.name}:`, error);
          results.biometric.errors++;
        }
      }
    } else {
      console.log("ℹ️ No biometric users found or failed to fetch");
    }

    console.log(
      `✅ Biometric synced: ${results.biometric.blocked} blocked, ${results.biometric.unblocked} unblocked, ${results.biometric.errors} errors`
    );

    // ==========================================
    // RETURN COMBINED RESULTS
    // ==========================================
    const response = {
      success: true,
      message: "Daily sync completed successfully",
      results,
    };

    console.log("\n✅ Daily sync completed:", JSON.stringify(response, null, 2));

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("❌ Daily sync failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
