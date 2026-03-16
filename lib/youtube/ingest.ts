/**
 * YouTube Channel Sync Worker
 *
 * Fetches channel stats + latest videos from YouTube API,
 * upserts into channels/videos tables, triggers outlier scoring,
 * and enqueues transcript extraction for outlier videos.
 */

import { getSupabase } from "@/lib/supabase";
import {
  getChannelById,
  getChannelByUrl,
  getChannelVideos,
  type YouTubeChannel,
  type YouTubeVideo,
} from "./api";
import { scoreChannelVideos, OUTLIER_THRESHOLDS } from "@/lib/outlier-engine";
import { enqueueJob } from "@/lib/jobs/queue";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SyncResult {
  channelId: string;
  videosUpserted: number;
  outlierCount: number;
  transcriptsQueued: number;
}

// ── Channel resolution ───────────────────────────────────────────────────────

/**
 * Resolve a channel URL/handle and upsert into the channels table.
 * Returns the internal channel UUID.
 */
export async function resolveAndUpsertChannel(
  userId: string,
  channelUrl: string
): Promise<{ channelId: string; youtubeChannel: YouTubeChannel } | null> {
  const ytChannel = await getChannelByUrl(channelUrl);
  if (!ytChannel) return null;

  const supabase = getSupabase();

  // Upsert channel record
  const { data, error } = await supabase
    .from("channels")
    .upsert(
      {
        user_id: userId,
        youtube_id: ytChannel.id,
        title: ytChannel.title,
        handle: ytChannel.handle,
        description: ytChannel.description,
        subscriber_count: ytChannel.subscriberCount,
        total_videos: ytChannel.videoCount,
        thumbnail_url: ytChannel.thumbnailUrl,
        banner_url: ytChannel.bannerUrl,
        platform: "youtube",
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,youtube_id" }
    )
    .select("id")
    .single();

  if (error || !data) {
    console.error("[ingest] Channel upsert error:", error?.message);
    return null;
  }

  return { channelId: data.id, youtubeChannel: ytChannel };
}

// ── Video sync ───────────────────────────────────────────────────────────────

/**
 * Sync a channel: fetch latest videos, upsert, score outliers, queue transcripts.
 */
export async function syncChannel(
  userId: string,
  channelDbId: string,
  youtubeChannelId: string
): Promise<SyncResult> {
  const supabase = getSupabase();
  const result: SyncResult = {
    channelId: channelDbId,
    videosUpserted: 0,
    outlierCount: 0,
    transcriptsQueued: 0,
  };

  // Fetch latest 50 videos from YouTube
  const ytVideos = await getChannelVideos(youtubeChannelId, 50);

  // Upsert each video
  for (const ytVideo of ytVideos) {
    const { error } = await supabase.from("videos").upsert(
      {
        user_id: userId,
        channel_id: channelDbId,
        youtube_id: ytVideo.id,
        title: ytVideo.title,
        description: ytVideo.description,
        view_count: ytVideo.viewCount,
        like_count: ytVideo.likeCount,
        comment_count: ytVideo.commentCount,
        duration_seconds: ytVideo.durationSeconds,
        published_at: ytVideo.publishedAt,
        thumbnail_url: ytVideo.thumbnailUrl,
        tags: ytVideo.tags,
        platform: "youtube",
      },
      { onConflict: "user_id,youtube_id" }
    );

    if (!error) result.videosUpserted++;
  }

  // Score all videos for outlier detection
  await scoreChannelVideos(channelDbId);

  // Count outliers
  const { data: outliers } = await supabase
    .from("videos")
    .select("id")
    .eq("channel_id", channelDbId)
    .gte("outlier_score", OUTLIER_THRESHOLDS.outlier);

  result.outlierCount = outliers?.length || 0;

  // Queue transcript extraction for outlier videos that don't have transcripts yet
  const { data: outliersWithoutTranscripts } = await supabase
    .from("videos")
    .select("id, youtube_id")
    .eq("channel_id", channelDbId)
    .gte("outlier_score", OUTLIER_THRESHOLDS.outlier)
    .eq("has_transcript", false);

  if (outliersWithoutTranscripts) {
    for (const video of outliersWithoutTranscripts) {
      await enqueueJob(userId, "transcript_extract", {
        video_id: video.id,
        youtube_id: video.youtube_id,
      });
      result.transcriptsQueued++;
    }
  }

  // Update channel last_synced_at
  await supabase
    .from("channels")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", channelDbId);

  return result;
}

/**
 * Sync all active watchlists for a user.
 */
export async function syncAllWatchlists(
  userId: string
): Promise<SyncResult[]> {
  const supabase = getSupabase();

  const { data: watchlists } = await supabase
    .from("watchlists")
    .select("id, channel_id, channel_ref_id, channels(id, youtube_id)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!watchlists?.length) return [];

  const results: SyncResult[] = [];

  for (const watchlist of watchlists) {
    const channel = watchlist.channels as any;
    if (!channel?.youtube_id) continue;

    try {
      const result = await syncChannel(userId, channel.id, channel.youtube_id);
      results.push(result);
    } catch (err) {
      console.error(
        `[ingest] Failed to sync watchlist ${watchlist.id}:`,
        err
      );
    }
  }

  return results;
}
