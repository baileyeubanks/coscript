"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, PenTool, Search } from "lucide-react";
import type { ScriptRecord } from "@/lib/contracts";

type Script = Pick<
  ScriptRecord,
  "id" | "title" | "script_type" | "score" | "status" | "updated_at" | "word_count"
>;

const TYPES = ["all", "video_script", "social_media", "blog", "ad_copy", "email"];
const STATUS = ["all", "draft", "review", "published"];

export default function ScriptsLibrary() {
  const router = useRouter();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch("/api/scripts")
      .then((response) => response.json())
      .then((data) => {
        setScripts(data.scripts ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = scripts.filter((script) => {
    if (search && !script.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && script.script_type !== typeFilter) return false;
    if (statusFilter !== "all" && script.status !== statusFilter) return false;
    return true;
  });

  const scoreClass = (score: number) =>
    score >= 80 ? "score-high" : score >= 50 ? "score-mid" : "score-low";

  const typeLabel: Record<string, string> = {
    all: "All types",
    video_script: "Video",
    social_media: "Social",
    blog: "Blog",
    ad_copy: "Ad",
    email: "Email",
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
          background: "linear-gradient(145deg, rgba(44, 84, 128, 0.06), rgba(255, 255, 255, 0.9))",
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
            Draft history
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: ".4rem" }}>
            Resume saved work through the editor.
          </h1>
          <p style={{ color: "var(--muted)", fontSize: ".9rem", lineHeight: 1.65 }}>
            This library is for re-entry, review, and handoff. The active writing surface stays in the editor, so every
            meaningful change should route back there.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push("/editor")}>
          <PenTool size={16} /> Open editor
        </button>
      </div>

      <div style={{ display: "flex", gap: ".75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search
            size={16}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}
          />
          <input
            placeholder="Search drafts..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} style={{ width: "auto", minWidth: 140 }}>
          {TYPES.map((value) => (
            <option key={value} value={value}>
              {typeLabel[value] || value}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ width: "auto", minWidth: 130 }}>
          {STATUS.map((value) => (
            <option key={value} value={value}>
              {value === "all" ? "All status" : value.charAt(0).toUpperCase() + value.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: ".5rem" }}>
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="skeleton" style={{ height: 76 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <Filter size={32} style={{ color: "var(--muted)", marginBottom: ".75rem" }} />
          <p style={{ color: "var(--muted)" }}>
            {scripts.length === 0
              ? "No saved drafts yet. Start the first one in the editor."
              : "No drafts match these filters."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: ".6rem" }}>
          {filtered.map((script) => (
            <div
              key={script.id}
              className="card"
              style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.95rem 1.15rem" }}
            >
              <div className={`score-ring ${scoreClass(script.score)}`} style={{ width: 44, height: 44, fontSize: ".9rem" }}>
                {script.score || "—"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {script.title}
                </div>
                <div style={{ fontSize: ".76rem", color: "var(--muted)", display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                  <span>{typeLabel[script.script_type] || script.script_type}</span>
                  <span>{script.word_count || 0} words</span>
                  <span>{new Date(script.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
              <span className={`badge ${script.status === "published" ? "badge-green" : script.status === "review" ? "badge-blue" : "badge-orange"}`}>
                {script.status}
              </span>
              <div style={{ display: "flex", gap: ".45rem", flexWrap: "wrap" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/editor?load=${script.id}`)}>
                  Resume
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/scripts/${script.id}`)}>
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
