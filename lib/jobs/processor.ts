/**
 * Ingestion Job Processor
 *
 * Claims and executes pending jobs from the ingestion_jobs queue.
 * Routes each job type to its handler function.
 */

import { claimNextJob, completeJob, failJob, type JobType } from "./queue";
import { syncChannel } from "@/lib/youtube/ingest";
import { extractTranscript } from "@/lib/transcripts/extract";
import { extractPatternsFromTranscript } from "@/lib/transcripts/analyze";
import { getSupabase } from "@/lib/supabase";

export interface ProcessResult {
  jobId: string;
  type: JobType;
  status: "completed" | "failed";
  result?: Record<string, unknown>;
  error?: string;
}

/**
 * Process the next pending job in the queue.
 * Returns null if no jobs are available.
 */
export async function processNextJob(
  type?: JobType
): Promise<ProcessResult | null> {
  const job = await claimNextJob(type);
  if (!job) return null;

  try {
    const result = await executeJob(job.type as JobType, job.payload, job.user_id);
    await completeJob(job.id, result);

    return {
      jobId: job.id,
      type: job.type as JobType,
      status: "completed",
      result,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error";
    await failJob(job.id, errorMessage);

    return {
      jobId: job.id,
      type: job.type as JobType,
      status: "failed",
      error: errorMessage,
    };
  }
}

/**
 * Process up to N jobs from the queue.
 */
export async function processBatch(
  maxJobs = 5,
  type?: JobType
): Promise<ProcessResult[]> {
  const results: ProcessResult[] = [];

  for (let i = 0; i < maxJobs; i++) {
    const result = await processNextJob(type);
    if (!result) break; // No more jobs
    results.push(result);
  }

  return results;
}

// ── Job type handlers ────────────────────────────────────────────────────────

async function executeJob(
  type: JobType,
  payload: Record<string, unknown>,
  userId: string
): Promise<Record<string, unknown>> {
  switch (type) {
    case "channel_sync":
      return handleChannelSync(payload, userId);
    case "transcript_extract":
      return handleTranscriptExtract(payload);
    case "pattern_extract":
      return handlePatternExtract(payload);
    case "video_fetch":
      return handleVideoFetch(payload, userId);
    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

async function handleChannelSync(
  payload: Record<string, unknown>,
  userId: string
): Promise<Record<string, unknown>> {
  const channelDbId = payload.channel_id as string;
  const youtubeChannelId = payload.youtube_channel_id as string;

  if (!channelDbId || !youtubeChannelId) {
    throw new Error("Missing channel_id or youtube_channel_id in payload");
  }

  const result = await syncChannel(userId, channelDbId, youtubeChannelId);
  return result as unknown as Record<string, unknown>;
}

async function handleTranscriptExtract(
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const videoDbId = payload.video_id as string;
  const youtubeId = payload.youtube_id as string;

  if (!videoDbId || !youtubeId) {
    throw new Error("Missing video_id or youtube_id in payload");
  }

  const result = await extractTranscript(videoDbId, youtubeId);
  if (!result) {
    return { extracted: false, reason: "No captions available" };
  }

  return {
    extracted: true,
    wordCount: result.wordCount,
    source: result.source,
  };
}

async function handlePatternExtract(
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const videoDbId = payload.video_id as string;

  if (!videoDbId) {
    throw new Error("Missing video_id in payload");
  }

  const result = await extractPatternsFromTranscript(videoDbId);
  return {
    hooksExtracted: result.hooks.length,
    patternsExtracted: result.patterns ? true : false,
  };
}

async function handleVideoFetch(
  payload: Record<string, unknown>,
  userId: string
): Promise<Record<string, unknown>> {
  // Video fetch is typically part of channel_sync, but can be triggered standalone
  const channelDbId = payload.channel_id as string;
  const youtubeChannelId = payload.youtube_channel_id as string;

  if (!channelDbId || !youtubeChannelId) {
    throw new Error("Missing channel_id or youtube_channel_id in payload");
  }

  const result = await syncChannel(userId, channelDbId, youtubeChannelId);
  return { videosUpserted: result.videosUpserted };
}
