"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Camera } from "lucide-react";

const SHOT_TYPES = [
  { value: "wide", label: "Wide" },
  { value: "medium", label: "Medium" },
  { value: "close", label: "Close-up" },
  { value: "broll", label: "B-Roll" },
  { value: "overhead", label: "Overhead" },
  { value: "pov", label: "POV" },
];

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

interface ProductionNotesPanelProps {
  scriptId: string;
}

export default function ProductionNotesPanel({ scriptId }: ProductionNotesPanelProps) {
  const [notes, setNotes] = useState<ProductionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(`/api/scripts/${scriptId}/production`)
      .then((r) => r.json())
      .then((data) => setNotes(data.notes || []))
      .catch((err) => console.error("Failed to load production notes:", err))
      .finally(() => setLoading(false));
  }, [scriptId]);

  async function addNote() {
    setAdding(true);
    const res = await fetch(`/api/scripts/${scriptId}/production`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_index: notes.length }),
    });
    if (res.ok) {
      const data = await res.json();
      setNotes([...notes, data.note]);
    }
    setAdding(false);
  }

  async function updateNote(noteId: string, updates: Partial<ProductionNote>) {
    await fetch(`/api/scripts/${scriptId}/production`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note_id: noteId, ...updates }),
    });
    setNotes(notes.map((n) => (n.id === noteId ? { ...n, ...updates } : n)));
  }

  async function deleteNote(noteId: string) {
    await fetch(`/api/scripts/${scriptId}/production?note_id=${noteId}`, { method: "DELETE" });
    setNotes(notes.filter((n) => n.id !== noteId));
  }

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}><Loader2 size={20} className="spinner" /></div>;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Camera size={16} style={{ color: "var(--accent)" }} /> Production Notes
        </h3>
        <button className="btn btn-primary btn-sm" onClick={addNote} disabled={adding}>
          {adding ? <Loader2 size={14} className="spinner" /> : <Plus size={14} />}
          Add Section
        </button>
      </div>

      {notes.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", textAlign: "center", padding: "2rem 0" }}>
          No production notes yet. Add sections to plan shots, equipment, and locations.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {notes.map((note, idx) => (
            <div key={note.id} className="card" style={{ padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Section {idx + 1}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteNote(note.id)} style={{ color: "var(--red)" }}>
                  <Trash2 size={12} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>Shot Type</label>
                  <select
                    value={note.shot_type || ""}
                    onChange={(e) => updateNote(note.id, { shot_type: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {SHOT_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>Duration (sec)</label>
                  <input
                    type="number"
                    value={note.estimated_duration_seconds || ""}
                    onChange={(e) => updateNote(note.id, { estimated_duration_seconds: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "0.5rem" }}>
                <label style={{ fontSize: "0.7rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>Location</label>
                <input
                  value={note.location}
                  onChange={(e) => updateNote(note.id, { location: e.target.value })}
                  placeholder="Where is this shot?"
                />
              </div>

              <div style={{ marginBottom: "0.5rem" }}>
                <label style={{ fontSize: "0.7rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>B-Roll Description</label>
                <input
                  value={note.broll_description}
                  onChange={(e) => updateNote(note.id, { broll_description: e.target.value })}
                  placeholder="Describe supplementary footage..."
                />
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>Notes</label>
                <textarea
                  value={note.notes}
                  onChange={(e) => updateNote(note.id, { notes: e.target.value })}
                  placeholder="Additional production notes..."
                  rows={2}
                  style={{ width: "100%", resize: "none" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
