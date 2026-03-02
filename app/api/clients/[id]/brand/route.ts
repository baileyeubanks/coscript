import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify client ownership
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data } = await supabase
    .from("brand_vaults")
    .select("*")
    .eq("client_id", id)
    .single();

  return NextResponse.json({ brand: data || null });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify client ownership
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const {
    voice_description,
    vocabulary,
    hook_style,
    cta_patterns,
    content_guidelines,
    tone_preferences,
    sample_scripts,
    platform_notes,
  } = body;

  // Upsert: check if brand vault exists
  const { data: existing } = await supabase
    .from("brand_vaults")
    .select("id")
    .eq("client_id", id)
    .single();

  const payload = {
    client_id: id,
    voice_description,
    vocabulary,
    hook_style,
    cta_patterns,
    content_guidelines,
    tone_preferences,
    sample_scripts,
    platform_notes,
  };

  let data;
  let error;
  if (existing) {
    ({ data, error } = await supabase
      .from("brand_vaults")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single());
  } else {
    ({ data, error } = await supabase
      .from("brand_vaults")
      .insert(payload)
      .select()
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brand: data });
}
