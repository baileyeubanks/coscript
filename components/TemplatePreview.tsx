"use client";

import { X, Play } from "lucide-react";

interface TemplatePreviewProps {
  template: {
    id: string;
    name: string;
    category: string;
    platform: string;
    description: string;
    structure: string[];
    example_content: string;
    variables: { name: string; label: string; placeholder: string }[];
  };
  onClose: () => void;
  onStart: () => void;
}

export default function TemplatePreview({ template, onClose, onStart }: TemplatePreviewProps) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 200,
    }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          width: "100%",
          maxWidth: 560,
          maxHeight: "80vh",
          overflow: "auto",
          padding: "1.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800 }}>{template.name}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
          {template.description}
        </p>

        {template.structure && template.structure.length > 0 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Structure</h3>
            <ol style={{ fontSize: "0.85rem", color: "var(--muted)", paddingLeft: "1.25rem", lineHeight: 1.8 }}>
              {template.structure.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>
        )}

        {template.variables && template.variables.length > 0 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Variables</h3>
            <div style={{ display: "grid", gap: "0.375rem" }}>
              {template.variables.map((v) => (
                <div key={v.name} style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", alignItems: "center" }}>
                  <span className="badge badge-lime">{v.label}</span>
                  <span style={{ color: "var(--muted)" }}>{v.placeholder}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {template.example_content && (
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Example</h3>
            <div style={{
              background: "var(--bg)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-sm)",
              padding: "1rem",
              fontSize: "0.85rem",
              lineHeight: 1.7,
              color: "var(--muted)",
              whiteSpace: "pre-wrap",
            }}>
              {template.example_content}
            </div>
          </div>
        )}

        <button className="btn btn-primary" onClick={onStart} style={{ width: "100%", justifyContent: "center" }}>
          <Play size={14} /> Start with this Template
        </button>
      </div>
    </div>
  );
}
