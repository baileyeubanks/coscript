"use client";

import { useRouter } from "next/navigation";

interface PipelineScript {
  id: string;
  title: string;
  status: string;
  score: number;
  updated_at: string;
  clients?: { name: string } | null;
}

interface PipelineBoardProps {
  pipeline: Record<string, PipelineScript[]>;
  stages: string[];
}

const STAGE_LABELS: Record<string, string> = {
  draft: "Draft",
  internal_review: "Internal Review",
  client_review: "Client Review",
  approved: "Approved",
  produced: "Produced",
  delivered: "Delivered",
};

const STAGE_COLORS: Record<string, string> = {
  draft: "var(--muted)",
  internal_review: "var(--blue)",
  client_review: "var(--orange)",
  approved: "var(--green)",
  produced: "var(--accent)",
  delivered: "var(--green)",
};

export default function PipelineBoard({ pipeline, stages }: PipelineBoardProps) {
  const router = useRouter();

  return (
    <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
      {stages.map((stage) => {
        const scripts = pipeline[stage] || [];
        const color = STAGE_COLORS[stage] || "var(--muted)";

        return (
          <div
            key={stage}
            style={{
              minWidth: 220,
              flex: "1 0 220px",
              background: "var(--surface)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Column header */}
            <div style={{ padding: "0.75rem", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>{STAGE_LABELS[stage] || stage}</span>
              </div>
              <span style={{ fontSize: "0.7rem", color: "var(--muted)", background: "var(--bg)", padding: "0.125rem 0.375rem", borderRadius: 4 }}>
                {scripts.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ flex: 1, padding: "0.5rem", display: "grid", gap: "0.375rem", alignContent: "start" }}>
              {scripts.length === 0 ? (
                <div style={{ padding: "1rem 0.5rem", textAlign: "center", fontSize: "0.75rem", color: "var(--muted)" }}>
                  No scripts
                </div>
              ) : (
                scripts.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => router.push(`/scripts/${s.id}`)}
                    style={{
                      padding: "0.625rem",
                      background: "var(--bg)",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      border: "1px solid transparent",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
                  >
                    <div style={{ fontWeight: 600, fontSize: "0.8rem", marginBottom: "0.25rem" }}>{s.title}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--muted)" }}>
                      <span>{s.clients?.name || "No client"}</span>
                      {s.score > 0 && (
                        <span style={{ color: s.score >= 80 ? "var(--green)" : s.score >= 50 ? "var(--orange)" : "var(--red)" }}>
                          {s.score}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
