"use client";

import { useState } from "react";
import { Link, Loader2, ExternalLink } from "lucide-react";

interface AnalyzeResult {
  title: string;
  hook_used: string;
  structure: string[];
  key_takeaways: string[];
  audience: string;
  tone: string;
  suggestions: string[];
}

export default function AnalyzeUrlPanel() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  async function handleAnalyze() {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/ai/analyze-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      const data = await res.json();
      setResult(data);
    }
    setLoading(false);
  }

  return (
    <div>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Link size={14} style={{ color: "var(--accent)" }} /> Analyze Content
      </h3>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a URL to analyze..."
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary btn-sm" onClick={handleAnalyze} disabled={loading}>
          {loading ? <Loader2 size={14} className="spinner" /> : <ExternalLink size={14} />}
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)", fontSize: "0.85rem" }}>
          Analyzing content...
        </div>
      )}

      {result && (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {result.title && (
            <div className="card" style={{ padding: "0.875rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Title</span>
              <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>{result.title}</p>
            </div>
          )}

          {result.hook_used && (
            <div className="card" style={{ padding: "0.875rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hook Technique</span>
              <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>{result.hook_used}</p>
            </div>
          )}

          {result.structure && result.structure.length > 0 && (
            <div className="card" style={{ padding: "0.875rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Structure</span>
              <ol style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.375rem", paddingLeft: "1.25rem", lineHeight: 1.6 }}>
                {result.structure.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          )}

          {result.key_takeaways && result.key_takeaways.length > 0 && (
            <div className="card" style={{ padding: "0.875rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Key Takeaways</span>
              <ul style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.375rem", paddingLeft: "1.25rem", lineHeight: 1.6 }}>
                {result.key_takeaways.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          {result.suggestions && result.suggestions.length > 0 && (
            <div className="card" style={{ padding: "0.875rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Suggestions</span>
              <ul style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.375rem", paddingLeft: "1.25rem", lineHeight: 1.6 }}>
                {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {!loading && !result && (
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
          Paste a URL to any content and AI will analyze the hook technique, structure, and provide suggestions you can apply.
        </p>
      )}
    </div>
  );
}
