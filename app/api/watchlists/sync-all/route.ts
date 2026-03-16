import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { syncAllWatchlists } from "@/lib/youtube/ingest";

/**
 * POST /api/watchlists/sync-all — Trigger sync for all user watchlists
 */
export async function POST() {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const results = await syncAllWatchlists(user.id);

  return NextResponse.json({
    success: true,
    synced: results.length,
    results,
  });
}
