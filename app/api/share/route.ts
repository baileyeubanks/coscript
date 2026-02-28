import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { draft_id } = body;

  if (!draft_id) return NextResponse.json({ error: "draft_id required" }, { status: 400 });

  const token = randomUUID().replace(/-/g, "").slice(0, 16);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const sb = getSupabase();
  const { error } = await sb.from("share_links").insert({
    draft_id,
    token,
    expires_at: expiresAt,
    created_by: user.id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token });
}
