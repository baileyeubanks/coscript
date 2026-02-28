"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { TemplateType, DraftConfig } from "@/lib/draft-types";
import { TEMPLATES } from "@/lib/draft-types";

const TONE_OPTIONS = ["Professional", "Casual", "Authoritative", "Friendly", "Urgent"];
const LENGTH_OPTIONS = ["Short", "Medium", "Long"];
const PLATFORM_OPTIONS = ["Instagram", "X (Twitter)", "LinkedIn", "TikTok"];

function EditorInner() {
  const params = useSearchParams();
  const templateParam = params.get("template") as TemplateType | null;
  const draftId = params.get("id");

  const [template, setTemplate] = useState<TemplateType>(templateParam || "social_media");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [config, setConfig] = useState<DraftConfig>({
    audience: "",
    tone: "Professional",
    length: "Medium",
    key_points: "",
    platform: "Instagram",
    keywords: "",
    word_count_target: 800,
  });
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(draftId);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    if (draftId) {
      fetch(`/api/drafts/${draftId}`).then((r) => r.json()).then((data) => {
        if (data.draft) {
          setTitle(data.draft.title || "");
          setContent(data.draft.content || "");
          setTemplate(data.draft.template_type || "social_media");
          setConfig(data.draft.config || {});
        }
      });
    }
  }, [draftId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (content.trim()) saveDraft(true);
    }, 30000);
    return () => clearInterval(interval);
  });

  const saveDraft = useCallback(async (silent = false) => {
    if (!silent) setSaving(true);
    const method = savedId ? "PUT" : "POST";
    const url = savedId ? `/api/drafts/${savedId}` : "/api/drafts";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || "Untitled", template_type: template, content, config }),
    });
    const data = await res.json();
    if (data.draft?.id && !savedId) setSavedId(data.draft.id);
    setLastSaved(new Date().toLocaleTimeString());
    if (!silent) setSaving(false);
  }, [savedId, title, template, content, config]);

  const handleGenerate = async () => {
    setGenerating(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          prompt: `Generate a ${TEMPLATES[template].label} for the following context.`,
          audience: config.audience,
          tone: config.tone,
          keyPoints: config.key_points,
          context: content,
          platform: config.platform,
          length: config.length,
        }),
      });
      const data = await res.json();
      if (data.content) setContent(data.content);
      if (data.suggestions) setSuggestions(data.suggestions);
    } catch (err) {
      console.error("Generation failed:", err);
    }
    setGenerating(false);
  };

  const handleExport = (format: "html" | "txt") => {
    if (format === "html") {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title || "Co-Script Export"}</title>
<style>body{font-family:Georgia,serif;max-width:700px;margin:2rem auto;padding:0 1rem;line-height:1.7;color:#1a1a1a}
h1{font-size:1.8rem;margin-bottom:.5rem}
.meta{color:#666;font-size:.85rem;margin-bottom:2rem;border-bottom:1px solid #ddd;padding-bottom:1rem}</style></head>
<body><h1>${title || "Untitled"}</h1>
<div class="meta">Template: ${TEMPLATES[template].label} &bull; Generated with Co-Script by Content Co-op</div>
<div>${content.replace(/\n/g, "<br>")}</div></body></html>`);
        win.document.close();
        win.print();
      }
    } else {
      const blob = new Blob([`${title || "Untitled"}\n${"=".repeat(40)}\nTemplate: ${TEMPLATES[template].label}\n\n${content}`], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(title || "coscript-export").replace(/\s+/g, "-").toLowerCase()}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };

  const handleShare = async () => {
    if (!savedId) {
      await saveDraft();
    }
    const id = savedId;
    if (!id) return;
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft_id: id }),
    });
    const data = await res.json();
    if (data.token) {
      const url = `${window.location.origin}/shared/${data.token}`;
      setShareUrl(url);
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  return (
    <main className="shell no-print">
      <header className="nav">
        <div className="brand">Content Co-op</div>
        <nav className="nav-links">
          <Link href="/">Templates</Link>
          <a className="active" href="#">Editor</a>
        </nav>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          {lastSaved && <span style={{ fontSize: "0.65rem", color: "#9caecc" }}>Saved {lastSaved}</span>}
          <button className="button" onClick={() => saveDraft()} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: "0.8rem", marginTop: "1rem", minHeight: "80vh" }}>
        <aside className="panel" style={{ overflow: "auto" }}>
          <div className="kicker">Template</div>
          <select className="field" style={{ marginTop: "0.4rem" }} value={template} onChange={(e) => setTemplate(e.target.value as TemplateType)}>
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <option key={key} value={key}>{t.label}</option>
            ))}
          </select>

          <div className="kicker" style={{ marginTop: "1rem" }}>Audience</div>
          <input className="field" placeholder="e.g., Field operators, C-suite, Gen Z..." value={config.audience || ""} onChange={(e) => setConfig({ ...config, audience: e.target.value })} />

          <div className="kicker" style={{ marginTop: "0.8rem" }}>Tone</div>
          <select className="field" value={config.tone || "Professional"} onChange={(e) => setConfig({ ...config, tone: e.target.value })}>
            {TONE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <div className="kicker" style={{ marginTop: "0.8rem" }}>Length</div>
          <select className="field" value={config.length || "Medium"} onChange={(e) => setConfig({ ...config, length: e.target.value })}>
            {LENGTH_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>

          {template === "social_media" && (
            <>
              <div className="kicker" style={{ marginTop: "0.8rem" }}>Platform</div>
              <select className="field" value={config.platform || "Instagram"} onChange={(e) => setConfig({ ...config, platform: e.target.value })}>
                {PLATFORM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </>
          )}

          {template === "blog" && (
            <>
              <div className="kicker" style={{ marginTop: "0.8rem" }}>SEO Keywords</div>
              <input className="field" placeholder="keyword1, keyword2..." value={config.keywords || ""} onChange={(e) => setConfig({ ...config, keywords: e.target.value })} />
              <div className="kicker" style={{ marginTop: "0.8rem" }}>Target Word Count</div>
              <input className="field" type="number" value={config.word_count_target || 800} onChange={(e) => setConfig({ ...config, word_count_target: parseInt(e.target.value) || 800 })} />
            </>
          )}

          <div className="kicker" style={{ marginTop: "0.8rem" }}>Key Points</div>
          <textarea className="textarea" placeholder="Main ideas, angles, or requirements..." value={config.key_points || ""} onChange={(e) => setConfig({ ...config, key_points: e.target.value })} style={{ minHeight: 80 }} />
        </aside>

        <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled draft..."
            style={{ background: "transparent", border: "none", outline: "none", fontSize: "1.4rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.6rem", width: "100%" }} />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Start writing, or click 'Generate with AI' to get started..."
            style={{ flex: 1, background: "#0a1525", border: "1px solid #325276", borderRadius: 10, padding: "0.8rem", color: "var(--ink)", fontSize: "0.9rem", lineHeight: 1.7, resize: "none", outline: "none", minHeight: 400 }} />
          <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
            <button className="button primary" onClick={handleGenerate} disabled={generating}>
              {generating ? "Generating..." : "Generate with AI"}
            </button>
            <button className="button" onClick={() => handleExport("html")}>Export PDF</button>
            <button className="button" onClick={() => handleExport("txt")}>Export TXT</button>
            <button className="button" onClick={handleShare}>Share Link</button>
            {content && (
              <span style={{ fontSize: "0.65rem", color: "#9caecc", marginLeft: "auto" }}>
                {content.split(/\s+/).filter(Boolean).length} words
              </span>
            )}
          </div>
          {shareUrl && (
            <div className="toast">
              Link copied! <a href={shareUrl} target="_blank" style={{ color: "var(--accent)" }}>{shareUrl}</a>
            </div>
          )}
        </div>

        <aside className="panel" style={{ overflow: "auto" }}>
          <div className="kicker">AI Suggestions</div>
          {generating && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.6rem" }}>
              <div className="spinner" />
              <span style={{ fontSize: "0.75rem", color: "#9caecc" }}>Generating...</span>
            </div>
          )}
          {suggestions.length > 0 ? (
            <div style={{ marginTop: "0.6rem", display: "grid", gap: "0.4rem" }}>
              {suggestions.map((s, i) => (
                <div key={i} className="variant-item" style={{ fontSize: "0.78rem", cursor: "pointer" }}
                  onClick={() => setContent((prev) => prev + "\n\n" + s)}>
                  {s}
                </div>
              ))}
            </div>
          ) : !generating && (
            <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.6rem" }}>
              Configure your template settings and click &ldquo;Generate with AI&rdquo; to get AI-powered content and suggestions.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#9caecc" }}>Loading editor...</div>}>
      <EditorInner />
    </Suspense>
  );
}
