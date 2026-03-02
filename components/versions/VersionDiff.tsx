"use client";

interface DiffChange {
  value: string;
  added: boolean;
  removed: boolean;
}

interface VersionDiffProps {
  diff: DiffChange[];
  versionA: { version_number: number; score: number };
  versionB: { version_number: number; score: number };
}

export default function VersionDiff({ diff, versionA, versionB }: VersionDiffProps) {
  return (
    <div>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", fontSize: "0.8rem" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)" }} />
          V{versionA.version_number} (Score: {versionA.score || "\u2014"})
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: "rgba(34, 197, 94, 0.2)", border: "1px solid rgba(34, 197, 94, 0.4)" }} />
          V{versionB.version_number} (Score: {versionB.score || "\u2014"})
        </span>
      </div>

      <div style={{
        background: "var(--bg)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-sm)",
        padding: "1rem",
        fontFamily: "monospace",
        fontSize: "0.8rem",
        lineHeight: 1.8,
        whiteSpace: "pre-wrap",
        maxHeight: 500,
        overflow: "auto",
      }}>
        {diff.map((change, i) => {
          if (change.added) {
            return (
              <span key={i} style={{ background: "rgba(34, 197, 94, 0.15)", color: "var(--green)", borderRadius: 2, padding: "0 2px" }}>
                {change.value}
              </span>
            );
          }
          if (change.removed) {
            return (
              <span key={i} style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--red)", textDecoration: "line-through", borderRadius: 2, padding: "0 2px" }}>
                {change.value}
              </span>
            );
          }
          return <span key={i}>{change.value}</span>;
        })}
      </div>
    </div>
  );
}
