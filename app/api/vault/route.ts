import { NextResponse } from "next/server";
import { getLocalAuthUser } from "@/lib/auth";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function GET() {
  const localUser = await getLocalAuthUser();
  if (localUser) return NextResponse.json({ items: [] });

  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: items, error } = await supabase
    .from("vault_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const localUser = await getLocalAuthUser();
  if (localUser) {
    const body = await req.json();
    return NextResponse.json(
      {
        item: {
          id: `local-vault-${Date.now()}`,
          title: body.title || "Untitled",
          content: body.content || "",
          source_url: body.source_url || "",
          source_type: body.source_type || "manual",
          tags: body.tags || [],
          notes: body.notes || "",
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  }

  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
