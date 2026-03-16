/**
 * Outlier Scoring Engine
 *
 * Computes outlier scores for videos based on expected vs actual views.
 * A video is an "outlier" when it significantly overperforms the channel's baseline.
 *
 * Score = actual_views / expected_views (median of channel's recent videos)
 * Thresholds: >= 3.0 = outlier, >= 5.0 = viral, >= 10.0 = mega-outlier
 */

import { getSupabase } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────────

export interface OutlierThresholds {
  outlier: number;
  viral: number;
  megaOutlier: number;
}

export const OUTLIER_THRESHOLDS: OutlierThresholds = {
  outlier: 3.0,
  viral: 5.0,
  megaOutlier: 10.0,
};

export type OutlierLabel = "outlier" | "viral" | "mega-outlier" | null;

export function getOutlierLabel(score: number): OutlierLabel {
  if (score >= OUTLIER_THRESHOLDS.megaOutlier) return "mega-outlier";
  if (score >= OUTLIER_THRESHOLDS.viral) return "viral";
  if (score >= OUTLIER_THRESHOLDS.outlier) return "outlier";
  return null;
}

// ── Core computation ─────────────────────────────────────────────────────────

/**
 * Compute expected views for a channel using rolling median of recent videos.
 * Uses the last 30 videos (or all available) as the baseline.
 */
export async function computeExpectedViews(channelId: string): Promise<number> {
  const supabase = getSupabase();

  const { data: videos } = await supabase
    .from("videos")
    .select("view_count, published_at")
    .eq("channel_id", channelId)
    .order("published_at", { ascending: false })
    .limit(30);

  if (!videos?.length) return 0;

  // Use median for robustness against outliers skewing the baseline
  const views = videos.map((v) => Number(v.view_count)).sort((a, b) => a - b);
  const mid = Math.floor(views.length / 2);
  const median =
    views.length % 2 === 0
      ? (views[mid - 1] + views[mid]) / 2
      : views[mid];

  return Math.max(median, 1); // Avoid division by zero
}

/**
 * Compute outlier score for a single video.
 * Applies an age decay factor for videos < 7 days old (views haven't stabilized yet).
 */
export function computeOutlierScore(
  viewCount: number,
  expectedViews: number,
  publishedAt?: string
): number {
  if (expectedViews <= 0) return 0;

  let score = viewCount / expectedViews;

  // Age decay: videos < 7 days old get a conservative adjustment
  // Their view counts haven't stabilized, so we discount proportionally
  if (publishedAt) {
    const ageHours =
      (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
    const ageDays = ageHours / 24;

    if (ageDays < 7) {
      // Linear ramp: at 0 days → 30% weight, at 7 days → 100% weight
      const decayFactor = 0.3 + 0.7 * (ageDays / 7);
      score *= decayFactor;
    }
  }

  return Math.round(score * 100) / 100; // 2 decimal places
}

/**
 * Score all videos for a channel and update the database.
 * Returns the number of videos scored.
 */
export async function scoreChannelVideos(channelId: string): Promise<number> {
  const supabase = getSupabase();
  const expectedViews = await computeExpectedViews(channelId);

  if (expectedViews <= 0) return 0;

  // Update the channel's avg_views_30d
  await supabase
    .from("channels")
    .update({ avg_views_30d: Math.round(expectedViews) })
    .eq("id", channelId);

  // Get all videos for this channel
  const { data: videos } = await supabase
    .from("videos")
    .select("id, view_count, published_at")
    .eq("channel_id", channelId);

  if (!videos?.length) return 0;

  let scored = 0;
  for (const video of videos) {
    const score = computeOutlierScore(
      Number(video.view_count),
      expectedViews,
      video.published_at
    );
    const label = getOutlierLabel(score);

    await supabase
      .from("videos")
      .update({ outlier_score: score, outlier_label: label })
      .eq("id", video.id);

    scored++;
  }

  return scored;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export interface OutlierQueryOptions {
  channelId?: string;
  minScore?: number;
  publishedAfter?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get top outlier videos across all of a user's watchlist channels.
 */
export async function getTopOutliers(
  userId: string,
  options: OutlierQueryOptions = {}
) {
  const supabase = getSupabase();
  const {
    channelId,
    minScore = OUTLIER_THRESHOLDS.outlier,
    publishedAfter,
    limit = 20,
    offset = 0,
  } = options;

  let query = supabase
    .from("videos")
    .select("*, channels!inner(title, handle, thumbnail_url)")
    .eq("user_id", userId)
    .gte("outlier_score", minScore)
    .order("outlier_score", { ascending: false })
    .range(offset, offset + limit - 1);

  if (channelId) {
    query = query.eq("channel_id", channelId);
  }

  if (publishedAfter) {
    query = query.gte("published_at", publishedAfter);
  }

  const { data, error } = await query;

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const, data: data || [] };
}
