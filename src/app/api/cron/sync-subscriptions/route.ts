import { syncAllUserSubscriptionStatuses } from "@/actions/cron-jobs";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron (optional security)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncAllUserSubscriptionStatuses();
  
  return NextResponse.json(result);
}

// Required for Vercel Cron
export const dynamic = 'force-dynamic';
export const revalidate = 0;
