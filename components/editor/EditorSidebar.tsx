"use client";

import {
  BarChart3,
  Brain,
  Lightbulb,
  BookOpen,
  Users,
  RotateCcw,
  Link,
  Wand2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import ScorePanel from "./ScorePanel";
import AnalyzeUrlPanel from "@/components/AnalyzeUrlPanel";

type TabKey = "score" | "reasoning" | "hooks" | "frameworks" | "audience" | "rewrite" | "analyze";

interface ScoreBreakdown {
  hook_strength: number;
  clarity: number;
  structure: number;
  emotional_pull: number;
  cta_power: number;
}

interface HookVariant {
  type: string;
  text: string;
}

interface FrameworkMatchItem {
  name: string;
  fit: number;
  suggestion: string;
}

const TONES = ["conversational", "professional", "urgent", "inspiring", "educational", "provocative"];

const TABS: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: "score", label: "Score", icon: BarChart3 },
  { key: "reasoning", label: "Reasoning", icon: Brain },
  { key: "hooks", label: "Hooks", icon: Lightbulb },
  { key: "frameworks", label: "Frameworks", icon: BookOpen },
  { key: "audience", label: "Audience", icon: Users },
  { key: "rewrite", label: "Rewrite", icon: RotateCcw },
  { key: "analyze", label: "Analyze", icon: Link },
];

interface EditorSidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  score: number;
  breakdown: ScoreBreakdown;
  reasoning: string;
  hookVariants: HookVariant[];
  frameworkMatch: FrameworkMatchItem[];
  audienceAnalysis: string;
  rewriteInstruction: string;
  rewriteTone: string;
  rewriteResult: string;
  rewriting: boolean;
  hasContent: boolean;
  onRewriteInstructionChange: (v: string) => void;
  onRewriteToneChange: (v: string) => void;
  onRewrite: () => void;
  onApplyRewrite: () => void;
  onUseHook: (text: string) => void;
}

export default function EditorSidebar({
  activeTab,
  onTabChange,
  score,
  breakdown,
  reasoning,
  hookVariants,
  frameworkMatch,
  audienceAnalysis,
  rewriteInstruction,
  rewriteTone,
  rewriteResult,
  rewriting,
  hasContent,
  onRewriteInstructionChange,
  onRewriteToneChange,
  onRewrite,
  onApplyRewrite,
  onUseHook,
}: EditorSidebarProps) {
  return (
    <div style={{ width: 400, display: "flex", flexDirection: "column", background: "var(--surface)", flexShrink: 0 }}>
      {/* Tabs */}
      <div className="tab-bar" style={{ padding: "0 0.25rem", flexShrink: 0, overflowX: "auto" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => onTabChange(t.key)}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.72rem", whiteSpace: "nowrap" }}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "1.25rem" }}>
        {activeTab === "score" && <ScorePanel score={score} breakdown={breakdown} />}

        {activeTab === "reasoning" && (
          <div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem" }}>AI Analysis</h3>
            {reasoning ? (
              <div style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--muted)", whiteSpace: "pre-wrap" }}>{reasoning}</div>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Score your script to see AI reasoning and suggestions for improvement.</p>
            )}
          </div>
        )}

        {activeTab === "hooks" && (
          <div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem" }}>Hook Variants</h3>
            {hookVariants.length > 0 ? (
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {hookVariants.map((h, i) => (
                  <div key={i} className="card" style={{ padding: "0.875rem" }}>
                    <span className="badge badge-lime" style={{ marginBottom: "0.5rem" }}>{h.type}</span>
                    <p style={{ fontSize: "0.85rem", lineHeight: 1.6, margin: "0.5rem 0" }}>{h.text}</p>
                    <button className="btn btn-ghost btn-sm" onClick={() => onUseHook(h.text)}>Use this hook</button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Click &quot;Hooks&quot; to generate hook variants based on your script content.</p>
            )}
          </div>
        )}

        {activeTab === "frameworks" && (
          <div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem" }}>Framework Match</h3>
            {frameworkMatch.length > 0 ? (
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {frameworkMatch.map((f, i) => (
                  <div key={i} className="card" style={{ padding: "0.875rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{f.name}</span>
                      <span className={`badge ${f.fit >= 80 ? "badge-green" : f.fit >= 50 ? "badge-blue" : "badge-orange"}`}>{f.fit}% fit</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.375rem", lineHeight: 1.5 }}>{f.suggestion}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Score your script to see which frameworks best match your content.</p>
            )}
          </div>
        )}

        {activeTab === "audience" && (
          <div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem" }}>Audience Lens</h3>
            {audienceAnalysis ? (
              <div style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--muted)", whiteSpace: "pre-wrap" }}>{audienceAnalysis}</div>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Score your script to see how it resonates with your target audience.</p>
            )}
          </div>
        )}

        {activeTab === "rewrite" && (
          <div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Wand2 size={14} style={{ color: "var(--accent)" }} /> AI Rewrite
            </h3>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Instruction</label>
                <textarea
                  value={rewriteInstruction}
                  onChange={(e) => onRewriteInstructionChange(e.target.value)}
                  placeholder="e.g., Make it more punchy, Add urgency, Simplify the language..."
                  rows={3}
                  style={{ width: "100%", resize: "none" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Target Tone</label>
                <select value={rewriteTone} onChange={(e) => onRewriteToneChange(e.target.value)} style={{ width: "100%" }}>
                  <option value="">Same as current</option>
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={onRewrite}
                disabled={rewriting || !hasContent}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}
              >
                {rewriting ? <Loader2 size={14} className="spinner" /> : <Wand2 size={14} />}
                {rewriting ? "Rewriting..." : "Rewrite Script"}
              </button>
              {rewriteResult && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Rewritten Version</span>
                    <button className="btn btn-secondary btn-sm" onClick={onApplyRewrite} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <ArrowRight size={12} /> Apply
                    </button>
                  </div>
                  <div
                    style={{
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
                    }}
                  >
                    {rewriteResult}
                  </div>
                </div>
              )}
              {!rewriteResult && !rewriting && (
                <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                  Give instructions for how you want the script rewritten, then click Rewrite.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "analyze" && <AnalyzeUrlPanel />}
      </div>
    </div>
  );
}
