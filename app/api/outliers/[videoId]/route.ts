import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

/**
 * GET /api/outliers/:videoId — Single video detail with transcript + patterns
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const supabase = getSupabase();

  const { data: video, error } = await supabase
    .from("videos")
    .select("*, channels(title, handle, thumbnail_url), transcripts(*)")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (error || !video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  return NextResponse.json({ video });
}
