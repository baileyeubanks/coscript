"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Loader2, FileText, Trash2 } from "lucide-react";

interface Brief {
  id: string;
  title: string;
  objective: string;
  target_audience: string;
  platform: string;
  key_messages: string[];
  tone: string;
  deadline: string | null;
  notes: string;
  status: string;
  client_id: string | null;
  project_id: string | null;
  clients: { name: string; industry: string } | null;
}

interface Script {
  id: string;
  title: string;
  script_type: string;
  status: string;
  score: number;
  updated_at: string;
}

export default function BriefDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch(`/api/briefs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setBrief(data.brief || null);
        setScripts(data.scripts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch("/api/ai/brief-to-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief_id: id, script_type: "video_script" }),
    });
    if (res.ok) {
      const data = await res.json();
      const encoded = encodeURIComponent(data.content || "");
      router.push(`/editor?generated=${encoded}&brief_id=${id}${brief?.client_id ? `&client_id=${brief.client_id}` : ""}`);
    }
    setGenerating(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this brief?")) return;
    await fetch(`/api/briefs/${id}`, { method: "DELETE" });
    router.back();
  }

  const scoreClass = (s: number) => (s >= 80 ? "score-high" : s >= 50 ? "score-mid" : "score-low");

  if (loading) return <div style={{ padding: "2rem" }}><div className="skeleton" style={{ height: 400 }} /></div>;
  if (!brief) return <div style={{ padding: "2rem", color: "var(--muted)" }}>Brief not found</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: 800 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: "1rem" }}>
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>{brief.title}</h1>
          <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.375rem" }}>
            {brief.clients?.name && <span>{brief.clients.name}</span>}
            {brief.platform && <span>{brief.platform}</span>}
            <span className="badge badge-blue" style={{ textTransform: "capitalize" }}>{brief.status}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 size={14} className="spinner" /> : <Sparkles size={14} />}
            {generating ? "Generating..." : "Generate Script"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleDelete} style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
        </div>
      </div>

      <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
        {brief.objective && (
          <div className="card" style={{ padding: "1rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Objective</span>
            <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>{brief.objective}</p>
          </div>
        )}

        {brief.target_audience && (
          <div className="card" style={{ padding: "1rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Target Audience</span>
            <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>{brief.target_audience}</p>
          </div>
        )}

        {brief.key_messages && brief.key_messages.length > 0 && (
          <div className="card" style={{ padding: "1rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Key Messages</span>
            <ul style={{ fontSize: "0.85rem", paddingLeft: "1.25rem", marginTop: "0.375rem", lineHeight: 1.8 }}>
              {brief.key_messages.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
          <div className="card" style={{ padding: "0.75rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Platform</span>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: "0.125rem", textTransform: "capitalize" }}>
              {brief.platform || "\u2014"}
            </div>
          </div>
          <div className="card" style={{ padding: "0.75rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Tone</span>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: "0.125rem", textTransform: "capitalize" }}>
              {brief.tone || "\u2014"}
            </div>
          </div>
          <div className="card" style={{ padding: "0.75rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Deadline</span>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: "0.125rem" }}>
              {brief.deadline ? new Date(brief.deadline).toLocaleDateString() : "\u2014"}
            </div>
          </div>
        </div>

        {brief.notes && (
          <div className="card" style={{ padding: "1rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</span>
            <p style={{ fontSize: "0.85rem", marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>{brief.notes}</p>
          </div>
        )}
      </div>

      <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Linked Scripts ({scripts.length})</h2>
      {scripts.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No scripts generated from this brief yet. Click &quot;Generate Script&quot; to create one.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {scripts.map((s) => (
            <div
              key={s.id}
              className="card"
              onClick={() => router.push(`/scripts/${s.id}`)}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1.25rem", cursor: "pointer" }}
            >
              <div className={`score-ring ${scoreClass(s.score)}`} style={{ width: 36, height: 36, fontSize: "0.75rem" }}>
                {s.score || "\u2014"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{s.title}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{s.script_type.replace(/_/g, " ")}</div>
              </div>
              <FileText size={14} style={{ color: "var(--muted)" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
