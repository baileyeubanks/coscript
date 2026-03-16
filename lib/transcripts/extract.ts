/**
 * Transcript Extraction
 *
 * Extracts video transcripts from YouTube captions.
 * Stores results in the transcripts table.
 */

import { getSupabase } from "@/lib/supabase";
import { fetchTranscriptText } from "@/lib/youtube/api";

export interface TranscriptResult {
  videoId: string;
  content: string;
  source: "youtube_captions" | "manual";
  wordCount: number;
}

/**
 * Extract transcript for a video and store in database.
 * Tries YouTube captions first (free, fast).
 */
export async function extractTranscript(
  videoDbId: string,
  youtubeId: string
): Promise<TranscriptResult | null> {
  const supabase = getSupabase();

  // Check if transcript already exists
  const { data: existing } = await supabase
    .from("transcripts")
    .select("id")
    .eq("video_id", videoDbId)
    .maybeSingle();

  if (existing) {
    // Already extracted
    return null;
  }

  // Try YouTube captions
  const text = await fetchTranscriptText(youtubeId);
  if (!text) {
    console.log(`[transcripts] No captions available for ${youtubeId}`);
    return null;
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Store transcript
  const { error } = await supabase.from("transcripts").insert({
    video_id: videoDbId,
    content: text,
    source: "youtube_captions",
    language: "en",
    word_count: wordCount,
  });

  if (error) {
    console.error("[transcripts] Insert error:", error.message);
    return null;
  }

  // Mark video as having transcript
  await supabase
    .from("videos")
    .update({ has_transcript: true })
    .eq("id", videoDbId);

  return {
    videoId: videoDbId,
    content: text,
    source: "youtube_captions",
    wordCount,
  };
}
