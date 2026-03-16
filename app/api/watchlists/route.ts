import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { createSupabaseAuth } from "@/lib/supabase-auth";
import { resolveAndUpsertChannel } from "@/lib/youtube/ingest";
import { enqueueJob } from "@/lib/jobs/queue";

export async function GET() {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const supabase = await createSupabaseAuth();

  const { data: watchlists, error } = await supabase
    .from("watchlists")
    .select("*, channels(id, title, handle, thumbnail_url, subscriber_count, avg_views_30d, last_synced_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ watchlists });
}

export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const supabase = await createSupabaseAuth();

  const body = await req.json();
  const channelUrl = body.channel_url || "";

  // Create the watchlist first
  const { data: watchlist, error } = await supabase
    .from("watchlists")
    .insert({
      user_id: user.id,
      name: body.name,
      platform: body.platform || "youtube",
      channel_url: channelUrl,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-resolve YouTube channel and trigger initial sync
  if (channelUrl && body.platform !== "tiktok") {
    try {
      const resolved = await resolveAndUpsertChannel(user.id, channelUrl);
      if (resolved) {
        // Link watchlist to channel
        await supabase
          .from("watchlists")
          .update({ channel_ref_id: resolved.channelId })
          .eq("id", watchlist.id);

        // Enqueue initial channel sync job
        enqueueJob(user.id, "channel_sync", {
          channel_id: resolved.channelId,
          youtube_channel_id: resolved.youtubeChannel.id,
        }).catch((err) => console.error("[watchlists] Job enqueue error:", err));
      }
    } catch (err) {
      console.error("[watchlists] Channel resolve error:", err);
      // Non-fatal: watchlist is created, sync can be triggered manually later
    }
  }

  return NextResponse.json({ watchlist }, { status: 201 });
}
