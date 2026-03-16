import { NextResponse } from "next/server";
import { STYLE_TEMPLATES } from "@/lib/psychology-engine";
import { requireAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

// GET /api/wizard/styles — return system styles + user vault styles + creator voice profiles
export async function GET() {
  const user = await requireAuth();

  // Get user's saved vault styles (if authenticated)
  let vaultStyles: Array<{ id: string; name: string; description: string; source_url?: string }> = [];
  let creatorVoices: Array<{
    id: string;
    name: string;
    description: string;
    tone: string;
    pacing: string;
    structure: string;
    sentence_style: string;
    example_excerpt: string;
    channel_title: string;
    channel_thumbnail: string;
  }> = [];

  if (user) {
    const supabase = getSupabase();

    // Legacy vault styles
    const { data } = await supabase
      .from("vault_items")
      .select("id, title, content, source_url, tags")
      .eq("user_id", user.id)
      .contains("tags", ["style"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      vaultStyles = data.map((item) => ({
        id: `vault_${item.id}`,
        name: item.title,
        description: item.content?.slice(0, 100) || "",
        source_url: item.source_url,
      }));
    }

    // Creator voice profiles (auto-extracted from channel analysis)
    const { data: voiceData } = await supabase
      .from("style_templates")
      .select("id, name, description, tone, pacing, structure, sentence_style, example_excerpt, channels(title, thumbnail_url)")
      .eq("user_id", user.id)
      .eq("is_creator_voice", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (voiceData) {
      creatorVoices = voiceData.map((item) => {
        const ch = item.channels as any;
        return {
          id: `voice_${item.id}`,
          name: item.name,
          description: item.description,
          tone: item.tone,
          pacing: item.pacing,
          structure: item.structure,
          sentence_style: item.sentence_style,
          example_excerpt: item.example_excerpt,
          channel_title: ch?.title || "",
          channel_thumbnail: ch?.thumbnail_url || "",
        };
      });
    }
  }

  return NextResponse.json({
    system_styles: STYLE_TEMPLATES,
    vault_styles: vaultStyles,
    creator_voices: creatorVoices,
  });
}
