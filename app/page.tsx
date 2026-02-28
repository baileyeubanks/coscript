export const dynamic = "force-dynamic";

import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { TemplateType } from "@/lib/draft-types";

const templates: { type: TemplateType; label: string; desc: string; icon: string }[] = [
  { type: "social_media", label: "Social Media Post", desc: "Platform-optimized posts for Instagram, X, LinkedIn, or TikTok", icon: "📱" },
  { type: "blog", label: "Blog Article", desc: "Long-form content with SEO keywords and structured outlines", icon: "📝" },
  { type: "video_script", label: "Video Script", desc: "Scene-by-scene scripts with timing notes and B-roll cues", icon: "🎬" },
  { type: "ad_copy", label: "Ad Copy", desc: "Headline, body, CTA structures with A/B variant support", icon: "📢" },
];

export default async function Home() {
  const user = await requireAuth();
  if (!user) redirect("/login");

  // Fetch recent drafts
  const sb = getSupabase();
  const { data: drafts } = await sb
    .from("drafts")
    .select("id, title, template_type, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(6);

  return (
    <main className="shell">
      <header className="nav">
        <div className="brand">Content Co-op</div>
        <nav className="nav-links">
          <a href="https://contentco-op.com">Home</a>
          <a href="https://coedit.contentco-op.com">Co-Edit</a>
          <a className="active" href="#">Co-Script</a>
          <a href="https://codeliver.contentco-op.com">Co-Deliver</a>
        </nav>
        <div>
          <Link className="button" href="/api/auth/logout">Sign Out</Link>
        </div>
      </header>

      <section style={{ marginTop: "2rem" }}>
        <div className="kicker">Choose a template</div>
        <h1>What are you writing?</h1>
        <p className="muted" style={{ maxWidth: 540, marginBottom: "1.5rem" }}>
          Select a content template to get started. AI will help you draft, refine, and export.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.8rem" }}>
          {templates.map((t) => (
            <Link
              key={t.type}
              href={`/editor?template=${t.type}`}
              className="panel"
              style={{ display: "block", textDecoration: "none", transition: "border-color 0.2s", cursor: "pointer" }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{t.icon}</div>
              <strong style={{ fontSize: "1rem" }}>{t.label}</strong>
              <p className="muted" style={{ fontSize: "0.8rem", marginTop: "0.3rem" }}>{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {drafts && drafts.length > 0 && (
        <section style={{ marginTop: "2.5rem", paddingBottom: "3rem" }}>
          <div className="kicker">Recent drafts</div>
          <div style={{ display: "grid", gap: "0.4rem", marginTop: "0.6rem" }}>
            {drafts.map((d: any) => (
              <Link
                key={d.id}
                href={`/editor?id=${d.id}`}
                className="variant-item"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none" }}
              >
                <div>
                  <strong>{d.title || "Untitled"}</strong>
                  <span className="pill" style={{ marginLeft: "0.5rem" }}>{d.template_type}</span>
                </div>
                <span style={{ fontSize: "0.7rem", color: "#9caecc" }}>
                  {new Date(d.updated_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
