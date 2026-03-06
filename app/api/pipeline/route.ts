import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

// POST /api/pipeline — Send script to CoDeliver for production
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { script_id } = body;
  if (!script_id)
    return NextResponse.json({ error: "script_id required" }, { status: 400 });

  // Get the script
  const { data: script, error } = await getSupabase()
    .from("scripts")
    .select("*")
    .eq("id", script_id)
    .eq("user_id", user.id)
    .single();

  if (error || !script)
    return NextResponse.json({ error: "Script not found" }, { status: 404 });

  // Call CoDeliver's pipeline endpoint
  const codeliverUrl = process.env.CODELIVER_URL || "https://codeliver.contentco-op.com";

  // Get the user's session token to forward auth
  const { data: { session } } = await getSupabase().auth.getSession();

  try {
    const pipelineRes = await fetch(`${codeliverUrl}/api/pipeline`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token || ""}`,
      },
      body: JSON.stringify({
        script_id: script.id,
        script_title: script.title,
        script_content: script.content,
        script_hook: script.hook,
        script_type: script.script_type,
        platform: script.platform,
      }),
    });

    if (!pipelineRes.ok) {
      const err = await pipelineRes.text();
      return NextResponse.json(
        { error: "CoDeliver pipeline failed", detail: err },
        { status: 500 }
      );
    }

    const result = await pipelineRes.json();

    // Update script status to indicate it's been sent to production
    await getSupabase()
      .from("scripts")
      .update({
        status: "in_production",
        score_breakdown: {
          ...script.score_breakdown,
          pipeline: {
            sent_at: new Date().toISOString(),
            codeliver_project_id: result.project?.id,
            codeliver_asset_id: result.asset?.id,
          },
        },
      })
      .eq("id", script_id);

    return NextResponse.json({
      success: true,
      script: {
        id: script.id,
        title: script.title,
        status: "in_production",
      },
      codeliver: result,
    });
  } catch (fetchError) {
    // If CoDeliver is not reachable, store the pipeline request locally
    await getSupabase()
      .from("scripts")
      .update({
        score_breakdown: {
          ...script.score_breakdown,
          pipeline: {
            queued_at: new Date().toISOString(),
            status: "queued",
            error: "CoDeliver not reachable",
          },
        },
      })
      .eq("id", script_id);

    return NextResponse.json(
      {
        success: false,
        queued: true,
        message: "Pipeline request queued — CoDeliver will process when available",
      },
      { status: 202 }
    );
  }
}
