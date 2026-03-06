import { NextResponse } from "next/server";
import { STYLE_TEMPLATES } from "@/lib/psychology-engine";
import { requireAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

// GET /api/wizard/styles — return system styles + user's vault styles
export async function GET() {
  const user = await requireAuth();

  // Get user's saved vault styles (if authenticated)
  let vaultStyles: Array<{ id: string; name: string; description: string; source_url?: string }> = [];
  if (user) {
    const { data } = await getSupabase()
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
  }

  return NextResponse.json({
    system_styles: STYLE_TEMPLATES,
    vault_styles: vaultStyles,
  });
}
