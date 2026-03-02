"use client";

import { Clock, RotateCcw } from "lucide-react";

interface Version {
  id: string;
  version_number: number;
  content: string;
  score: number;
  created_at: string;
}

interface VersionListProps {
  versions: Version[];
  selectedA: string | null;
  selectedB: string | null;
  onSelectA: (id: string) => void;
  onSelectB: (id: string) => void;
  onRestore: (version: Version) => void;
}

export default function VersionList({ versions, selectedA, selectedB, onSelectA, onSelectB, onRestore }: VersionListProps) {
  const scoreClass = (s: number) => (s >= 80 ? "score-high" : s >= 50 ? "score-mid" : "score-low");

  if (versions.length === 0) {
    return <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No version history yet. Versions are created automatically when you save.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", fontSize: "0.75rem", color: "var(--muted)" }}>
        <span>Select two versions to compare</span>
      </div>
      {versions.map((v) => {
        const isA = selectedA === v.id;
        const isB = selectedB === v.id;
        const isSelected = isA || isB;
        return (
          <div
            key={v.id}
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.875rem 1.25rem",
              borderColor: isSelected ? "var(--accent)" : undefined,
              background: isSelected ? "var(--accent-dim)" : undefined,
            }}
          >
            <div className={`score-ring ${scoreClass(v.score)}`} style={{ width: 36, height: 36, fontSize: "0.75rem" }}>
              {v.score || "\u2014"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>Version {v.version_number}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                <Clock size={12} style={{ display: "inline", verticalAlign: "middle" }} />{" "}
                {new Date(v.created_at).toLocaleString()}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", color: "var(--muted)", cursor: "pointer" }}>
                <input type="radio" name="versionA" checked={isA} onChange={() => onSelectA(v.id)} style={{ accentColor: "var(--accent)" }} /> A
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", color: "var(--muted)", cursor: "pointer" }}>
                <input type="radio" name="versionB" checked={isB} onChange={() => onSelectB(v.id)} style={{ accentColor: "var(--accent)" }} /> B
              </label>
              <button className="btn btn-ghost btn-sm" onClick={() => onRestore(v)} title="Restore this version">
                <RotateCcw size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
