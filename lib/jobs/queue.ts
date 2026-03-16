/**
 * Ingestion Job Queue
 *
 * Simple job queue backed by the ingestion_jobs Supabase table.
 * Supports: channel_sync, video_fetch, transcript_extract, pattern_extract
 */

import { getSupabase } from "@/lib/supabase";

export type JobType =
  | "channel_sync"
  | "video_fetch"
  | "transcript_extract"
  | "pattern_extract";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface IngestionJob {
  id: string;
  user_id: string;
  type: JobType;
  status: JobStatus;
  payload: Record<string, unknown>;
  result: Record<string, unknown>;
  error: string | null;
  attempts: number;
  max_attempts: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

/**
 * Enqueue a new ingestion job.
 */
export async function enqueueJob(
  userId: string,
  type: JobType,
  payload: Record<string, unknown> = {}
): Promise<IngestionJob | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("ingestion_jobs")
    .insert({
      user_id: userId,
      type,
      status: "pending",
      payload,
    })
    .select()
    .single();

  if (error) {
    console.error("[queue] Failed to enqueue job:", error.message);
    return null;
  }

  return data as IngestionJob;
}

/**
 * Claim the next pending job for processing.
 * Uses update with filter to prevent race conditions.
 */
export async function claimNextJob(
  type?: JobType
): Promise<IngestionJob | null> {
  const supabase = getSupabase();

  // Find the oldest pending job
  let query = supabase
    .from("ingestion_jobs")
    .select("id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1);

  if (type) {
    query = query.eq("type", type);
  }

  const { data: candidates } = await query;
  if (!candidates?.length) return null;

  // Claim it atomically
  const { data, error } = await supabase
    .from("ingestion_jobs")
    .update({
      status: "processing",
      started_at: new Date().toISOString(),
      attempts: candidates[0].id ? 1 : 1, // Will be incremented properly below
    })
    .eq("id", candidates[0].id)
    .eq("status", "pending") // Ensure it hasn't been claimed by another worker
    .select()
    .single();

  if (error || !data) return null;

  // Increment attempts
  await supabase
    .from("ingestion_jobs")
    .update({ attempts: (data.attempts || 0) + 1 })
    .eq("id", data.id);

  return data as IngestionJob;
}

/**
 * Mark a job as completed with results.
 */
export async function completeJob(
  jobId: string,
  result: Record<string, unknown> = {}
): Promise<void> {
  const supabase = getSupabase();

  await supabase
    .from("ingestion_jobs")
    .update({
      status: "completed",
      result,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

/**
 * Mark a job as failed with error message.
 * If under max_attempts, resets to pending for retry.
 */
export async function failJob(
  jobId: string,
  errorMessage: string
): Promise<void> {
  const supabase = getSupabase();

  // Get current attempt count
  const { data: job } = await supabase
    .from("ingestion_jobs")
    .select("attempts, max_attempts")
    .eq("id", jobId)
    .single();

  const shouldRetry =
    job && (job.attempts || 0) < (job.max_attempts || 3);

  await supabase
    .from("ingestion_jobs")
    .update({
      status: shouldRetry ? "pending" : "failed",
      error: errorMessage,
      completed_at: shouldRetry ? null : new Date().toISOString(),
    })
    .eq("id", jobId);
}

/**
 * Get job queue status for a user.
 */
export async function getQueueStatus(userId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("ingestion_jobs")
    .select("type, status")
    .eq("user_id", userId);

  if (error || !data) return { pending: 0, processing: 0, completed: 0, failed: 0 };

  const counts = { pending: 0, processing: 0, completed: 0, failed: 0 };
  for (const job of data) {
    if (job.status in counts) {
      counts[job.status as keyof typeof counts]++;
    }
  }

  return counts;
}

/**
 * Get recent jobs for a user.
 */
export async function getRecentJobs(
  userId: string,
  limit = 20
): Promise<IngestionJob[]> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from("ingestion_jobs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as IngestionJob[];
}
