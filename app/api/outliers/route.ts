import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { getTopOutliers } from "@/lib/outlier-engine";

/**
 * GET /api/outliers — Outlier feed (paginated, filterable)
 *
 * Query params: channelId, minScore, publishedAfter, limit, offset
 */
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const url = new URL(req.url);
  const channelId = url.searchParams.get("channelId") || undefined;
  const minScore = parseFloat(url.searchParams.get("minScore") || "3");
  const publishedAfter = url.searchParams.get("publishedAfter") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const result = await getTopOutliers(user.id, {
    channelId,
    minScore,
    publishedAfter,
    limit,
    offset,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ outliers: result.data });
}
