import { getSupabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { TEMPLATES } from "@/lib/draft-types";
import type { TemplateType } from "@/lib/draft-types";

export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sb = getSupabase();

  // Look up share link
  const { data: link } = await sb
    .from("share_links")
    .select("draft_id, expires_at")
    .eq("token", token)
    .single();

  if (!link) return notFound();

  // Check expiry
  if (new Date(link.expires_at) < new Date()) {
    return (
      <main style={{ maxWidth: 600, margin: "4rem auto", padding: "0 1rem", fontFamily: "Inter, sans-serif", color: "#edf3ff", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem" }}>Link Expired</h1>
        <p style={{ color: "#9caecc" }}>This shared link has expired. Ask the author for a new one.</p>
      </main>
    );
  }

  // Fetch draft
  const { data: draft } = await sb
    .from("drafts")
    .select("title, template_type, content, config, updated_at")
    .eq("id", link.draft_id)
    .single();

  if (!draft) return notFound();

  const templateLabel = TEMPLATES[draft.template_type as TemplateType]?.label || draft.template_type;

  return (
    <main style={{
      maxWidth: 720, margin: "2rem auto", padding: "0 1.5rem",
      fontFamily: "Inter, -apple-system, sans-serif", color: "#edf3ff",
    }}>
      <div style={{ borderBottom: "1px solid #2b4263", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
        <div style={{
          fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase",
          color: "#9caecc", fontWeight: 700, marginBottom: "0.3rem",
        }}>
          Shared from Co-Script by Content Co-op
        </div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: "0.3rem 0" }}>
          {draft.title || "Untitled"}
        </h1>
        <div style={{ display: "flex", gap: "0.8rem", fontSize: "0.75rem", color: "#9caecc" }}>
          <span>Template: {templateLabel}</span>
          <span>Updated: {new Date(draft.updated_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div style={{
        background: "#0f1a2d", border: "1px solid #2b4263", borderRadius: 12,
        padding: "1.5rem", lineHeight: 1.8, fontSize: "0.95rem",
        whiteSpace: "pre-wrap",
      }}>
        {draft.content || "No content yet."}
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.7rem", color: "#5a7a9e" }}>
        Created with Co-Script by Content Co-op
      </div>
    </main>
  );
}
