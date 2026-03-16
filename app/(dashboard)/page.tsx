"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  FileText,
  PenTool,
  Search,
  Sparkles,
  TrendingUp,
  Vault,
} from "lucide-react";
import type { ScriptRecord } from "@/lib/contracts";

type Script = Pick<
  ScriptRecord,
  "id" | "title" | "script_type" | "score" | "status" | "updated_at"
>;

interface Stats {
  total: number;
  avgScore: number;
  thisWeek: number;
  readyForReview: number;
}

const FLOW_STEPS = [
  {
    label: "Signals",
    detail: "Watchlists and outlier signals help us isolate the tension worth building the script around.",
  },
  {
    label: "Story angle",
    detail: "Audience, stakes, and opening pattern are locked before the prose hardens.",
  },
  {
    label: "Build",
    detail: "The editor turns the angle into a narrative map and a usable first script.",
  },
  {
    label: "Sharpen",
    detail: "Scoring, hook passes, and framework fit pressure-test the script before handoff.",
  },
];

export default function WorkspaceDashboard() {
  const router = useRouter();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    avgScore: 0,
    thisWeek: 0,
    readyForReview: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scripts")
      .then((response) => response.json())
      .then((data) => {
        const list: Script[] = data.scripts ?? [];
        const now = Date.now();
        const weekAgo = now - 7 * 86400000;

        setScripts(list);
        setStats({
          total: list.length,
          avgScore: list.length
            ? Math.round(list.reduce((sum, script) => sum + (script.score || 0), 0) / list.length)
            : 0,
          thisWeek: list.filter((script) => new Date(script.updated_at).getTime() > weekAgo).length,
          readyForReview: list.filter((script) => (script.score || 0) >= 80).length,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const leadScript = useMemo(() => scripts[0] ?? null, [scripts]);

  const scoreClass = (score: number) =>
    score >= 80 ? "score-high" : score >= 50 ? "score-mid" : "score-low";

  const typeLabel: Record<string, string> = {
    video_script: "Video",
    social_media: "Social",
    blog: "Blog",
    ad_copy: "Ad",
    email: "Email",
  };

  const statCards = [
    { label: "Saved drafts", value: stats.total, icon: FileText, color: "var(--blue)" },
    { label: "Average score", value: stats.avgScore, icon: TrendingUp, color: "var(--accent)" },
    { label: "Touched this week", value: stats.thisWeek, icon: Sparkles, color: "var(--orange)" },
    { label: "Ready for review", value: stats.readyForReview, icon: PenTool, color: "var(--green)" },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <div
        className="card"
        style={{
          display: "grid",
          gap: "1.25rem",
          marginBottom: "1.5rem",
          background:
            "linear-gradient(135deg, rgba(181, 82, 51, 0.08), rgba(94, 106, 82, 0.08) 55%, rgba(44, 84, 128, 0.06))",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <div
              style={{
                fontSize: ".72rem",
                letterSpacing: ".16em",
                textTransform: "uppercase" as const,
                fontWeight: 800,
                color: "var(--signal)",
                marginBottom: ".45rem",
              }}
            >
              Co-Script workspace
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: ".45rem" }}>
              Sandcastle-grade workflow, rebuilt as our own story system.
            </h1>
            <p style={{ color: "var(--muted)", fontSize: ".94rem", lineHeight: 1.65, maxWidth: 620 }}>
              Co-Script turns research signals into hook patterns, narrative maps, and proof-led scripts for
              industrial, energy, and executive-facing content. The product center is the draft workspace, not a set
              of disconnected tools.
            </p>
          </div>
          <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => router.push("/editor")}>
              <PenTool size={16} /> Open editor
            </button>
            <button className="btn btn-secondary" onClick={() => router.push("/research")}>
              <Search size={16} /> Signal intake
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: ".75rem" }}>
          {FLOW_STEPS.map((step, index) => (
            <div
              key={step.label}
              style={{
                padding: ".9rem 1rem",
                borderRadius: 18,
                border: "1px solid rgba(22, 22, 22, 0.08)",
                background: "rgba(255, 255, 255, 0.72)",
              }}
            >
              <div style={{ fontSize: ".72rem", color: "var(--signal)", fontWeight: 800, marginBottom: ".35rem" }}>
                0{index + 1} {step.label}
              </div>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: ".8rem", lineHeight: 1.55 }}>{step.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        {statCards.map((card) => (
          <div key={card.label} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "var(--radius-sm)",
                background: `${card.color}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <card.icon size={20} style={{ color: card.color }} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{loading ? "—" : card.value}</div>
              <div style={{ fontSize: "0.76rem", color: "var(--muted)" }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(300px, 0.8fr)", gap: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".8rem", gap: ".75rem", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: ".15rem" }}>Recent drafts</h2>
              <p style={{ color: "var(--muted)", fontSize: ".8rem" }}>Resume saved work directly in the editor.</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push("/scripts")}>
              Open draft history <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: "grid", gap: ".5rem" }}>
              {[1, 2, 3].map((item) => (
                <div key={item} className="skeleton" style={{ height: 72 }} />
              ))}
            </div>
          ) : scripts.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
              <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>No saved drafts yet.</p>
              <button className="btn btn-primary" onClick={() => router.push("/editor")}>
                Start in the editor
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: ".6rem" }}>
              {scripts.slice(0, 5).map((script) => (
                <div
                  key={script.id}
                  className="card"
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.95rem 1.1rem" }}
                >
                  <div className={`score-ring ${scoreClass(script.score)}`} style={{ width: 42, height: 42, fontSize: ".86rem" }}>
                    {script.score || "—"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: ".9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {script.title}
                    </div>
                    <div style={{ fontSize: ".76rem", color: "var(--muted)" }}>
                      {typeLabel[script.script_type] || script.script_type} · Updated{" "}
                      {new Date(script.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`badge ${script.status === "published" ? "badge-green" : script.status === "review" ? "badge-blue" : "badge-orange"}`}>
                    {script.status}
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/editor?load=${script.id}`)}>
                    Resume
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: "1rem" }}>
          <div className="card" style={{ background: "rgba(255, 252, 247, 0.92)" }}>
            <div style={{ fontSize: ".72rem", color: "var(--moss)", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase" as const, marginBottom: ".5rem" }}>
              Current focus
            </div>
            {leadScript ? (
              <>
                <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: ".25rem" }}>{leadScript.title}</div>
                <p style={{ color: "var(--muted)", fontSize: ".82rem", lineHeight: 1.6, marginBottom: ".9rem" }}>
                  Resume the most recent draft in the editor to keep writing, run a pass, or restore a saved version.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => router.push(`/editor?load=${leadScript.id}`)}>
                  <PenTool size={14} /> Resume latest draft
                </button>
              </>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: ".82rem", lineHeight: 1.6 }}>
                Once the first script is saved, the workspace will route you back into the editor from here.
              </p>
            )}
          </div>

          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: ".75rem" }}>Support surfaces</h2>
            <div style={{ display: "grid", gap: ".55rem" }}>
              {[
                {
                  label: "Research inputs",
                  href: "/research",
                  desc: "Watchlists and outlier signals that inform the next brief or angle.",
                  icon: Search,
                },
                {
                  label: "Reference vault",
                  href: "/vault",
                  desc: "Saved swipe-file material and source notes for future passes.",
                  icon: Vault,
                },
                {
                  label: "Framework library",
                  href: "/frameworks",
                  desc: "Reusable structures that should be applied inside the editor.",
                  icon: BookOpen,
                },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: ".9rem",
                    textAlign: "left",
                    cursor: "pointer",
                    padding: "0.95rem 1.1rem",
                  }}
                  onClick={() => router.push(item.href)}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: "rgba(181, 82, 51, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--signal)",
                      flexShrink: 0,
                    }}
                  >
                    <item.icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".88rem", marginBottom: ".18rem" }}>{item.label}</div>
                    <div style={{ color: "var(--muted)", fontSize: ".78rem", lineHeight: 1.55 }}>{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
