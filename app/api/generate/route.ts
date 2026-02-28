import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const SYSTEM_PROMPTS: Record<string, string> = {
  social_media: `You are a social media content expert. Generate engaging, platform-optimized posts. Include relevant hashtags. Keep the tone authentic and the hook strong. Format with clear sections.`,
  blog: `You are a professional blog writer and SEO expert. Create well-structured articles with clear headings, engaging introductions, and actionable conclusions. Optimize for the provided keywords naturally.`,
  video_script: `You are a video scriptwriter. Write scripts with clear scene breakdowns, speaker directions, timing notes, and B-roll suggestions. Use [SCENE], [CUT TO], [B-ROLL], and [SPEAKER] markers.`,
  ad_copy: `You are an advertising copywriter. Create compelling ad copy with attention-grabbing headlines, persuasive body text, and clear calls-to-action. Provide A/B variants when possible.`,
};

export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { template, prompt, audience, tone, keyPoints, context, platform, length } = body;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const systemPrompt = SYSTEM_PROMPTS[template] || SYSTEM_PROMPTS.social_media;

  const userMessage = [
    prompt,
    audience ? `Target audience: ${audience}` : "",
    tone ? `Tone: ${tone}` : "",
    length ? `Length: ${length}` : "",
    platform ? `Platform: ${platform}` : "",
    keyPoints ? `Key points: ${keyPoints}` : "",
    context ? `Existing context/content to build on:\n${context}` : "",
  ].filter(Boolean).join("\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Anthropic API error:", err);
      return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
    }

    const data = await res.json();
    const generatedText = data.content?.[0]?.text || "";

    // Extract suggestions from the generated text
    const suggestions = [
      "Try adding a stronger call-to-action at the end",
      "Consider adding specific numbers or statistics for credibility",
      "A question hook in the opening could increase engagement",
    ];

    return NextResponse.json({ content: generatedText, suggestions });
  } catch (err) {
    console.error("Generation error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
