import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createSupabaseAuth();

  const { data: link } = await supabase
    .from("review_links")
    .select("id, script_id, status, expires_at")
    .eq("token", token)
    .single();

  if (!link || link.status !== "active" || new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 410 });
  }

  const { data: comments, error } = await supabase
    .from("script_comments")
    .select("*")
    .eq("script_id", link.script_id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: comments || [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createSupabaseAuth();

  const { data: link } = await supabase
    .from("review_links")
    .select("id, script_id, permissions, reviewer_name, reviewer_email, status, expires_at")
    .eq("token", token)
    .single();

  if (!link || link.status !== "active" || new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 410 });
  }

  if (link.permissions === "view") {
    return NextResponse.json({ error: "No comment permission" }, { status: 403 });
  }

  const body = await req.json();
  const { body: commentBody, line_number, reviewer_name } = body;
  if (!commentBody?.trim()) return NextResponse.json({ error: "Comment body required" }, { status: 400 });

  const { data, error } = await supabase
    .from("script_comments")
    .insert({
      script_id: link.script_id,
      author_name: reviewer_name || link.reviewer_name || "Reviewer",
      author_email: link.reviewer_email,
      body: commentBody.trim(),
      line_number,
      is_external: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data }, { status: 201 });
}
