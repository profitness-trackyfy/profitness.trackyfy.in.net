import { NextRequest, NextResponse } from "next/server";
import supabase from "@/config/supabase-config";
import { syncUserBlockStatus } from "@/actions/biometric";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting biometric access sync...");

    // Get all users with biometric access
    const { data: users, error } = await supabase
      .from("user_profiles")
      .select("id, name, subscription_status, is_bio_metric_active")
      .eq("is_bio_metric_active", true);

    if (error) {
      throw error;
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Sync each user
    for (const user of users) {
      try {
        const result = await syncUserBlockStatus(user.id);
        
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }

        results.push({
          userId: user.id,
          userName: user.name,
          subscriptionStatus: user.subscription_status,
          ...result,
        });

        // Small delay between users
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        failureCount++;
        results.push({
          userId: user.id,
          userName: user.name,
          success: false,
          message: error.message,
        });
      }
    }

    console.log(`Biometric sync completed: ${successCount} success, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Synced ${users.length} users`,
      successCount,
      failureCount,
      results,
    });
  } catch (error: any) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
