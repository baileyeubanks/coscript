import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function GET(req: Request) {
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const industry = url.searchParams.get("industry");
  const search = url.searchParams.get("q");

  let query = supabase
    .from("templates")
    .select("*")
    .or(`is_system.eq.true,user_id.eq.${user.id}`)
    .order("is_system", { ascending: false })
    .order("name");

  if (category) query = query.eq("category", category);
  if (industry) query = query.eq("industry", industry);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data || [] });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, category, industry, platform, description, structure, example_content, prompt_instructions, variables } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("templates")
    .insert({
      user_id: user.id,
      name: name.trim(),
      category: category || "video_script",
      industry,
      platform,
      description,
      structure,
      example_content,
      prompt_instructions,
      variables,
      is_system: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data }, { status: 201 });
}
