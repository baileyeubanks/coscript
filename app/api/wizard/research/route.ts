import { NextResponse } from "next/server";
import { AI_MODEL, getAnthropicHeaders } from "@/lib/ai-config";
import { RESEARCH_SYSTEM_PROMPT } from "@/lib/psychology-engine";
import { requireAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { OUTLIER_THRESHOLDS } from "@/lib/outlier-engine";

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { topic, audience, platform } = body;
  if (!topic?.trim())
    return NextResponse.json({ error: "Topic required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  // ── Fetch real outlier data from user's watchlists ──
  let outlierContext = "";
  let outlierReferences: Array<{
    id: string;
    title: string;
    view_count: number;
    outlier_score: number;
    channel_title: string;
  }> = [];

  const user = await requireAuth();
  if (user) {
    const supabase = getSupabase();
    const topicWords = topic.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);

    if (topicWords.length > 0) {
      // Get outlier videos that might be relevant to this topic
      const { data: outliers } = await supabase
        .from("videos")
        .select("id, title, view_count, outlier_score, channels(title)")
        .eq("user_id", user.id)
        .gte("outlier_score", OUTLIER_THRESHOLDS.outlier)
        .order("outlier_score", { ascending: false })
        .limit(50);

      if (outliers?.length) {
        // Client-side keyword filter for relevance
        const relevant = outliers.filter((v: any) => {
          const lowerTitle = v.title.toLowerCase();
          return topicWords.some((w: string) => lowerTitle.includes(w));
        }).slice(0, 5);

        if (relevant.length > 0) {
          outlierReferences = relevant.map((v: any) => ({
            id: v.id,
            title: v.title,
            view_count: v.view_count,
            outlier_score: Number(v.outlier_score),
            channel_title: (v.channels as any)?.title || "",
          }));

          outlierContext = `\n\nREAL OUTLIER VIDEOS ON SIMILAR TOPICS (from the user's watchlists — use these as inspiration):
${outlierReferences.map((v, i) => `${i + 1}. "${v.title}" by ${v.channel_title} — ${v.view_count.toLocaleString()} views, ${v.outlier_score}x outlier score`).join("\n")}

Use these real-world examples to ground your research with data-backed angles.`;
        }
      }
    }
  }

  const userPrompt = `Research this topic for a ${platform || "short-form video"} script:

TOPIC: ${topic}
TARGET AUDIENCE: ${audience || "general audience"}

Generate comprehensive research material that will make the script more compelling, shareable, and psychologically engaging. Focus on surprising facts, counterintuitive insights, and emotionally resonant angles.${outlierContext}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: getAnthropicHeaders(apiKey),
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 2048,
      system: RESEARCH_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "AI error", detail: err }, { status: 500 });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] || "{}");
    return NextResponse.json({
      ...parsed,
      outlier_references: outlierReferences,
    });
  } catch {
    return NextResponse.json({
      misconceptions: [],
      analogies: [],
      how_it_works: [],
      statistics: [],
      emotional_angles: { fear: "", aspiration: "", curiosity: "" },
      outlier_references: outlierReferences,
      raw: text,
    });
  }
}
