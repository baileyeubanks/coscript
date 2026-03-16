import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { resolveAndUpsertChannel, syncChannel } from "@/lib/youtube/ingest";

/**
 * POST /api/watchlists/:id/sync — Trigger sync for a single watchlist
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const supabase = getSupabase();

  // Get the watchlist
  const { data: watchlist, error } = await supabase
    .from("watchlists")
    .select("*, channels(id, youtube_id)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !watchlist) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }

  let channel = watchlist.channels as any;

  // If no channel linked yet, resolve from URL
  if (!channel?.youtube_id) {
    const channelUrl = watchlist.channel_url || watchlist.channel_id;
    if (!channelUrl) {
      return NextResponse.json({ error: "No channel URL configured" }, { status: 400 });
    }

    const resolved = await resolveAndUpsertChannel(user.id, channelUrl);
    if (!resolved) {
      return NextResponse.json({ error: "Could not resolve YouTube channel" }, { status: 400 });
    }

    // Link watchlist to channel
    await supabase
      .from("watchlists")
      .update({ channel_ref_id: resolved.channelId })
      .eq("id", id);

    channel = { id: resolved.channelId, youtube_id: resolved.youtubeChannel.id };
  }

  // Sync the channel
  const result = await syncChannel(user.id, channel.id, channel.youtube_id);

  // Update watchlist last_synced_at
  await supabase
    .from("watchlists")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({
    success: true,
    ...result,
  });
}
