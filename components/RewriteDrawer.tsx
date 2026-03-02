"use client";

import { useState } from "react";
import { X, Wand2, Loader2, ArrowRight } from "lucide-react";

interface RewriteDrawerProps {
  content: string;
  onApply: (rewritten: string) => void;
  onClose: () => void;
}

export default function RewriteDrawer({ content, onApply, onClose }: RewriteDrawerProps) {
  const [instruction, setInstruction] = useState("");
  const [tone, setTone] = useState("conversational");
  const [rewritten, setRewritten] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRewrite() {
    if (!instruction.trim() && !content.trim()) return;
    setLoading(true);
    setRewritten("");
    const res = await fetch("/api/ai/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, instruction, tone }),
    });
    if (res.ok) {
      const data = await res.json();
      setRewritten(data.content ?? "");
    }
    setLoading(false);
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: 420,
      background: "var(--surface)",
      borderLeft: "1px solid var(--line)",
      zIndex: 100,
      display: "flex",
      flexDirection: "column",
      animation: "slideIn 0.2s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--line)" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Wand2 size={16} style={{ color: "var(--accent)" }} /> AI Rewrite
        </h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Instruction</label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g., Make it more punchy, Add urgency, Simplify the language..."
            rows={3}
            style={{ width: "100%", resize: "none" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Target Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ width: "100%" }}>
            {["conversational", "professional", "urgent", "inspiring", "educational", "provocative"].map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleRewrite} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
          {loading ? <Loader2 size={14} className="spinner" /> : <Wand2 size={14} />}
          {loading ? "Rewriting..." : "Rewrite Script"}
        </button>

        {rewritten && (
          <div style={{ marginTop: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Rewritten Version</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onApply(rewritten)}
                style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
              >
                <ArrowRight size={12} /> Apply
              </button>
            </div>
            <div style={{
              background: "var(--bg)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-sm)",
              padding: "1rem",
              fontSize: "0.85rem",
              lineHeight: 1.7,
              color: "var(--ink)",
              whiteSpace: "pre-wrap",
              maxHeight: 400,
              overflow: "auto",
            }}>
              {rewritten}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
