import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify script ownership
  const { data: script } = await supabase
    .from("scripts")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch top-level comments with replies
  const { data: comments, error } = await supabase
    .from("script_comments")
    .select("*")
    .eq("script_id", id)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch replies
  const { data: replies } = await supabase
    .from("script_comments")
    .select("*")
    .eq("script_id", id)
    .not("parent_id", "is", null)
    .order("created_at", { ascending: true });

  const threaded = (comments || []).map((c) => ({
    ...c,
    replies: (replies || []).filter((r) => r.parent_id === c.id),
  }));

  return NextResponse.json({ comments: threaded });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { body: commentBody, line_number, char_start, char_end, parent_id } = body;
  if (!commentBody?.trim()) return NextResponse.json({ error: "Comment body required" }, { status: 400 });

  const { data, error } = await supabase
    .from("script_comments")
    .insert({
      script_id: id,
      user_id: user.id,
      author_name: user.email?.split("@")[0] || "User",
      author_email: user.email,
      body: commentBody.trim(),
      line_number,
      char_start,
      char_end,
      parent_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data }, { status: 201 });
}
