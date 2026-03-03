import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";

async function verifyScriptOwnership(supabase: Awaited<ReturnType<typeof createSupabaseAuth>>, scriptId: string, userId: string) {
  const { data } = await supabase.from("scripts").select("id").eq("id", scriptId).eq("user_id", userId).single();
  return !!data;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await verifyScriptOwnership(supabase, id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("production_notes")
    .select("*")
    .eq("script_id", id)
    .order("section_index", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data || [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await verifyScriptOwnership(supabase, id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { section_index, shot_type, equipment, location, talent, broll_description, estimated_duration_seconds, notes } = body;

  const { data, error } = await supabase
    .from("production_notes")
    .insert({
      script_id: id,
      section_index: section_index ?? 0,
      shot_type,
      equipment: equipment || [],
      location: location || "",
      talent: talent || [],
      broll_description: broll_description || "",
      estimated_duration_seconds: estimated_duration_seconds || 0,
      notes: notes || "",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data }, { status: 201 });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await verifyScriptOwnership(supabase, id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { note_id, ...updates } = body;
  if (!note_id) return NextResponse.json({ error: "note_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("production_notes")
    .update(updates)
    .eq("id", note_id)
    .eq("script_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await verifyScriptOwnership(supabase, id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const noteId = url.searchParams.get("note_id");
  if (!noteId) return NextResponse.json({ error: "note_id required" }, { status: 400 });

  const { error } = await supabase
    .from("production_notes")
    .delete()
    .eq("id", noteId)
    .eq("script_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
