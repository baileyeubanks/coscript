import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";

const PIPELINE_STAGES = ["draft", "internal_review", "client_review", "approved", "produced", "delivered"];

export async function GET() {
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: scripts, error } = await supabase
    .from("scripts")
    .select("id, title, status, score, client_id, project_id, updated_at, clients(name)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const pipeline: Record<string, typeof scripts> = {};
  PIPELINE_STAGES.forEach((stage) => {
    pipeline[stage] = (scripts || []).filter((s) => s.status === stage);
  });

  return NextResponse.json({ pipeline, stages: PIPELINE_STAGES });
}
