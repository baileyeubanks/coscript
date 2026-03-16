import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { processBatch } from "@/lib/jobs/processor";
import type { JobType } from "@/lib/jobs/queue";

/**
 * POST /api/jobs/process — Trigger job processing
 * Body: { type?: JobType, max_jobs?: number }
 */
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  let body: { type?: JobType; max_jobs?: number } = {};
  try {
    body = await req.json();
  } catch {
    // No body is fine — process any type
  }

  const results = await processBatch(body.max_jobs || 5, body.type);

  return NextResponse.json({
    processed: results.length,
    results,
  });
}
