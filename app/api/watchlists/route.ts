import { NextResponse } from "next/server";
import { getLocalAuthUser } from "@/lib/auth";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function GET() {
  const localUser = await getLocalAuthUser();
  if (localUser) return NextResponse.json({ watchlists: [] });

  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: watchlists, error } = await supabase
    .from("watchlists")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ watchlists });
}

export async function POST(req: Request) {
  const localUser = await getLocalAuthUser();
  if (localUser) {
    const body = await req.json();
    return NextResponse.json(
      {
        watchlist: {
          id: `local-watchlist-${Date.now()}`,
          name: body.name || "Untitled Watchlist",
          platform: body.platform || "youtube",
          channel_url: body.channel_url || "",
          status: "active",
          last_synced_at: null,
        },
      },
      { status: 201 },
    );
  }

  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
