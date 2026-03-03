"use client";

import { useState, useEffect } from "react";
import { List, Download, Loader2 } from "lucide-react";

interface ProductionNote {
  id: string;
  section_index: number;
  shot_type: string;
  equipment: string[];
  location: string;
  talent: string[];
  broll_description: string;
  estimated_duration_seconds: number;
  notes: string;
}

interface ShotListProps {
  scriptId: string;
  scriptTitle: string;
}

export default function ShotList({ scriptId, scriptTitle }: ShotListProps) {
  const [notes, setNotes] = useState<ProductionNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/scripts/${scriptId}/production`)
      .then((r) => r.json())
      .then((data) => setNotes(data.notes || []))
      .catch((err) => console.error("Failed to load shot list:", err))
      .finally(() => setLoading(false));
  }, [scriptId]);

  function exportShotList() {
    const lines = [`SHOT LIST — ${scriptTitle}`, `Date: ${new Date().toLocaleDateString()}`, ""];
    notes.forEach((note, idx) => {
      lines.push(`${idx + 1}. ${(note.shot_type || "TBD").toUpperCase()}`);
      if (note.location) lines.push(`   Location: ${note.location}`);
      if (note.talent.length) lines.push(`   Talent: ${note.talent.join(", ")}`);
      if (note.equipment.length) lines.push(`   Equipment: ${note.equipment.join(", ")}`);
      if (note.broll_description) lines.push(`   B-Roll: ${note.broll_description}`);
      if (note.estimated_duration_seconds) lines.push(`   Duration: ${note.estimated_duration_seconds}s`);
      if (note.notes) lines.push(`   Notes: ${note.notes}`);
      lines.push("");
    });

    const totalDuration = notes.reduce((sum, n) => sum + (n.estimated_duration_seconds || 0), 0);
    lines.push(`Total estimated duration: ${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s`);

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shot-list-${scriptTitle.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}><Loader2 size={20} className="spinner" /></div>;
  }

  if (notes.length === 0) {
    return (
      <p style={{ color: "var(--muted)", fontSize: "0.85rem", textAlign: "center", padding: "2rem 0" }}>
        No production notes to compile into a shot list.
      </p>
    );
  }

  const totalDuration = notes.reduce((sum, n) => sum + (n.estimated_duration_seconds || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <List size={16} /> Shot List
          <span className="badge badge-blue">{notes.length} shots</span>
        </h3>
        <button className="btn btn-secondary btn-sm" onClick={exportShotList}>
          <Download size={14} /> Export
        </button>
      </div>

      <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
          <thead>
            <tr style={{ background: "var(--surface-2)" }}>
              <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 600, color: "var(--muted)" }}>#</th>
              <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 600, color: "var(--muted)" }}>Shot</th>
              <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 600, color: "var(--muted)" }}>Location</th>
              <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 600, color: "var(--muted)" }}>Duration</th>
              <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 600, color: "var(--muted)" }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note, idx) => (
              <tr key={note.id} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "0.5rem 0.75rem", color: "var(--muted)" }}>{idx + 1}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <span className="badge badge-lime" style={{ fontSize: "0.65rem" }}>
                    {(note.shot_type || "TBD").toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: "0.5rem 0.75rem", color: "var(--muted)" }}>{note.location || "\u2014"}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{note.estimated_duration_seconds ? `${note.estimated_duration_seconds}s` : "\u2014"}</td>
                <td style={{ padding: "0.5rem 0.75rem", color: "var(--muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {note.notes || note.broll_description || "\u2014"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--muted)", textAlign: "right" }}>
        Total: {Math.floor(totalDuration / 60)}m {totalDuration % 60}s
      </div>
    </div>
  );
}
