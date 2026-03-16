import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { getQueueStatus, getRecentJobs } from "@/lib/jobs/queue";

/**
 * GET /api/jobs/status — Get job queue status + recent jobs
 */
export async function GET() {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const [status, recentJobs] = await Promise.all([
    getQueueStatus(user.id),
    getRecentJobs(user.id, 20),
  ]);

  return NextResponse.json({
    queue: status,
    recent: recentJobs,
  });
}
