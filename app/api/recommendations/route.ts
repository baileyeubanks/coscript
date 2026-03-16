import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import {
  getRelatedOutliers,
  getRecommendedTopics,
  getRecommendedHooks,
} from "@/lib/recommendations";

/**
 * GET /api/recommendations — Personalized recommendations
 * Query params: videoId (for related), topic (for hook suggestions), limit
 */
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const url = new URL(req.url);
  const videoId = url.searchParams.get("videoId");
  const topic = url.searchParams.get("topic");
  const limit = parseInt(url.searchParams.get("limit") || "10");

  const result: Record<string, unknown> = {};

  // If videoId provided, get related outliers
  if (videoId) {
    result.related_outliers = await getRelatedOutliers(videoId, user.id, limit);
  }

  // If topic provided, get recommended hooks
  if (topic) {
    result.recommended_hooks = await getRecommendedHooks(user.id, topic, limit);
  }

  // Always include trending topics
  result.trending_topics = await getRecommendedTopics(user.id, limit);

  return NextResponse.json(result);
}
