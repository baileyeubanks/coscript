"use client";

import { Check, X } from "lucide-react";

interface Suggestion {
  id: string;
  author_name: string;
  original_text: string;
  suggested_text: string;
  line_number: number | null;
  status: string;
  created_at: string;
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  scriptId: string;
  onAction: () => void;
}

export default function SuggestionCard({ suggestion, scriptId, onAction }: SuggestionCardProps) {
  async function handleAction(status: "accepted" | "rejected") {
    await fetch(`/api/scripts/${scriptId}/suggestions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestion_id: suggestion.id, status }),
    });
    onAction();
  }

  const isPending = suggestion.status === "pending";

  return (
    <div className="card" style={{ padding: "0.875rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>{suggestion.author_name}</span>
        <span className={`badge ${suggestion.status === "accepted" ? "badge-green" : suggestion.status === "rejected" ? "badge-red" : "badge-orange"}`}>
          {suggestion.status}
        </span>
      </div>

      {suggestion.line_number && (
        <span style={{ fontSize: "0.7rem", color: "var(--blue)", display: "block", marginBottom: "0.375rem" }}>
          Line {suggestion.line_number}
        </span>
      )}

      <div style={{ display: "grid", gap: "0.375rem", marginBottom: "0.5rem" }}>
        <div style={{ background: "var(--bg)", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--red)" }}>
          <span style={{ fontSize: "0.7rem", color: "var(--red)", fontWeight: 600 }}>Original</span>
          <p style={{ fontSize: "0.8rem", marginTop: "0.125rem", textDecoration: "line-through", color: "var(--muted)" }}>
            {suggestion.original_text}
          </p>
        </div>
        <div style={{ background: "var(--bg)", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--green)" }}>
          <span style={{ fontSize: "0.7rem", color: "var(--green)", fontWeight: 600 }}>Suggested</span>
          <p style={{ fontSize: "0.8rem", marginTop: "0.125rem" }}>{suggestion.suggested_text}</p>
        </div>
      </div>

      {isPending && (
        <div style={{ display: "flex", gap: "0.375rem" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => handleAction("accepted")} style={{ color: "var(--green)" }}>
            <Check size={12} /> Accept
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => handleAction("rejected")} style={{ color: "var(--red)" }}>
            <X size={12} /> Reject
          </button>
        </div>
      )}
    </div>
  );
}
