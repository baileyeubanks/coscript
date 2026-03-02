"use client";

import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";

interface Variable {
  name: string;
  label: string;
  placeholder: string;
}

interface TemplateVariableFormProps {
  templateId: string;
  templateName: string;
  variables: Variable[];
  clientId?: string | null;
  onGenerated: (content: string) => void;
  onClose: () => void;
}

export default function TemplateVariableForm({ templateId, templateName, variables, clientId, onGenerated, onClose }: TemplateVariableFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [tone, setTone] = useState("conversational");
  const [audience, setAudience] = useState("");
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch(`/api/templates/${templateId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variables: values, client_id: clientId, tone, audience }),
    });
    if (res.ok) {
      const data = await res.json();
      onGenerated(data.content || "");
    }
    setGenerating(false);
  }

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
          maxWidth: 480,
          padding: "1.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 800 }}>{templateName}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
          {variables.map((v) => (
            <div key={v.name}>
              <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>{v.label}</label>
              <input
                value={values[v.name] || ""}
                onChange={(e) => setValues({ ...values, [v.name]: e.target.value })}
                placeholder={v.placeholder}
              />
            </div>
          ))}

          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>Audience</label>
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Target audience..." />
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ width: "100%" }}>
              {["conversational", "professional", "urgent", "inspiring", "educational", "provocative"].map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating} style={{ width: "100%", justifyContent: "center" }}>
          {generating ? <Loader2 size={14} className="spinner" /> : <Sparkles size={14} />}
          {generating ? "Generating..." : "Generate Script"}
        </button>
      </div>
    </div>
  );
}
