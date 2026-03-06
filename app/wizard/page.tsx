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
interface Misconception {
  myth: string;
  reality: string;
  shock_score: number;
}
interface Analogy {
  concept: string;
  analogy: string;
}
interface HowItWorks {
  step: number;
  explanation: string;
}
interface Statistic {
  stat: string;
  source: string;
  hook_power: number;
}
interface ResearchData {
  misconceptions: Misconception[];
  analogies: Analogy[];
  how_it_works: HowItWorks[];
  statistics: Statistic[];
  emotional_angles: { fear: string; aspiration: string; curiosity: string };
}
interface Hook {
  type: string;
  text: string;
  psychology: string;
  scroll_stop_power: number;
  why_it_works: string;
}
interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  structure: string;
  tone: string;
  pacing: string;
  word_count_range: [number, number];
  platform_fit: string[];
}

// ─── Wizard Steps ────────────────────────────────────────────────────────────
const STEPS = [
  { id: "topic", label: "Topic", icon: Sparkles, color: "text-violet-400" },
  { id: "research", label: "Research", icon: Search, color: "text-blue-400" },
  { id: "hooks", label: "Hook", icon: Anchor, color: "text-amber-400" },
  { id: "style", label: "Style", icon: Palette, color: "text-emerald-400" },
  { id: "script", label: "Script", icon: FileText, color: "text-rose-400" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// ─── Component ───────────────────────────────────────────────────────────────
export default function WizardPage() {
  const [currentStep, setCurrentStep] = useState<StepId>("topic");
  const [loading, setLoading] = useState(false);

  // Step 1: Topic
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [tone, setTone] = useState("conversational");

  // Step 2: Research
  const [research, setResearch] = useState<ResearchData | null>(null);
  const [selectedResearch, setSelectedResearch] = useState<string[]>([]);

  // Step 3: Hooks
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null);

  // Step 4: Style
  const [styles, setStyles] = useState<StyleTemplate[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  // Step 5: Script
  const [script, setScript] = useState("");
  const [copied, setCopied] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  // ─── API Calls ─────────────────────────────────────────────────────────────
  const generateResearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wizard/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, audience, platform }),
      });
      const data = await res.json();
      setResearch(data);
      setCurrentStep("research");
    } catch (e) {
      console.error("Research error:", e);
    } finally {
      setLoading(false);
    }
  }, [topic, audience, platform]);

  const generateHooks = useCallback(async () => {
    setLoading(true);
    try {
      const researchContext = selectedResearch.length > 0
        ? selectedResearch.join("\n")
        : undefined;
      const res = await fetch("/api/ai/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, audience, research_context: researchContext }),
      });
      const data = await res.json();
      setHooks(data.hooks || []);
      setCurrentStep("hooks");
    } catch (e) {
      console.error("Hooks error:", e);
    } finally {
      setLoading(false);
    }
  }, [topic, audience, selectedResearch]);

  const loadStyles = useCallback(async () => {
    try {
      const res = await fetch("/api/wizard/styles");
      const data = await res.json();
      setStyles(data.system_styles || []);
    } catch (e) {
      console.error("Styles error:", e);
    }
    setCurrentStep("style");
  }, []);

  const generateScript = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          audience,
          platform,
          tone,
          script_type: "video_script",
          selected_hook: selectedHook?.text,
          selected_research: selectedResearch,
          style_id: selectedStyle,
        }),
      });
      const data = await res.json();
      setScript(data.content || "");
      setCurrentStep("script");
    } catch (e) {
      console.error("Script error:", e);
    } finally {
      setLoading(false);
    }
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
  const estimatedDuration = Math.round(wordCount / 2.5); // ~150 words per minute, converted to seconds

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Step Progress Bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isPast = i < stepIndex;
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => isPast && setCurrentStep(step.id)}
                    disabled={!isPast && !isActive}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                      ${isActive ? "bg-white/10 " + step.color : ""}
                      ${isPast ? "text-zinc-400 hover:text-white cursor-pointer" : ""}
                      ${!isPast && !isActive ? "text-zinc-600 cursor-not-allowed" : ""}
                    `}
                  >
                    {isPast ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    {step.label}
                  </button>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-zinc-700 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* ─── STEP 1: TOPIC ──────────────────────────────────────────── */}
        {currentStep === "topic" && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h1 className="text-3xl font-bold mb-2">What&apos;s your content about?</h1>
              <p className="text-zinc-400">Enter your topic, idea, or paste an existing draft. Our AI will research it and engineer a viral script.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Topic / Idea</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Why most people use AI completely wrong..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-white placeholder-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none h-28"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Target Audience</label>
                  <input
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g., Small business owners"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter/X</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Tone</label>
                <div className="flex gap-2 flex-wrap">
                  {["conversational", "professional", "humorous", "authoritative", "casual", "energetic"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        tone === t
                          ? "bg-violet-500/20 border-violet-500 text-violet-300"
                          : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                      }`}
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
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Researching...
                </>
              ) : (
                <>
                  Research Topic <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ─── STEP 2: RESEARCH ───────────────────────────────────────── */}
        {currentStep === "research" && research && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h1 className="text-3xl font-bold mb-2">Research Insights</h1>
              <p className="text-zinc-400">Select the insights you want to include in your script. The AI will weave them in naturally.</p>
            </div>

            {/* Misconceptions */}
            {research.misconceptions?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" /> Misconception vs Reality
                </h3>
                <div className="space-y-3">
                  {research.misconceptions.map((m, i) => {
                    const item = `MISCONCEPTION: "${m.myth}" → REALITY: "${m.reality}"`;
                    const isSelected = selectedResearch.includes(item);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleResearchItem(item)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-blue-500/10 border-blue-500"
                            : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-red-400 text-sm line-through">{m.myth}</p>
                            <p className="text-emerald-400 mt-1">{m.reality}</p>
                          </div>
                          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full ml-3">
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
              <div>
                <h3 className="text-lg font-semibold mb-3">Hook-Worthy Statistics</h3>
                <div className="grid grid-cols-1 gap-3">
                  {research.statistics.map((s, i) => {
                    const item = `STATISTIC: ${s.stat} (Source: ${s.source})`;
                    const isSelected = selectedResearch.includes(item);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleResearchItem(item)}
                        className={`text-left p-4 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-blue-500/10 border-blue-500"
                            : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
                        }`}
                      >
                        <p className="font-medium">{s.stat}</p>
                        <p className="text-xs text-zinc-500 mt-1">Source: {s.source}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Analogies */}
            {research.analogies?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Simple Analogies (ELI5)</h3>
                <div className="space-y-3">
                  {research.analogies.map((a, i) => {
                    const item = `ANALOGY: ${a.concept} is like ${a.analogy}`;
                    const isSelected = selectedResearch.includes(item);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleResearchItem(item)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-blue-500/10 border-blue-500"
                            : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
                        }`}
                      >
                        <p><span className="text-zinc-400">{a.concept} →</span> {a.analogy}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="text-sm text-zinc-500">
              {selectedResearch.length} insight{selectedResearch.length !== 1 ? "s" : ""} selected
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("topic")}
                className="px-6 py-3 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition-all flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={generateHooks}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating Hooks...
                  </>
                ) : (
                  <>
                    Generate Hooks <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: HOOKS ──────────────────────────────────────────── */}
        {currentStep === "hooks" && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h1 className="text-3xl font-bold mb-2">Choose Your Hook</h1>
              <p className="text-zinc-400">Each hook uses a different psychological mechanism. Pick the one that stops the scroll.</p>
            </div>

            <div className="space-y-4">
              {hooks.map((hook, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedHook(hook)}
                  className={`w-full text-left p-5 rounded-lg border transition-all ${
                    selectedHook === hook
                      ? "bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50"
                      : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                      {hook.type}
                    </span>
                    <span className="text-xs text-amber-400">
                      Scroll-Stop: {hook.scroll_stop_power}/10
                    </span>
                  </div>
                  <p className="text-lg font-medium mb-2">&ldquo;{hook.text}&rdquo;</p>
                  <p className="text-xs text-zinc-500">
                    <span className="text-zinc-400">Psychology:</span> {hook.psychology}
                  </p>
                  {hook.why_it_works && (
                    <p className="text-xs text-zinc-500 mt-1">
                      <span className="text-zinc-400">Why it works:</span> {hook.why_it_works}
                    </p>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("research")}
                className="px-6 py-3 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition-all flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={loadStyles}
                disabled={!selectedHook}
                className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                Choose Style <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 4: STYLE ──────────────────────────────────────────── */}
        {currentStep === "style" && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h1 className="text-3xl font-bold mb-2">Choose a Style</h1>
              <p className="text-zinc-400">Each style is a proven storytelling format. Pick the one that fits your content.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`text-left p-4 rounded-lg border transition-all ${
                    selectedStyle === style.id
                      ? "bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50"
                      : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  <h3 className="font-semibold mb-1">{style.name}</h3>
                  <p className="text-sm text-zinc-400 mb-2">{style.description}</p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{style.word_count_range[0]}-{style.word_count_range[1]} words</span>
                    <span className="text-zinc-700">|</span>
                    <span>{style.tone}</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {style.platform_fit.map((p) => (
                      <span key={p} className={`text-xs px-1.5 py-0.5 rounded ${
                        p === platform ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                      }`}>
                        {p}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("hooks")}
                className="px-6 py-3 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition-all flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={generateScript}
                disabled={!selectedStyle || loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Writing Script...
                  </>
                ) : (
                  <>
                    Generate Script <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 5: SCRIPT ─────────────────────────────────────────── */}
        {currentStep === "script" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-1">Your Script</h1>
                <p className="text-zinc-400 text-sm">
                  {wordCount} words &middot; ~{estimatedDuration}s at normal pace
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyScript}
                  className="p-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white transition-all"
                  title="Copy"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([script], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${topic.slice(0, 30).replace(/\s+/g, "_")}_script.txt`;
                    a.click();
                  }}
                  className="p-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white transition-all"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  className="p-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white transition-all"
                  title="Estimated Duration"
                >
                  <Clock className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Script Content */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {script}
              </pre>
            </div>

            {/* Quick Action Chips */}
            <div>
              <p className="text-sm text-zinc-400 mb-2">Quick edits</p>
              <div className="flex gap-2 flex-wrap">
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
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm rounded-full border border-zinc-700 text-zinc-400 hover:text-white hover:border-rose-500 hover:bg-rose-500/10 transition-all disabled:opacity-50"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Applying edits...
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("style")}
                className="px-6 py-3 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition-all flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={async () => {
                  // Save the script
                  await fetch("/api/wizard/state", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      topic,
                      audience,
                      platform,
                      tone,
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
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                Save to Library <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
