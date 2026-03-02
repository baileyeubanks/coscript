"use client";

interface ScoreBreakdown {
  hook_strength: number;
  clarity: number;
  structure: number;
  emotional_pull: number;
  cta_power: number;
}

interface ScorePanelProps {
  score: number;
  breakdown: ScoreBreakdown;
}

export default function ScorePanel({ score, breakdown }: ScorePanelProps) {
  const scoreClass = score >= 80 ? "score-high" : score >= 50 ? "score-mid" : "score-low";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className={`score-ring ${scoreClass}`}>{score || "\u2014"}</div>
        <div>
          <div style={{ fontWeight: 700 }}>Script Score</div>
          <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
            {score >= 80
              ? "Strong \u2014 ready to publish"
              : score >= 50
                ? "Good \u2014 room for improvement"
                : score > 0
                  ? "Needs work"
                  : "Click Score to analyze"}
          </div>
        </div>
      </div>
      {Object.entries(breakdown).map(([key, val]) => (
        <div key={key} style={{ marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
            <span style={{ color: "var(--muted)", textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</span>
            <span style={{ fontWeight: 700 }}>{val}/100</span>
          </div>
          <div style={{ height: 6, background: "var(--line)", borderRadius: 3 }}>
            <div
              style={{
                height: "100%",
                width: `${val}%`,
                borderRadius: 3,
                background: val >= 80 ? "var(--green)" : val >= 50 ? "var(--orange)" : "var(--red)",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
