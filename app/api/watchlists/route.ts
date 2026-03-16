import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function GET() {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const supabase = await createSupabaseAuth();

  const { data: watchlists, error } = await supabase
    .from("watchlists")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ watchlists });
}

export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const supabase = await createSupabaseAuth();

  const body = await req.json();
  const { data: watchlist, error } = await supabase
    .from("watchlists")
    .insert({
      user_id: user.id,
      name: body.name,
      platform: body.platform || "youtube",
      channel_url: body.channel_url || "",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ watchlist }, { status: 201 });
}
