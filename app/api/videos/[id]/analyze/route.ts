import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { extractTranscript } from "@/lib/transcripts/extract";
import { extractPatternsFromTranscript } from "@/lib/transcripts/analyze";

/**
 * POST /api/videos/:id/analyze — Trigger transcript extraction + pattern analysis
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const supabase = getSupabase();

  // Get the video
  const { data: video, error } = await supabase
    .from("videos")
    .select("id, youtube_id, title, has_transcript, has_patterns")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // Step 1: Extract transcript if not already done
  let transcriptResult = null;
  if (!video.has_transcript) {
    transcriptResult = await extractTranscript(video.id, video.youtube_id);
    if (!transcriptResult) {
      return NextResponse.json({
        error: "Could not extract transcript — no captions available",
      }, { status: 422 });
    }
  }

  // Step 2: Extract patterns
  const patternResult = await extractPatternsFromTranscript(video.id);

  return NextResponse.json({
    success: true,
    video_id: video.id,
    title: video.title,
    transcript_extracted: !!transcriptResult,
    transcript_word_count: transcriptResult?.wordCount || null,
    hooks_extracted: patternResult.hooks.length,
    patterns_extracted: !!patternResult.patterns,
    hooks: patternResult.hooks,
    patterns: patternResult.patterns,
  });
}
