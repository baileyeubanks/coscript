import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function GET() {
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [scriptsRes, clientsRes, projectsRes, briefsRes, reviewsRes] = await Promise.all([
    supabase.from("scripts").select("id, status, score", { count: "exact" }).eq("user_id", user.id),
    supabase.from("clients").select("id", { count: "exact" }).eq("user_id", user.id),
    supabase.from("coscript_projects").select("id, status", { count: "exact" }).eq("user_id", user.id),
    supabase.from("coscript_briefs").select("id", { count: "exact" }).eq("user_id", user.id),
    supabase.from("review_links").select("id, status").eq("status", "active"),
  ]);

  const scripts = scriptsRes.data || [];
  const avgScore = scripts.length
    ? Math.round(scripts.reduce((sum, s) => sum + (s.score || 0), 0) / scripts.length)
    : 0;

  const statusCounts: Record<string, number> = {};
  scripts.forEach((s) => {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  });

  return NextResponse.json({
    total_scripts: scriptsRes.count || 0,
    total_clients: clientsRes.count || 0,
    total_projects: projectsRes.count || 0,
    total_briefs: briefsRes.count || 0,
    active_reviews: reviewsRes.data?.length || 0,
    avg_score: avgScore,
    status_breakdown: statusCounts,
  });
}
