import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createSupabaseAuth();

  // Fetch review link — no auth needed (public by token)
  const { data: link, error } = await supabase
    .from("review_links")
    .select("*, scripts(id, title, content, hook, script_type, tone, platform, score, score_breakdown, status)")
    .eq("token", token)
    .single();

  if (error || !link) return NextResponse.json({ error: "Review link not found" }, { status: 404 });

  // Check expiry
  if (link.status !== "active" || new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: "This review link has expired" }, { status: 410 });
  }

  // Check max views
  if (link.max_views && link.view_count >= link.max_views) {
    return NextResponse.json({ error: "Max views reached" }, { status: 410 });
  }

  // Increment view count
  await supabase
    .from("review_links")
    .update({ view_count: (link.view_count || 0) + 1 })
    .eq("id", link.id);

  // Fetch decisions
  const { data: decisions } = await supabase
    .from("review_decisions")
    .select("*")
    .eq("review_link_id", link.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    script: link.scripts,
    branding: link.branding,
    permissions: link.permissions,
    reviewer_name: link.reviewer_name,
    decisions: decisions || [],
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createSupabaseAuth();

  const { data: link } = await supabase
    .from("review_links")
    .select("id, script_id, permissions, status, expires_at")
    .eq("token", token)
    .single();

  if (!link || link.status !== "active" || new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 410 });
  }

  if (link.permissions !== "approve") {
    return NextResponse.json({ error: "No approval permission" }, { status: 403 });
  }

  const body = await req.json();
  const { decision, comment } = body;
  if (!decision || !["approved", "changes_requested"].includes(decision)) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("review_decisions")
    .insert({
      review_link_id: link.id,
      script_id: link.script_id,
      decision,
      comment: comment || "",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ decision: data }, { status: 201 });
}
