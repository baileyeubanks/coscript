import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { createSupabaseAuth } from "@/lib/supabase-auth";

/**
 * GET /api/vault — List vault items with optional type filter
 * Query params: type (all|hook|style|reference|manual), limit
 */
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const supabase = await createSupabaseAuth();
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "all";
  const limit = parseInt(url.searchParams.get("limit") || "50");

  let query = supabase
    .from("vault_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Filter by type via tags or source_type
  if (type === "hook") {
    query = query.contains("tags", ["hook"]);
  } else if (type === "style") {
    query = query.contains("tags", ["style"]);
  } else if (type === "reference") {
    query = query.neq("source_url", "");
  } else if (type === "manual") {
    query = query.eq("source_type", "manual");
  }

  const { data: items, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const supabase = await createSupabaseAuth();

  const body = await req.json();
  const { data: item, error } = await supabase
    .from("vault_items")
    .insert({
      user_id: user.id,
      title: body.title,
      content: body.content || "",
      source_url: body.source_url || "",
      source_type: body.source_type || "manual",
      tags: body.tags || [],
      notes: body.notes || "",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item }, { status: 201 });
}
