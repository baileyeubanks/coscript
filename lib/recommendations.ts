/**
 * Recommendation Engine
 *
 * Provides "more like this" recommendations based on outlier patterns,
 * content similarity, and user behavior.
 */

import { getSupabase } from "@/lib/supabase";
import { OUTLIER_THRESHOLDS } from "@/lib/outlier-engine";

// ── Types ────────────────────────────────────────────────────────────────────

export interface VideoRecommendation {
  id: string;
  youtube_id: string;
  title: string;
  view_count: number;
  outlier_score: number;
  outlier_label: string | null;
  thumbnail_url: string;
  published_at: string;
  channel_title: string;
  reason: string;
}

export interface TopicRecommendation {
  topic: string;
  source: string;
  outlier_count: number;
  avg_outlier_score: number;
}

// ── Related outliers ─────────────────────────────────────────────────────────

/**
 * Find videos similar to a given video (same channel, similar tags/titles).
 */
export async function getRelatedOutliers(
  videoId: string,
  userId: string,
  limit = 10
): Promise<VideoRecommendation[]> {
  const supabase = getSupabase();

  // Get the source video
  const { data: sourceVideo } = await supabase
    .from("videos")
    .select("id, channel_id, title, tags")
    .eq("id", videoId)
    .single();

  if (!sourceVideo) return [];

  // Find other outlier videos from the same channel
  const { data: sameChannel } = await supabase
    .from("videos")
    .select("id, youtube_id, title, view_count, outlier_score, outlier_label, thumbnail_url, published_at, channels(title)")
    .eq("channel_id", sourceVideo.channel_id)
    .neq("id", videoId)
    .gte("outlier_score", OUTLIER_THRESHOLDS.outlier)
    .order("outlier_score", { ascending: false })
    .limit(Math.ceil(limit / 2));

  // Find outlier videos from other channels with similar keywords
  const titleWords = sourceVideo.title
    .toLowerCase()
    .split(/\s+/)
    .filter((w: string) => w.length > 3)
    .slice(0, 3);

  let crossChannel: any[] = [];
  if (titleWords.length > 0) {
    // Search by title keywords across all user's channels
    const { data } = await supabase
      .from("videos")
      .select("id, youtube_id, title, view_count, outlier_score, outlier_label, thumbnail_url, published_at, channels(title)")
      .eq("user_id", userId)
      .neq("channel_id", sourceVideo.channel_id)
      .gte("outlier_score", OUTLIER_THRESHOLDS.outlier)
      .order("outlier_score", { ascending: false })
      .limit(limit);

    // Client-side keyword filter
    crossChannel = (data || []).filter((v: any) => {
      const lowerTitle = v.title.toLowerCase();
      return titleWords.some((w: string) => lowerTitle.includes(w));
    });
  }

  const results: VideoRecommendation[] = [];

  for (const v of sameChannel || []) {
    const ch = v.channels as any;
    results.push({
      id: v.id,
      youtube_id: v.youtube_id,
      title: v.title,
      view_count: v.view_count,
      outlier_score: Number(v.outlier_score),
      outlier_label: v.outlier_label,
      thumbnail_url: v.thumbnail_url,
      published_at: v.published_at,
      channel_title: ch?.title || "",
      reason: "Same channel outlier",
    });
  }

  for (const v of crossChannel.slice(0, Math.floor(limit / 2))) {
    const ch = v.channels as any;
    results.push({
      id: v.id,
      youtube_id: v.youtube_id,
      title: v.title,
      view_count: v.view_count,
      outlier_score: Number(v.outlier_score),
      outlier_label: v.outlier_label,
      thumbnail_url: v.thumbnail_url,
      published_at: v.published_at,
      channel_title: ch?.title || "",
      reason: "Similar topic outlier",
    });
  }

  return results.slice(0, limit);
}

/**
 * Get recommended topics based on user's watchlist channels and outlier patterns.
 */
export async function getRecommendedTopics(
  userId: string,
  limit = 10
): Promise<TopicRecommendation[]> {
  const supabase = getSupabase();

  // Get all outlier videos for the user
  const { data: outliers } = await supabase
    .from("videos")
    .select("title, tags, outlier_score, channels(title)")
    .eq("user_id", userId)
    .gte("outlier_score", OUTLIER_THRESHOLDS.outlier)
    .order("outlier_score", { ascending: false })
    .limit(100);

  if (!outliers?.length) return [];

  // Extract common themes from titles and tags
  const wordFrequency: Record<string, { count: number; totalScore: number; source: string }> = {};
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "shall", "can", "need", "dare",
    "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
    "into", "through", "during", "before", "after", "above", "below",
    "this", "that", "these", "those", "i", "you", "he", "she", "it",
    "we", "they", "what", "which", "who", "when", "where", "why", "how",
    "not", "no", "nor", "but", "or", "and", "if", "then", "else", "so",
    "my", "your", "his", "her", "its", "our", "their", "me", "him",
  ]);

  for (const video of outliers) {
    const ch = video.channels as any;
    const words = video.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w: string) => w.length > 3 && !stopWords.has(w));

    for (const word of words) {
      if (!wordFrequency[word]) {
        wordFrequency[word] = { count: 0, totalScore: 0, source: ch?.title || "" };
      }
      wordFrequency[word].count++;
      wordFrequency[word].totalScore += Number(video.outlier_score);
    }

    // Also count tags
    for (const tag of video.tags || []) {
      const lowerTag = tag.toLowerCase();
      if (!wordFrequency[lowerTag]) {
        wordFrequency[lowerTag] = { count: 0, totalScore: 0, source: ch?.title || "" };
      }
      wordFrequency[lowerTag].count++;
      wordFrequency[lowerTag].totalScore += Number(video.outlier_score);
    }
  }

  // Sort by frequency * average score
  const topics = Object.entries(wordFrequency)
    .filter(([, v]) => v.count >= 2)
    .map(([topic, v]) => ({
      topic,
      source: v.source,
      outlier_count: v.count,
      avg_outlier_score: Math.round((v.totalScore / v.count) * 100) / 100,
    }))
    .sort((a, b) => b.outlier_count * b.avg_outlier_score - a.outlier_count * a.avg_outlier_score)
    .slice(0, limit);

  return topics;
}

/**
 * Find hook templates that match a given topic.
 */
export async function getRecommendedHooks(
  userId: string,
  topic: string,
  limit = 5
) {
  const supabase = getSupabase();

  // Get all hook templates for the user (including system ones)
  const { data: hooks } = await supabase
    .from("hook_templates")
    .select("*")
    .or(`user_id.eq.${userId},is_system.eq.true`)
    .order("scroll_stop_power", { ascending: false })
    .limit(50);

  if (!hooks?.length) return [];

  // Simple keyword matching
  const topicWords = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  const scored = hooks.map((hook) => {
    const hookLower = (hook.hook_text + " " + hook.source_title).toLowerCase();
    const matchCount = topicWords.filter((w) => hookLower.includes(w)).length;
    return { ...hook, relevance: matchCount };
  });

  // Return hooks sorted by relevance, then by scroll_stop_power
  return scored
    .sort((a, b) => b.relevance - a.relevance || b.scroll_stop_power - a.scroll_stop_power)
    .slice(0, limit);
}
