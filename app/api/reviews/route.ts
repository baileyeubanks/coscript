import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function POST(req: Request) {
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { script_id, reviewer_name, reviewer_email, permissions, expires_days, client_id } = body;
  if (!script_id) return NextResponse.json({ error: "script_id required" }, { status: 400 });

  // Verify script ownership
  const { data: script } = await supabase
    .from("scripts")
    .select("id, client_id")
    .eq("id", script_id)
    .eq("user_id", user.id)
    .single();
  if (!script) return NextResponse.json({ error: "Script not found" }, { status: 404 });

  // Build branding from client if available
  let branding = {};
  const cid = client_id || script.client_id;
  if (cid) {
    const { data: client } = await supabase
      .from("clients")
      .select("name, logo_url, colors")
      .eq("id", cid)
      .single();
    if (client) {
      branding = {
        company_name: client.name,
        logo_url: client.logo_url,
        primary_color: client.colors?.primary,
      };
    }
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (expires_days || 7));

  const { data, error } = await supabase
    .from("review_links")
    .insert({
      script_id,
      client_id: cid,
      reviewer_name: reviewer_name || "",
      reviewer_email: reviewer_email || "",
      permissions: permissions || "comment",
      expires_at: expiresAt.toISOString(),
      branding,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review_link: data }, { status: 201 });
}
