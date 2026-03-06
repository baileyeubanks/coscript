"use client";

import { useState, useCallback } from "react";
import {
  Sparkles,
  Search,
  Anchor,
  Palette,
  FileText,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Copy,
  Download,
  Clock,
  Check,
  Zap,
  ArrowRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Misconception { myth: string; reality: string; shock_score: number; }
interface Analogy { concept: string; analogy: string; }
interface HowItWorks { step: number; explanation: string; }
interface Statistic { stat: string; source: string; hook_power: number; }
interface ResearchData {
  misconceptions: Misconception[];
  analogies: Analogy[];
  how_it_works: HowItWorks[];
  statistics: Statistic[];
  emotional_angles: { fear: string; aspiration: string; curiosity: string };
}
interface Hook {
  type: string; text: string; psychology: string;
  scroll_stop_power: number; why_it_works: string;
}
interface StyleTemplate {
  id: string; name: string; description: string; structure: string;
  tone: string; pacing: string; word_count_range: [number, number]; platform_fit: string[];
}

const STEPS = [
  { id: "topic", label: "Topic", icon: Sparkles },
  { id: "research", label: "Research", icon: Search },
  { id: "hooks", label: "Hook", icon: Anchor },
  { id: "style", label: "Style", icon: Palette },
  { id: "script", label: "Script", icon: FileText },
] as const;
type StepId = (typeof STEPS)[number]["id"];

export default function WizardPage() {
  const [currentStep, setCurrentStep] = useState<StepId>("topic");
  const [loading, setLoading] = useState(false);

  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [tone, setTone] = useState("conversational");

  const [research, setResearch] = useState<ResearchData | null>(null);
  const [selectedResearch, setSelectedResearch] = useState<string[]>([]);

  const [hooks, setHooks] = useState<Hook[]>([]);
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null);

  const [styles, setStyles] = useState<StyleTemplate[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  const [script, setScript] = useState("");
  const [copied, setCopied] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  // ─── API Calls ─────────────────────────────────────────────────────────────
  const generateResearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wizard/research", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, audience, platform }),
      });
      const data = await res.json();
      setResearch(data);
      setCurrentStep("research");
    } catch (e) { console.error("Research error:", e); }
    finally { setLoading(false); }
  }, [topic, audience, platform]);

  const generateHooks = useCallback(async () => {
    setLoading(true);
    try {
      const ctx = selectedResearch.length > 0 ? selectedResearch.join("\n") : undefined;
      const res = await fetch("/api/ai/hooks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, audience, research_context: ctx }),
      });
      const data = await res.json();
      setHooks(data.hooks || []);
      setCurrentStep("hooks");
    } catch (e) { console.error("Hooks error:", e); }
    finally { setLoading(false); }
  }, [topic, audience, selectedResearch]);

  const loadStyles = useCallback(async () => {
    try {
      const res = await fetch("/api/wizard/styles");
      const data = await res.json();
      setStyles(data.system_styles || []);
    } catch (e) { console.error("Styles error:", e); }
    setCurrentStep("style");
  }, []);

  const generateScript = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic, audience, platform, tone,
          script_type: "video_script",
          selected_hook: selectedHook?.text,
          selected_research: selectedResearch,
          style_id: selectedStyle,
        }),
      });
      const data = await res.json();
      setScript(data.content || "");
      setCurrentStep("script");
    } catch (e) { console.error("Script error:", e); }
    finally { setLoading(false); }
  }, [topic, audience, platform, tone, selectedHook, selectedResearch, selectedStyle]);

  const copyScript = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleResearchItem = (item: string) => {
    setSelectedResearch((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const wordCount = script.split(/\s+/).filter(Boolean).length;
  const estimatedDuration = Math.round(wordCount / 2.5);

  const TONES = ["conversational", "professional", "humorous", "authoritative", "casual", "energetic"];

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: 960, margin: "0 auto" }}>
      {/* ─── Step Progress Bar ─────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.25rem",
        padding: "0.75rem 0", marginBottom: "1.5rem",
        borderBottom: "1px solid var(--line)",
      }}>
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isPast = i < stepIndex;
          return (
            <div key={step.id} style={{ display: "flex", alignItems: "center" }}>
              <button
                onClick={() => isPast && setCurrentStep(step.id)}
                disabled={!isPast && !isActive}
                style={{
                  display: "flex", alignItems: "center", gap: "0.375rem",
                  padding: "0.375rem 0.75rem", borderRadius: 999,
                  fontSize: "0.8rem", fontWeight: isActive ? 700 : 500,
                  background: isActive ? "var(--accent-dim)" : "transparent",
                  color: isActive ? "var(--accent)" : isPast ? "var(--green)" : "var(--muted)",
                  cursor: isPast ? "pointer" : isActive ? "default" : "not-allowed",
                  opacity: !isPast && !isActive ? 0.4 : 1,
                  border: "none",
                }}
              >
                {isPast ? <Check size={14} /> : <Icon size={14} />}
                {step.label}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} style={{ color: "var(--line)", margin: "0 0.125rem" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ─── STEP 1: TOPIC ──────────────────────────────────── */}
      {currentStep === "topic" && (
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.375rem" }}>
            What&apos;s your content about?
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Enter your topic, idea, or paste an existing draft. Our AI will research it and engineer a viral script.
          </p>

          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.375rem" }}>
                Topic / Idea
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Why most people use AI completely wrong..."
                style={{ height: 100, resize: "none", lineHeight: 1.6 }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.375rem" }}>
                  Target Audience
                </label>
                <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g., Small business owners" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.375rem" }}>
                  Platform
                </label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter/X</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.375rem" }}>
                Tone
              </label>
              <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    style={{
                      padding: "0.375rem 0.75rem", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600,
                      border: `1px solid ${tone === t ? "var(--accent)" : "var(--line)"}`,
                      background: tone === t ? "var(--accent-dim)" : "transparent",
                      color: tone === t ? "var(--accent)" : "var(--muted)",
                    }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={generateResearch}
            disabled={!topic.trim() || loading}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1.5rem", padding: "0.75rem", opacity: !topic.trim() ? 0.4 : 1 }}
          >
            {loading ? <><Loader2 size={16} className="spinner" /> Researching...</> : <>Research Topic <ArrowRight size={16} /></>}
          </button>
        </div>
      )}

      {/* ─── STEP 2: RESEARCH ──────────────────────────────── */}
      {currentStep === "research" && research && (
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.375rem" }}>Research Insights</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Select the insights you want woven into your script.
          </p>

          {/* Misconceptions */}
          {research.misconceptions?.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Zap size={16} style={{ color: "var(--orange)" }} /> Misconception vs Reality
              </h3>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {research.misconceptions.map((m, i) => {
                  const item = `MISCONCEPTION: "${m.myth}" → REALITY: "${m.reality}"`;
                  const sel = selectedResearch.includes(item);
                  return (
                    <button key={i} onClick={() => toggleResearchItem(item)} className="card" style={{
                      textAlign: "left", width: "100%",
                      borderColor: sel ? "var(--accent)" : undefined,
                      background: sel ? "var(--accent-dim)" : undefined,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "0.82rem", color: "var(--red)", textDecoration: "line-through" }}>{m.myth}</p>
                          <p style={{ fontSize: "0.85rem", color: "var(--green)", marginTop: "0.25rem" }}>{m.reality}</p>
                        </div>
                        <span className="badge badge-orange" style={{ marginLeft: "0.75rem", flexShrink: 0 }}>
                          Shock: {m.shock_score}/10
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Statistics */}
          {research.statistics?.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem" }}>Hook-Worthy Statistics</h3>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {research.statistics.map((s, i) => {
                  const item = `STATISTIC: ${s.stat} (Source: ${s.source})`;
                  const sel = selectedResearch.includes(item);
                  return (
                    <button key={i} onClick={() => toggleResearchItem(item)} className="card" style={{
                      textAlign: "left", width: "100%",
                      borderColor: sel ? "var(--accent)" : undefined,
                      background: sel ? "var(--accent-dim)" : undefined,
                    }}>
                      <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>{s.stat}</p>
                      <p style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.25rem" }}>Source: {s.source}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Analogies */}
          {research.analogies?.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem" }}>Simple Analogies (ELI5)</h3>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {research.analogies.map((a, i) => {
                  const item = `ANALOGY: ${a.concept} is like ${a.analogy}`;
                  const sel = selectedResearch.includes(item);
                  return (
                    <button key={i} onClick={() => toggleResearchItem(item)} className="card" style={{
                      textAlign: "left", width: "100%",
                      borderColor: sel ? "var(--accent)" : undefined,
                      background: sel ? "var(--accent-dim)" : undefined,
                    }}>
                      <p style={{ fontSize: "0.85rem" }}>
                        <span style={{ color: "var(--muted)" }}>{a.concept} →</span> {a.analogy}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "1rem" }}>
            {selectedResearch.length} insight{selectedResearch.length !== 1 ? "s" : ""} selected
          </p>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep("topic")}>
              <ChevronLeft size={14} /> Back
            </button>
            <button
              className="btn btn-primary"
              onClick={generateHooks}
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? <><Loader2 size={16} className="spinner" /> Generating Hooks...</> : <>Generate Hooks <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: HOOKS ──────────────────────────────────── */}
      {currentStep === "hooks" && (
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.375rem" }}>Choose Your Hook</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Each hook uses a different psychological mechanism. Pick the one that stops the scroll.
          </p>

          <div style={{ display: "grid", gap: "0.625rem" }}>
            {hooks.map((hook, i) => {
              const sel = selectedHook === hook;
              return (
                <button key={i} onClick={() => setSelectedHook(hook)} className="card" style={{
                  textAlign: "left", width: "100%",
                  borderColor: sel ? "var(--accent)" : undefined,
                  background: sel ? "var(--accent-dim)" : undefined,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className="badge badge-lime">{hook.type}</span>
                    <span className="badge badge-orange">Scroll-Stop: {hook.scroll_stop_power}/10</span>
                  </div>
                  <p style={{ fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.5, marginBottom: "0.375rem" }}>
                    &ldquo;{hook.text}&rdquo;
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                    <span style={{ fontWeight: 600 }}>Psychology:</span> {hook.psychology}
                  </p>
                  {hook.why_it_works && (
                    <p style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.125rem" }}>
                      <span style={{ fontWeight: 600 }}>Why it works:</span> {hook.why_it_works}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep("research")}>
              <ChevronLeft size={14} /> Back
            </button>
            <button
              className="btn btn-primary"
              onClick={loadStyles}
              disabled={!selectedHook}
              style={{ flex: 1, opacity: !selectedHook ? 0.4 : 1 }}
            >
              Choose Style <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 4: STYLE ──────────────────────────────────── */}
      {currentStep === "style" && (
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.375rem" }}>Choose a Style</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Each style is a proven storytelling format. Pick the one that fits your content.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
            {styles.map((style) => {
              const sel = selectedStyle === style.id;
              return (
                <button key={style.id} onClick={() => setSelectedStyle(style.id)} className="card" style={{
                  textAlign: "left",
                  borderColor: sel ? "var(--accent)" : undefined,
                  background: sel ? "var(--accent-dim)" : undefined,
                }}>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.25rem" }}>{style.name}</h3>
                  <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.5rem", lineHeight: 1.4 }}>{style.description}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.7rem", color: "var(--muted)" }}>
                    <span>{style.word_count_range[0]}-{style.word_count_range[1]} words</span>
                    <span style={{ color: "var(--line)" }}>|</span>
                    <span>{style.tone}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                    {style.platform_fit.map((p) => (
                      <span key={p} className={p === platform ? "badge badge-lime" : "badge"} style={{
                        background: p === platform ? undefined : "var(--surface-2)",
                        color: p === platform ? undefined : "var(--muted)",
                      }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep("hooks")}>
              <ChevronLeft size={14} /> Back
            </button>
            <button
              className="btn btn-primary"
              onClick={generateScript}
              disabled={!selectedStyle || loading}
              style={{ flex: 1, opacity: !selectedStyle ? 0.4 : 1 }}
            >
              {loading ? <><Loader2 size={16} className="spinner" /> Writing Script...</> : <>Generate Script <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 5: SCRIPT ──────────────────────────────────── */}
      {currentStep === "script" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.125rem" }}>Your Script</h1>
              <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                {wordCount} words &middot; ~{estimatedDuration}s at normal pace
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.375rem" }}>
              <button className="btn btn-ghost btn-sm" onClick={copyScript} title="Copy">
                {copied ? <Check size={16} style={{ color: "var(--green)" }} /> : <Copy size={16} />}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const blob = new Blob([script], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${topic.slice(0, 30).replace(/\s+/g, "_")}_script.txt`;
                  a.click();
                }}
                title="Download"
              >
                <Download size={16} />
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.88rem", lineHeight: 1.8, fontFamily: "inherit" }}>
              {script}
            </pre>
          </div>

          {/* Quick Action Chips */}
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.5rem" }}>
              Quick Edits
            </p>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {[
                { label: "Add Facts", mode: "facts" },
                { label: "Stronger Hooks", mode: "hooks" },
                { label: "Make Shorter", mode: "shorter" },
                { label: "Make Longer", mode: "longer" },
                { label: "More Energy", mode: "energy" },
                { label: "More Humor", mode: "humorous" },
                { label: "Translate", mode: "translate" },
              ].map((chip) => (
                <button
                  key={chip.mode}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const res = await fetch("/api/ai/rewrite", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ content: script, mode: chip.mode, tone }),
                      });
                      const data = await res.json();
                      if (data.content) setScript(data.content);
                    } finally { setLoading(false); }
                  }}
                  disabled={loading}
                  style={{
                    padding: "0.3rem 0.625rem", borderRadius: 999,
                    fontSize: "0.72rem", fontWeight: 600,
                    border: "1px solid var(--line)", background: "transparent",
                    color: "var(--muted)", cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1rem" }}>
              <Loader2 size={14} className="spinner" /> Applying edits...
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep("style")}>
              <ChevronLeft size={14} /> Back
            </button>
            <button
              className="btn btn-primary"
              onClick={async () => {
                await fetch("/api/wizard/state", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    topic, audience, platform, tone,
                    script_type: "video_script",
                    research_data: research,
                    selected_research: selectedResearch,
                    hooks_generated: hooks,
                    selected_hook: selectedHook?.text,
                    selected_style: selectedStyle,
                    step: "complete",
                    content: script,
                  }),
                });
                window.location.href = "/scripts";
              }}
              style={{ flex: 1 }}
            >
              Save to Library <Check size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
