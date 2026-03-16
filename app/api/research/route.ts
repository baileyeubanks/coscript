import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const supabase = await createSupabaseAuth();

  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") || "created_at";
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const { data: items, error } = await supabase
    .from("research_items")
    .select("*")
    .eq("user_id", user.id)
    .order(sort === "outlier_score" ? "outlier_score" : "created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items });
}
