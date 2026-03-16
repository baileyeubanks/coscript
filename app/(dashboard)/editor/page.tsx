"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Archive,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileText,
  History,
  Layers3,
  Lightbulb,
  Loader2,
  NotebookPen,
  PenLine,
  RefreshCw,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import type {
  AuthSessionResponse,
  FrameworkRecord,
  LocalDraftBackup,
  PersistenceMode,
  ResearchItemRecord,
  ScoreBreakdown,
  ScriptRecord,
  ScriptVersionRecord,
  VaultItemRecord,
} from "@/lib/contracts";
import styles from "./page.module.css";

type HookVariant = {
  type: string;
  text: string;
};

type FrameworkMatch = {
  name: string;
  fit: number;
  suggestion: string;
};

type SupportFramework = FrameworkRecord;
type SupportResearchItem = ResearchItemRecord;
type SupportVaultItem = VaultItemRecord;

type Version = ScriptVersionRecord;

type WorkspaceTab = "generate" | "refine" | "outline" | "versions" | "context";
type StageKey = "ideate" | "draft" | "refine";
type AiModeKey = "angles" | "outline" | "draft" | "rewrite";
type WorkspacePersistenceState = PersistenceMode | "checking";

type NoticeTone = "info" | "warning" | "danger";

type WorkspaceNotice = {
  tone: NoticeTone;
  message: string;
};

type SectionBlueprint = {
  label: string;
  prompt: string;
};

type OutlineItem = {
  id: string;
  label: string;
  hint: string;
};

type AngleOption = {
  label: string;
  hook: string;
  why_it_works: string;
  beats: string[];
};

type DraftOutlineSection = {
  label: string;
  purpose: string;
  beats: string[];
};

type EditorSelection = {
  start: number;
  end: number;
  text: string;
};

type AiResult =
  | {
      kind: "angles";
      summary: string;
      angles: AngleOption[];
    }
  | {
      kind: "outline";
      summary: string;
      title: string;
      outline: DraftOutlineSection[];
    }
  | {
      kind: "draft";
      summary: string;
      title: string;
      content: string;
      outline: DraftOutlineSection[];
    }
  | {
      kind: "rewrite";
      summary: string;
      instruction: string;
      scope: "selection" | "document";
      content: string;
      selectionStart: number;
      selectionEnd: number;
    };

type RewriteRecipe = {
  key: string;
  label: string;
  detail: string;
  instruction: string;
  preferredScope: "selection" | "document" | "auto";
};

const DEFAULT_BREAKDOWN: ScoreBreakdown = {
  hook_strength: 0,
  clarity: 0,
  structure: 0,
  emotional_pull: 0,
  cta_power: 0,
};

const SCRIPT_BLUEPRINTS: Record<
  string,
  {
    label: string;
    guide: string;
    sections: SectionBlueprint[];
  }
> = {
  video_script: {
    label: "Video Script",
    guide: "Start with tension, move through proof, and land one clear action.",
    sections: [
      { label: "Hook", prompt: "Lead with the sharpest tension, stat, or claim." },
      { label: "Setup", prompt: "Name the audience problem and why it matters now." },
      { label: "Proof", prompt: "Add evidence, examples, or a working case study." },
      { label: "Turn", prompt: "Deliver the insight, lesson, or strategic shift." },
      { label: "CTA", prompt: "Close with one next step or strong takeaway." },
    ],
  },
  social_media: {
    label: "Social Post",
    guide: "Keep it compact, pointed, and built around one strong idea.",
    sections: [
      { label: "Opening Line", prompt: "Give the scroll-stopping first sentence." },
      { label: "Core Point", prompt: "State the main argument in direct language." },
      { label: "Proof", prompt: "Add an example, stat, or observation." },
      { label: "Close", prompt: "End with a takeaway, CTA, or reply prompt." },
    ],
  },
  blog: {
    label: "Blog Post",
    guide: "Build a clear argument with readable sections and useful proof.",
    sections: [
      { label: "Headline", prompt: "Draft the working title and strongest promise." },
      { label: "Introduction", prompt: "Frame the topic and why the reader should care." },
      { label: "Argument", prompt: "Lay out the core point in a few crisp sections." },
      { label: "Evidence", prompt: "Support it with examples, data, or references." },
      { label: "Conclusion", prompt: "Summarize the point and next action." },
    ],
  },
  ad_copy: {
    label: "Ad Copy",
    guide: "Compress the message, sharpen the claim, and keep the CTA unmistakable.",
    sections: [
      { label: "Headline", prompt: "State the strongest promise in one line." },
      { label: "Support", prompt: "Add the proof point or differentiator." },
      { label: "Body", prompt: "Develop the message without losing urgency." },
      { label: "CTA", prompt: "Close with a specific action and frictionless next step." },
    ],
  },
  email: {
    label: "Email",
    guide: "Lead with a clear angle, stay focused, and end with a direct ask.",
    sections: [
      { label: "Subject", prompt: "Draft a subject line that earns the open." },
      { label: "Lead", prompt: "Open with context or the key tension immediately." },
      { label: "Body", prompt: "Develop one message with supporting detail." },
      { label: "CTA", prompt: "Ask for one response or next step." },
    ],
  },
};

const TYPE_OPTIONS = [
  { value: "video_script", label: "Video Script" },
  { value: "social_media", label: "Social Post" },
  { value: "blog", label: "Blog Post" },
  { value: "ad_copy", label: "Ad Copy" },
  { value: "email", label: "Email" },
];

const TONE_OPTIONS = [
  "conversational",
  "professional",
  "urgent",
  "inspiring",
  "educational",
  "provocative",
];

const PLATFORM_OPTIONS = [
  "youtube",
  "tiktok",
  "instagram",
  "linkedin",
  "twitter",
  "email",
];

const WORKFLOW_STAGES: Array<{
  key: StageKey;
  label: string;
  detail: string;
  icon: typeof Lightbulb;
}> = [
  {
    key: "ideate",
    label: "Ideate",
    detail: "Pin down the audience, objective, and opening angle before the draft hardens.",
    icon: Lightbulb,
  },
  {
    key: "draft",
    label: "Draft",
    detail: "Get the full argument on the page with a visible section structure.",
    icon: PenLine,
  },
  {
    key: "refine",
    label: "Refine",
    detail: "Pressure-test structure, hook strength, and CTA quality before handoff.",
    icon: Sparkles,
  },
];

const PANEL_TABS: Array<{
  key: WorkspaceTab;
  label: string;
  icon: typeof BarChart3;
}> = [
  { key: "generate", label: "Generate", icon: Sparkles },
  { key: "refine", label: "Refine", icon: BarChart3 },
  { key: "outline", label: "Outline", icon: Layers3 },
  { key: "versions", label: "Versions", icon: History },
  { key: "context", label: "Context", icon: BookOpen },
];

const AI_MODE_OPTIONS: Array<{
  key: AiModeKey;
  label: string;
  detail: string;
  icon: typeof Lightbulb;
}> = [
  {
    key: "angles",
    label: "Signal Scan",
    detail: "Generate a few distinct hook-and-lens combinations before you commit to one path.",
    icon: Lightbulb,
  },
  {
    key: "outline",
    label: "Narrative Map",
    detail: "Turn the brief and notes into a context, conflict, proof, turn, payoff map.",
    icon: Layers3,
  },
  {
    key: "draft",
    label: "Script Build",
    detail: "Write a workable proof-led script that fits the format instead of a generic answer.",
    icon: PenLine,
  },
  {
    key: "rewrite",
    label: "Sharpen Pass",
    detail: "Tighten the full script or surgically rework a selected passage for tension and clarity.",
    icon: Wand2,
  },
];

const REWRITE_RECIPES: RewriteRecipe[] = [
  {
    key: "tighten",
    label: "Tighten",
    detail: "Trim filler and keep the core argument intact.",
    instruction: "Tighten the writing, remove filler, and make each line earn its place.",
    preferredScope: "auto",
  },
  {
    key: "sharpen-hook",
    label: "Sharpen Hook",
    detail: "Make the opening hit faster and establish the real stakes.",
    instruction: "Rewrite for a stronger opening with higher tension, clearer stakes, and a more native spoken rhythm.",
    preferredScope: "selection",
  },
  {
    key: "clarify",
    label: "Clarify",
    detail: "Improve logic, pacing, and readability.",
    instruction: "Improve clarity, pacing, and flow without flattening the voice or removing proof.",
    preferredScope: "auto",
  },
  {
    key: "cta",
    label: "Strengthen CTA",
    detail: "Make the close more specific and actionable.",
    instruction: "Rewrite with a more specific, persuasive, and lower-friction CTA tied to the script's main payoff.",
    preferredScope: "selection",
  },
];

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function buildLocalDraftKey(loadId: string | null, scriptId: string | null) {
  return `coscript:workspace:${loadId || scriptId || "new"}`;
}

function formatTime(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function deriveStage(wordCount: number, score: number, hook: string, objective: string) {
  if (wordCount === 0 && !hook.trim() && !objective.trim()) return "ideate";
  if (score > 0) return "refine";
  return "draft";
}

function getDocumentState(wordCount: number, score: number, hook: string, objective: string) {
  const stage = deriveStage(wordCount, score, hook, objective);
  if (stage === "ideate") {
    return {
      label: "Briefing",
      note: "Shape the angle first. A strong opening and objective will tighten the whole draft.",
    };
  }
  if (stage === "draft") {
    return {
      label: "Draft in progress",
      note: "Keep the writing loose until the full structure is on the page.",
    };
  }
  if (score >= 80) {
    return {
      label: "Ready for review",
      note: "The draft is structured and scored well enough for a final editorial pass.",
    };
  }
  return {
    label: "Refining",
    note: "Use the analysis rail to tighten pacing, clarity, and CTA strength.",
  };
}

function buildStarterTemplate(scriptType: string, hook: string, audience: string, objective: string) {
  const blueprint = SCRIPT_BLUEPRINTS[scriptType] || SCRIPT_BLUEPRINTS.video_script;

  return blueprint.sections
    .map((section, index) => {
      const prompt =
        index === 0 && hook.trim()
          ? hook.trim()
          : index === 1 && audience.trim()
            ? `Audience: ${audience.trim()}\n${section.prompt}`
            : index === blueprint.sections.length - 1 && objective.trim()
              ? `Objective: ${objective.trim()}\n${section.prompt}`
              : section.prompt;

      return `[${section.label.toUpperCase()}]\n${prompt}`;
    })
    .join("\n\n");
}

function deriveOutlineItems(content: string, scriptType: string) {
  const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);
  const explicit = lines
    .map((line, index) => {
      const bracketMatch = line.match(/^\[(.+?)\]$/);
      if (bracketMatch) {
        return {
          id: `outline-${index}`,
          label: bracketMatch[1],
          hint: "Section marker",
        };
      }

      const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
      if (headingMatch) {
        return {
          id: `outline-${index}`,
          label: headingMatch[1],
          hint: "Heading",
        };
      }

      if (line.length <= 60 && (line.endsWith(":") || line === line.toUpperCase())) {
        return {
          id: `outline-${index}`,
          label: line.replace(/:$/, ""),
          hint: "Scene heading",
        };
      }

      return null;
    })
    .filter((item): item is OutlineItem => Boolean(item));

  if (explicit.length > 0) return explicit;

  const blueprint = SCRIPT_BLUEPRINTS[scriptType] || SCRIPT_BLUEPRINTS.video_script;
  return blueprint.sections.map((section, index) => ({
    id: `fallback-${index}`,
    label: section.label,
    hint: content.trim() ? "Suggested section" : section.prompt,
  }));
}

function createDownload(title: string, content: string) {
  const safeTitle = (title || "co-script-draft").trim().replace(/[^\w-]+/g, "-").toLowerCase();
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeTitle || "co-script-draft"}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function formatGeneratedOutline(outline: DraftOutlineSection[], scriptType: string) {
  const fallbackBlueprint = SCRIPT_BLUEPRINTS[scriptType] || SCRIPT_BLUEPRINTS.video_script;
  const sections =
    outline.length > 0
      ? outline
      : fallbackBlueprint.sections.map((section) => ({
          label: section.label,
          purpose: section.prompt,
          beats: [],
        }));

  return sections
    .map((section) => {
      const beats = section.beats.filter(Boolean).map((beat) => `- ${beat}`).join("\n");
      return `[${section.label.toUpperCase()}]\n${section.purpose}${beats ? `\n${beats}` : ""}`;
    })
    .join("\n\n");
}

function getAiModeMeta(mode: AiModeKey, hasBrief: boolean, hasDraft: boolean, hasSelection: boolean) {
  if (mode === "angles") {
    return hasBrief ? "Ready from brief" : "Needs brief";
  }

  if (mode === "outline") {
    if (hasDraft) return "Uses brief + draft";
    return hasBrief ? "Uses brief" : "Needs brief";
  }

  if (mode === "draft") {
    if (hasDraft) return "Builds from notes";
    return hasBrief ? "Writes from brief" : "Needs brief";
  }

  if (hasSelection) return "Selection ready";
  return hasDraft ? "Uses full draft" : "Needs draft";
}

function getAiInputs(mode: AiModeKey, hasDraft: boolean, hasSelection: boolean) {
  if (mode === "angles") return ["Audience", "Objective", "Opening angle"];
  if (mode === "outline") return hasDraft ? ["Brief", "Current draft", "Script format"] : ["Brief", "Script format"];
  if (mode === "draft") return hasDraft ? ["Brief", "Current notes", "Format + tone"] : ["Brief", "Format + tone"];
  return hasSelection ? ["Selected passage", "Full draft context", "Tone"] : ["Full draft", "Brief", "Tone"];
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}><div className="skeleton" style={{ height: "100vh" }} /></div>}>
      <EditorInner />
    </Suspense>
  );
}

function EditorInner() {
  const searchParams = useSearchParams();
  const loadId = searchParams.get("load");
  const requestedType = searchParams.get("type") || "video_script";
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [scriptId, setScriptId] = useState<string | null>(null);
  const [title, setTitle] = useState("Untitled Script");
  const [scriptType, setScriptType] = useState(requestedType);
  const [content, setContent] = useState("");
  const [hook, setHook] = useState("");
  const [audience, setAudience] = useState("");
  const [objective, setObjective] = useState("");
  const [tone, setTone] = useState("conversational");
  const [platform, setPlatform] = useState("youtube");

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("generate");
  const [activeAiMode, setActiveAiMode] = useState<AiModeKey>("angles");
  const [score, setScore] = useState(0);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown>(DEFAULT_BREAKDOWN);
  const [reasoning, setReasoning] = useState("");
  const [hookVariants, setHookVariants] = useState<HookVariant[]>([]);
  const [frameworkMatch, setFrameworkMatch] = useState<FrameworkMatch[]>([]);
  const [audienceAnalysis, setAudienceAnalysis] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [aiDirection, setAiDirection] = useState("");
  const [rewriteRecipe, setRewriteRecipe] = useState(REWRITE_RECIPES[0].key);
  const [rewriteInstruction, setRewriteInstruction] = useState(REWRITE_RECIPES[0].instruction);
  const [editorSelection, setEditorSelection] = useState<EditorSelection>({
    start: 0,
    end: 0,
    text: "",
  });
  const [aiResult, setAiResult] = useState<AiResult | null>(null);

  const [saving, setSaving] = useState(false);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [runningAiMode, setRunningAiMode] = useState<AiModeKey | null>(null);
  const [persistenceMode, setPersistenceMode] = useState<WorkspacePersistenceState>("checking");
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [backupUpdatedAt, setBackupUpdatedAt] = useState<string | null>(null);
  const [notice, setNotice] = useState<WorkspaceNotice | null>(null);
  const [researchItems, setResearchItems] = useState<SupportResearchItem[]>([]);
  const [vaultItems, setVaultItems] = useState<SupportVaultItem[]>([]);
  const [supportFrameworks, setSupportFrameworks] = useState<SupportFramework[]>([]);
  const [loadingContext, setLoadingContext] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);

  const blueprint = SCRIPT_BLUEPRINTS[scriptType] || SCRIPT_BLUEPRINTS.video_script;
  const currentStage = deriveStage(wordCount, score, hook, objective);
  const documentState = getDocumentState(wordCount, score, hook, objective);
  const outlineItems = deriveOutlineItems(content, scriptType);
  const readingTime = Math.max(1, Math.round(wordCount / 150));
  const saveTime = formatTime(lastSavedAt);
  const backupTime = formatTime(backupUpdatedAt);
  const hasBrief = Boolean(audience.trim() || objective.trim() || hook.trim());
  const hasDraft = Boolean(content.trim());
  const hasSelection = Boolean(editorSelection.text.trim());
  const selectionWordCount = hasSelection ? editorSelection.text.trim().split(/\s+/).filter(Boolean).length : 0;
  const selectedRewriteRecipe = REWRITE_RECIPES.find((recipe) => recipe.key === rewriteRecipe) || REWRITE_RECIPES[0];
  const rewriteScope =
    selectedRewriteRecipe.preferredScope === "selection"
      ? "selection"
      : selectedRewriteRecipe.preferredScope === "document"
        ? "document"
        : hasSelection
          ? "selection"
          : "document";
  const activeAiConfig = AI_MODE_OPTIONS.find((mode) => mode.key === activeAiMode) || AI_MODE_OPTIONS[0];

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [content]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            setPersistenceMode("local");
          }
          return;
        }

        const data = (await res.json()) as AuthSessionResponse;
        if (!cancelled) {
          setPersistenceMode(data.authenticated ? "cloud" : "local");
        }
      } catch {
        if (!cancelled) {
          setPersistenceMode("local");
        }
      }
    }

    void hydrateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!PLATFORM_OPTIONS.includes(platform)) {
      setPlatform(scriptType === "email" ? "email" : "youtube");
    }
  }, [platform, scriptType]);

  useEffect(() => {
    setRewriteInstruction(selectedRewriteRecipe.instruction);
  }, [selectedRewriteRecipe]);

  const fetchVersions = useCallback(async (id: string) => {
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/scripts/${id}/versions`);
      if (!res.ok) {
        if (res.status === 401) {
          setPersistenceMode("local");
          setNotice({
            tone: "warning",
            message: "Version history is only available when you are signed in.",
          });
        }
        setVersions([]);
        return;
      }

      const data = await res.json();
      setVersions(data.versions ?? []);
    } catch {
      setNotice({
        tone: "warning",
        message: "Version history could not be loaded. The draft workspace still works locally.",
      });
    } finally {
      setLoadingVersions(false);
    }
  }, []);

  useEffect(() => {
    if (persistenceMode === "cloud" && scriptId) {
      void fetchVersions(scriptId);
      return;
    }

    setVersions([]);
  }, [fetchVersions, persistenceMode, scriptId]);

  useEffect(() => {
    if (persistenceMode !== "cloud") {
      setResearchItems([]);
      setVaultItems([]);
      setSupportFrameworks([]);
      setLoadingContext(false);
      setContextError(null);
      return;
    }

    let cancelled = false;

    async function hydrateContext() {
      setLoadingContext(true);
      setContextError(null);

      try {
        const [researchResponse, vaultResponse, frameworksResponse] = await Promise.all([
          fetch("/api/research?sort=outlier_score&limit=4"),
          fetch("/api/vault"),
          fetch("/api/frameworks"),
        ]);

        if (!researchResponse.ok || !vaultResponse.ok || !frameworksResponse.ok) {
          throw new Error("context-unavailable");
        }

        const [researchData, vaultData, frameworksData] = await Promise.all([
          researchResponse.json(),
          vaultResponse.json(),
          frameworksResponse.json(),
        ]);

        if (cancelled) return;

        setResearchItems((researchData.items ?? []) as SupportResearchItem[]);
        setVaultItems(((vaultData.items ?? []) as SupportVaultItem[]).slice(0, 4));
        setSupportFrameworks(
          ((frameworksData.frameworks ?? []) as Array<SupportFramework | (SupportFramework & { structure: string | string[] })>)
            .map((framework) => ({
              ...framework,
              structure:
                typeof framework.structure === "string"
                  ? JSON.parse(framework.structure)
                  : framework.structure,
            }))
            .slice(0, 4),
        );
      } catch {
        if (!cancelled) {
          setContextError("Support material could not be loaded right now.");
        }
      } finally {
        if (!cancelled) {
          setLoadingContext(false);
        }
      }
    }

    void hydrateContext();

    return () => {
      cancelled = true;
    };
  }, [persistenceMode]);

  const applyScriptRecord = useCallback((script: ScriptRecord) => {
    setScriptId(script.id || null);
    setTitle(script.title || "Untitled Script");
    setScriptType(script.script_type || requestedType);
    setContent(script.content || "");
    setHook(script.hook || "");
    setAudience(script.audience || "");
    setObjective(script.objective || "");
    setTone(script.tone || "conversational");
    setPlatform(script.platform || (script.script_type === "email" ? "email" : "youtube"));
    setScore(script.score || 0);
    setBreakdown({ ...DEFAULT_BREAKDOWN, ...(script.score_breakdown || {}) });
    setReasoning(script.ai_feedback?.reasoning || "");
    setAudienceAnalysis(script.ai_feedback?.audience_analysis || "");
    setDirty(false);
    setLastSavedAt(script.updated_at || new Date().toISOString());
    setAiResult(null);
    setEditorSelection({ start: 0, end: 0, text: "" });
  }, [requestedType]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateWorkspace() {
      if (!loadId) {
        const stored = window.localStorage.getItem(buildLocalDraftKey(loadId, null));
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as LocalDraftBackup;
            if (parsed.payload && !cancelled) {
              applyScriptRecord({
                id: parsed.payload.id || "",
                title: parsed.payload.title || "Untitled Script",
                script_type: parsed.payload.script_type || requestedType,
                content: parsed.payload.content || "",
                hook: parsed.payload.hook || "",
                audience: parsed.payload.audience || "",
                objective: parsed.payload.objective || "",
                tone: parsed.payload.tone || "conversational",
                platform: parsed.payload.platform || "youtube",
                score: parsed.payload.score || 0,
                score_breakdown: parsed.payload.score_breakdown || DEFAULT_BREAKDOWN,
                ai_feedback: parsed.payload.ai_feedback || {},
                status: parsed.payload.status || "Local draft",
                word_count: parsed.payload.word_count || 0,
                updated_at: parsed.payload.updated_at || new Date().toISOString(),
              });
              setDirty(true);
              setBackupUpdatedAt(parsed.payload.backup_at || new Date().toISOString());
              setNotice({
                tone: "info",
                message: "Restored your browser backup. Sign in and save to sync it to Supabase.",
              });
            }
          } catch {
            // Ignore malformed local storage entries and continue with a clean draft.
          }
        }
        return;
      }

      setLoadingDocument(true);

      try {
        const res = await fetch(`/api/scripts/${loadId}`);
        if (!res.ok) {
          if (res.status === 401) {
            setPersistenceMode("local");
          }

          const stored = window.localStorage.getItem(buildLocalDraftKey(loadId, null));
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as LocalDraftBackup;
              if (parsed.payload && !cancelled) {
                applyScriptRecord({
                  id: parsed.payload.id || loadId,
                  title: parsed.payload.title || "Untitled Script",
                  script_type: parsed.payload.script_type || requestedType,
                  content: parsed.payload.content || "",
                  hook: parsed.payload.hook || "",
                  audience: parsed.payload.audience || "",
                  objective: parsed.payload.objective || "",
                  tone: parsed.payload.tone || "conversational",
                  platform: parsed.payload.platform || "youtube",
                  score: parsed.payload.score || 0,
                  score_breakdown: parsed.payload.score_breakdown || DEFAULT_BREAKDOWN,
                  ai_feedback: parsed.payload.ai_feedback || {},
                  status: parsed.payload.status || "Local backup",
                  word_count: parsed.payload.word_count || 0,
                  updated_at: parsed.payload.updated_at || new Date().toISOString(),
                });
                setDirty(true);
                setBackupUpdatedAt(parsed.payload.backup_at || new Date().toISOString());
                setNotice({
                  tone: "warning",
                  message: "The Supabase draft could not be loaded, but a browser backup was restored into the workspace.",
                });
              }
            } catch {
              setNotice({
                tone: "danger",
                message: "The saved draft could not be restored from the browser backup either.",
              });
            }
          } else if (!cancelled) {
            setNotice({
              tone: res.status === 401 ? "warning" : "danger",
              message:
                res.status === 401
                  ? "Sign in to load this draft from Supabase."
                  : "This script could not be loaded. The editor still supports a fresh draft.",
            });
          }
          return;
        }

        const data = await res.json();
        if (!cancelled && data.script) {
          applyScriptRecord(data.script);
          setNotice({
            tone: "info",
            message: "Loaded the saved script workspace, including its latest scoring state.",
          });
        }
      } catch {
        if (!cancelled) {
          setNotice({
            tone: "danger",
            message: "The editor could not reach the draft service. Local writing still works, but cloud sync is unavailable.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingDocument(false);
        }
      }
    }

    void hydrateWorkspace();

    return () => {
      cancelled = true;
    };
  }, [applyScriptRecord, loadId, requestedType]);

  const save = useCallback(async () => {
    if (persistenceMode === "local") {
      setNotice({
        tone: "warning",
        message: "This workspace is in browser-backup mode. Sign in again to sync changes to Supabase.",
      });
      return false;
    }

    setSaving(true);
    setSaved(false);

    const body = {
      title,
      script_type: scriptType,
      content,
      hook,
      audience,
      objective,
      tone,
      platform,
      score,
      score_breakdown: breakdown,
      ai_feedback: {
        reasoning,
        audience_analysis: audienceAnalysis,
      },
      status: documentState.label,
      word_count: wordCount,
    };

    const url = scriptId ? `/api/scripts/${scriptId}` : "/api/scripts";
    const method = scriptId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setPersistenceMode("local");
          setNotice({
            tone: "warning",
            message: "Supabase save needs an active login. Co-Script switched this workspace to browser-backup mode.",
          });
        } else {
          setNotice({
            tone: "danger",
            message: "Supabase save failed. The editor kept your browser backup intact.",
          });
        }
        return false;
      }

      const data = await res.json();
      const previousLocalKey = buildLocalDraftKey(loadId, scriptId);
      if (!scriptId && data.script?.id) {
        const nextLocalKey = buildLocalDraftKey(loadId, data.script.id);
        if (previousLocalKey !== nextLocalKey) {
          window.localStorage.removeItem(previousLocalKey);
        }
        setScriptId(data.script.id);
      }
      if (data.script) {
        setLastSavedAt(data.script.updated_at || new Date().toISOString());
      } else {
        setLastSavedAt(new Date().toISOString());
      }
      setPersistenceMode("cloud");
      setDirty(false);
      setSaved(true);
      setNotice({
        tone: "info",
        message: "Cloud save updated. Version history will track the next content change.",
      });
      window.setTimeout(() => setSaved(false), 1800);
      return true;
    } catch {
      setNotice({
        tone: "danger",
        message: "The save request failed. Your draft remains available in this browser backup.",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    audience,
    audienceAnalysis,
    breakdown,
    content,
    documentState.label,
    hook,
    loadId,
    objective,
    persistenceMode,
    platform,
    reasoning,
    score,
    scriptId,
    scriptType,
    title,
    tone,
    wordCount,
  ]);

  useEffect(() => {
    if (!dirty || loadingDocument || persistenceMode !== "cloud") return;

    autoSaveTimer.current = setTimeout(() => {
      void save();
    }, 12000);

    return () => clearTimeout(autoSaveTimer.current);
  }, [dirty, loadingDocument, persistenceMode, save]);

  useEffect(() => {
    const backupAt = new Date().toISOString();
    const payload = {
      id: scriptId || loadId || "",
      title,
      script_type: scriptType,
      content,
      hook,
      audience,
      objective,
      tone,
      platform,
      score,
      score_breakdown: breakdown,
      ai_feedback: {
        reasoning,
        audience_analysis: audienceAnalysis,
      },
      status: documentState.label,
      updated_at: lastSavedAt || backupAt,
      word_count: wordCount,
      backup_at: backupAt,
    };

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(
        buildLocalDraftKey(loadId, scriptId),
        JSON.stringify({ payload }),
      );
      setBackupUpdatedAt(backupAt);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [
    audience,
    audienceAnalysis,
    breakdown,
    content,
    documentState.label,
    hook,
    lastSavedAt,
    loadId,
    objective,
    platform,
    reasoning,
    score,
    scriptId,
    scriptType,
    title,
    tone,
    wordCount,
  ]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  function markDirty() {
    setDirty(true);
  }

  function focusEditor() {
    editorRef.current?.focus();
  }

  function syncEditorSelection() {
    const editor = editorRef.current;
    if (!editor) return;

    const start = editor.selectionStart ?? 0;
    const end = editor.selectionEnd ?? 0;

    setEditorSelection({
      start,
      end,
      text: start === end ? "" : editor.value.slice(start, end),
    });
  }

  function placeCursor(position: number) {
    window.requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      editor.setSelectionRange(position, position);
      syncEditorSelection();
    });
  }

  function applyTitleFromAi(nextTitle: string | null | undefined) {
    if (!nextTitle?.trim()) return;
    if (!title.trim() || title === "Untitled Script") {
      setTitle(nextTitle.trim());
    }
  }

  function replaceEditorRange(start: number, end: number, nextText: string) {
    const safeStart = Math.max(0, start);
    const safeEnd = Math.max(safeStart, end);

    setContent((current) => `${current.slice(0, safeStart)}${nextText}${current.slice(safeEnd)}`);
    setDirty(true);
    placeCursor(safeStart + nextText.length);
  }

  function replaceDraftContent(nextText: string, nextTitle?: string) {
    setContent(nextText);
    applyTitleFromAi(nextTitle);
    setDirty(true);
    setActiveTab("outline");
    setNotice({
      tone: "info",
      message: "The AI pass was loaded into the editor as the current working draft.",
    });
    placeCursor(nextText.length);
  }

  function appendToDraft(nextText: string, nextTitle?: string) {
    const separator = content.trim() ? "\n\n" : "";
    setContent((current) => `${current.trimEnd()}${separator}${nextText}`);
    applyTitleFromAi(nextTitle);
    setDirty(true);
    setNotice({
      tone: "info",
      message: "The AI pass was appended beneath the current draft so you can keep both versions on the page.",
    });
    placeCursor(content.trimEnd().length + separator.length + nextText.length);
  }

  function insertAtCursor(nextText: string, nextTitle?: string) {
    const editor = editorRef.current;
    if (!editor) {
      appendToDraft(nextText, nextTitle);
      return;
    }

    const start = editor.selectionStart ?? editorSelection.start;
    const end = editor.selectionEnd ?? editorSelection.end;
    replaceEditorRange(start, end, nextText);
    applyTitleFromAi(nextTitle);
    setNotice({
      tone: "info",
      message: "The AI pass was inserted directly into the writing surface at the current cursor position.",
    });
  }

  function requireAiSession(taskLabel: string) {
    if (persistenceMode === "cloud") return true;

    setNotice({
      tone: "warning",
      message: `Sign in to run ${taskLabel}. Co-Script keeps local drafting available, but AI passes use the authenticated workspace.`,
    });
    return false;
  }

  async function copyTextToClipboard(text: string, message: string) {
    await navigator.clipboard.writeText(text);
    setNotice({
      tone: "info",
      message,
    });
  }

  function applyStarterStructure() {
    const template = buildStarterTemplate(scriptType, hook, audience, objective);
    if (!content.trim()) {
      setContent(template);
      setDirty(true);
      setActiveTab("outline");
      setNotice({
        tone: "info",
        message: "Starter structure loaded into the editor. Fill the sections or replace them with an AI outline pass.",
      });
      focusEditor();
      return;
    }

    setContent((current) => `${current.trimEnd()}\n\n${template}`);
    setDirty(true);
    setActiveTab("outline");
    setNotice({
      tone: "info",
      message: "Starter structure appended beneath the current draft for side-by-side shaping.",
    });
    focusEditor();
  }

  function resetDraft() {
    const shouldReset = window.confirm("Clear the current editor draft and keep the workspace metadata?");
    if (!shouldReset) return;

    setContent("");
    setScore(0);
    setBreakdown(DEFAULT_BREAKDOWN);
    setReasoning("");
    setAudienceAnalysis("");
    setHookVariants([]);
    setFrameworkMatch([]);
    setAiResult(null);
    setDirty(true);
    setActiveTab("generate");
    setActiveAiMode("angles");
    setNotice({
      tone: "warning",
      message: "The editor draft was cleared. Your workspace metadata is still intact.",
    });
  }

  async function scoreScript() {
    if (!requireAiSession("draft analysis")) return;

    if (!content.trim()) {
      setNotice({
        tone: "warning",
        message: "Write a draft first so Co-Script has something real to analyze.",
      });
      return;
    }

    setScoring(true);
    setActiveTab("refine");

    try {
      const res = await fetch("/api/ai/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, hook, audience, objective, script_type: scriptType }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setPersistenceMode("local");
          setNotice({
            tone: "warning",
            message: "Your session expired before Co-Script could analyze the draft. Sign in again to resume AI passes.",
          });
          return;
        }

        const error = await res.json().catch(() => ({}));
        setNotice({
          tone: "warning",
          message: error.error || "Scoring is unavailable right now. The writing workspace still works normally.",
        });
        return;
      }

      const data = await res.json();
      const nextBreakdown = { ...DEFAULT_BREAKDOWN, ...(data.breakdown || {}) };

      setScore(data.score ?? 0);
      setBreakdown(nextBreakdown);
      setReasoning(data.reasoning ?? "");
      setHookVariants(data.hooks ?? []);
      setFrameworkMatch(data.frameworks ?? []);
      setAudienceAnalysis(data.audience_analysis ?? "");
      setDirty(true);
      setNotice({
        tone: "info",
        message: "Draft analysis updated. Review the breakdown, hook options, and framework fit before the next save.",
      });
    } catch {
      setNotice({
        tone: "danger",
        message: "The score request failed. Keep writing locally and try analysis again once AI services recover.",
      });
    } finally {
      setScoring(false);
    }
  }

  async function runGenerationMode(mode: Exclude<AiModeKey, "rewrite">) {
    if (!requireAiSession(AI_MODE_OPTIONS.find((item) => item.key === mode)?.label.toLowerCase() || "this AI pass")) {
      return;
    }

    if (mode === "angles" && !hasBrief) {
      setNotice({
        tone: "warning",
        message: "Lock at least one part of the brief before asking Co-Script to explore angles.",
      });
      return;
    }

    if ((mode === "outline" || mode === "draft") && !hasBrief && !hasDraft) {
      setNotice({
        tone: "warning",
        message: "Add brief context or rough notes first so Co-Script has real material to shape.",
      });
      return;
    }

    setRunningAiMode(mode);
    setActiveAiMode(mode);
    setActiveTab("generate");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          title,
          hook,
          audience,
          objective,
          tone,
          platform,
          script_type: scriptType,
          current_content: content,
          direction: aiDirection,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setPersistenceMode("local");
          setNotice({
            tone: "warning",
            message: "Your session expired before Co-Script could run that pass. Sign in again to resume AI drafting.",
          });
          return;
        }

        const error = await res.json().catch(() => ({}));
        setNotice({
          tone: "warning",
          message: error.error || "That AI drafting pass is unavailable right now.",
        });
        return;
      }

      const data = await res.json();

      if (mode === "angles") {
        const angles = Array.isArray(data.angles) ? data.angles : [];
        setAiResult({
          kind: "angles",
          summary: data.summary || "Three alternative angles to pressure-test before drafting.",
          angles,
        });
        setNotice({
          tone: "info",
          message: "Angle explorer is ready. Pick one direction and move into outline or draft mode.",
        });
        return;
      }

      if (mode === "outline") {
        const outline = Array.isArray(data.outline) ? data.outline : [];
        setAiResult({
          kind: "outline",
          summary: data.summary || "Outline builder organized the next draft pass into sections.",
          title: data.title || title,
          outline,
        });
        setNotice({
          tone: "info",
          message: "Outline builder returned a structured plan. Preview it and decide how to place it into the editor.",
        });
        return;
      }

      if (data.content) {
        setAiResult({
          kind: "draft",
          summary: data.summary || "First draft pass generated a working script from the current brief.",
          title: data.title || title,
          content: data.content,
          outline: Array.isArray(data.outline) ? data.outline : [],
        });
        setNotice({
          tone: "info",
          message: "First draft pass is ready. Preview it before replacing anything in the editor.",
        });
      }
    } catch {
      setNotice({
        tone: "danger",
        message: "The generation request failed. Your local workspace is still intact.",
      });
    } finally {
      setRunningAiMode(null);
    }
  }

  async function runRewritePass() {
    if (!requireAiSession("rewrite passes")) return;

    if (!content.trim()) {
      setNotice({
        tone: "warning",
        message: "Write a draft first so Co-Script has real material to rewrite.",
      });
      return;
    }

    if (rewriteScope === "selection" && !hasSelection) {
      setNotice({
        tone: "warning",
        message: "Select the passage you want to rewrite, or switch to a full-draft rewrite pass.",
      });
      return;
    }

    setRunningAiMode("rewrite");
    setActiveAiMode("rewrite");
    setActiveTab("generate");

    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: rewriteScope === "selection" ? editorSelection.text : content,
          full_content: content,
          instruction: rewriteInstruction,
          tone,
          audience,
          objective,
          hook,
          platform,
          script_type: scriptType,
          scope: rewriteScope,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setPersistenceMode("local");
          setNotice({
            tone: "warning",
            message: "Your session expired before the rewrite pass completed. Sign in again to resume AI drafting.",
          });
          return;
        }

        const error = await res.json().catch(() => ({}));
        setNotice({
          tone: "warning",
          message: error.error || "Rewrite is unavailable right now.",
        });
        return;
      }

      const data = await res.json();
      if (!data.content) {
        setNotice({
          tone: "warning",
          message: "Rewrite completed without usable draft output.",
        });
        return;
      }

      setAiResult({
        kind: "rewrite",
        summary:
          data.summary ||
          (rewriteScope === "selection"
            ? "Rewrite pass focused on the selected passage."
            : "Rewrite pass reworked the full draft."),
        instruction: rewriteInstruction,
        scope: rewriteScope,
        content: data.content,
        selectionStart: editorSelection.start,
        selectionEnd: editorSelection.end,
      });
      setNotice({
        tone: "info",
        message:
          rewriteScope === "selection"
            ? "Rewrite pass is ready for the selected passage. Review it before applying."
            : "Rewrite pass is ready for the full draft. Review it before applying.",
      });
    } catch {
      setNotice({
        tone: "danger",
        message: "The rewrite request failed. Your draft is unchanged.",
      });
    } finally {
      setRunningAiMode(null);
    }
  }

  async function generateHooks() {
    if (!requireAiSession("hook generation")) return;

    if (!content.trim()) {
      setNotice({
        tone: "warning",
        message: "Draft a body first, then generate hook variants from the actual script.",
      });
      return;
    }

    setActiveTab("refine");
    setScoring(true);

    try {
      const res = await fetch("/api/ai/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, audience, objective, script_type: scriptType }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setPersistenceMode("local");
          setNotice({
            tone: "warning",
            message: "Your session expired before hook generation completed. Sign in again to resume AI passes.",
          });
          return;
        }

        setNotice({
          tone: "warning",
          message: "Hook generation is unavailable right now.",
        });
        return;
      }

      const data = await res.json();
      setHookVariants(data.hooks ?? []);
      setNotice({
        tone: "info",
        message: "Hook lab updated with fresh variants for this draft.",
      });
    } catch {
      setNotice({
        tone: "danger",
        message: "The hook request failed. Your draft is unchanged.",
      });
    } finally {
      setScoring(false);
    }
  }

  function applyHookVariant(text: string) {
    setHook(text);
    setDirty(true);
    setActiveTab("generate");
    setActiveAiMode("outline");
    setNotice({
      tone: "info",
      message: "Hook updated. Use outline or draft mode to build around the new opening angle.",
    });
  }

  function applyAngleOption(angle: AngleOption) {
    setHook(angle.hook);
    setDirty(true);
    setActiveTab("generate");
    setActiveAiMode("outline");
    setNotice({
      tone: "info",
      message: `${angle.label} is now set as the opening angle. Build the outline or run a draft pass next.`,
    });
  }

  function applyOutlineResult(action: "replace" | "insert" | "append") {
    if (!aiResult || aiResult.kind !== "outline") return;

    const nextText = formatGeneratedOutline(aiResult.outline, scriptType);

    if (action === "replace") {
      replaceDraftContent(nextText, aiResult.title);
      return;
    }

    if (action === "insert") {
      insertAtCursor(nextText, aiResult.title);
      return;
    }

    appendToDraft(nextText, aiResult.title);
  }

  function applyDraftResult(action: "replace" | "append") {
    if (!aiResult || aiResult.kind !== "draft") return;

    if (action === "replace") {
      replaceDraftContent(aiResult.content, aiResult.title);
      return;
    }

    appendToDraft(aiResult.content, aiResult.title);
  }

  function applyRewriteResult() {
    if (!aiResult || aiResult.kind !== "rewrite") return;

    if (aiResult.scope === "selection") {
      replaceEditorRange(aiResult.selectionStart, aiResult.selectionEnd, aiResult.content);
      setNotice({
        tone: "info",
        message: "The selected passage was replaced with the rewrite pass.",
      });
      return;
    }

    replaceDraftContent(aiResult.content, title);
  }

  function restoreVersion(version: Version) {
    const shouldRestore = window.confirm(`Restore version ${version.version_number} into the current draft?`);
    if (!shouldRestore) return;

    setContent(version.content);
    setHook(version.hook || hook);
    setScore(version.score || 0);
    setDirty(true);
    focusEditor();
    setNotice({
      tone: "warning",
      message: `Restored version ${version.version_number} into the editor. Save when you are ready to keep it.`,
    });
  }

  async function copyToClipboard() {
    await copyTextToClipboard(content, "Draft copied to your clipboard.");
  }

  function appendPassDirection(note: string, message: string) {
    setAiDirection((current) => (current.trim() ? `${current.trim()}\n\n${note}` : note));
    setActiveTab("generate");
    setNotice({
      tone: "info",
      message,
    });
  }

  function addResearchSignal(item: SupportResearchItem) {
    const parts = [
      `Research signal: ${item.title}`,
      `Platform: ${item.platform}`,
      item.outlier_score ? `Outlier score: ${item.outlier_score}x` : null,
      item.url ? `Source: ${item.url}` : null,
    ].filter(Boolean);

    appendPassDirection(parts.join("\n"), "Research signal added to the next AI pass direction.");
  }

  function addVaultReference(item: SupportVaultItem) {
    const body = item.content || item.notes || "Use this saved reference as supporting material.";
    const snippet = body.length > 260 ? `${body.slice(0, 257)}...` : body;
    const note = [`Vault reference: ${item.title}`, snippet, item.source_url ? `Source: ${item.source_url}` : null]
      .filter(Boolean)
      .join("\n");

    appendPassDirection(note, "Vault reference added to the next AI pass direction.");
  }

  function addFrameworkGuide(framework: SupportFramework) {
    const steps = Array.isArray(framework.structure) ? framework.structure.slice(0, 4).join(" | ") : "";
    const note = [`Framework: ${framework.name}`, framework.description, steps ? `Structure: ${steps}` : null]
      .filter(Boolean)
      .join("\n");

    appendPassDirection(note, "Framework guidance added to the next AI pass direction.");
  }

  const savePill = saving
    ? {
        label: "Saving to cloud",
        detail: "Sync in progress",
        tone: styles.statusInfo,
        icon: <Loader2 size={14} className={cx("spinner", styles.inlineSpinner)} />,
      }
    : persistenceMode === "checking"
      ? {
          label: "Checking session",
          detail: "Verifying Supabase access",
          tone: styles.statusInfo,
          icon: <Loader2 size={14} className={cx("spinner", styles.inlineSpinner)} />,
        }
      : persistenceMode === "local"
        ? {
            label: dirty ? "Local backup" : "Local-only",
            detail: backupTime ? `Browser backup ${backupTime}` : "Browser backup active",
            tone: styles.statusWarning,
            icon: <NotebookPen size={14} />,
          }
    : dirty
      ? {
          label: "Unsaved changes",
          detail: backupTime ? `Local backup ${backupTime}` : "Local backup active",
          tone: styles.statusWarning,
          icon: <AlertCircle size={14} />,
        }
      : saved || saveTime
        ? {
            label: "Saved",
            detail: saveTime ? `Cloud sync ${saveTime}` : "Cloud sync complete",
            tone: styles.statusSuccess,
            icon: <CheckCircle2 size={14} />,
          }
        : {
            label: "New draft",
            detail: backupTime ? `Local backup ${backupTime}` : "Ready to write",
            tone: styles.statusInfo,
            icon: <NotebookPen size={14} />,
          };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Co-Script workspace</p>
          <div className={styles.headerRow}>
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                markDirty();
              }}
              className={styles.titleInput}
              placeholder="Untitled Script"
            />
            <span className={styles.documentBadge}>{documentState.label}</span>
          </div>
          <p className={styles.headerNote}>{documentState.note}</p>
        </div>

        <div className={styles.headerTools}>
          <div className={cx(styles.statusPill, savePill.tone)}>
            {savePill.icon}
            <div>
              <strong>{savePill.label}</strong>
              <span>{savePill.detail}</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => void save()} disabled={saving || loadingDocument}>
            {saving ? <Loader2 size={14} className="spinner" /> : <RefreshCw size={14} />}
            Save
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => void copyToClipboard()}>
            <Copy size={14} />
            Copy
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => createDownload(title, content)} disabled={!content.trim()}>
            <Download size={14} />
            Download
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={cx(
            styles.notice,
            notice.tone === "danger" && styles.noticeDanger,
            notice.tone === "warning" && styles.noticeWarning,
          )}
        >
          <AlertCircle size={16} />
          <span>{notice.message}</span>
        </div>
      )}

      <div className={styles.metricsRow}>
        <span className={styles.metric}>
          <FileText size={14} />
          {blueprint.label}
        </span>
        <span className={styles.metric}>
          <Clock3 size={14} />
          {wordCount} words · {readingTime} min read
        </span>
        <span className={styles.metric}>
          <Layers3 size={14} />
          {outlineItems.length} sections
        </span>
        <span className={styles.metric}>
          <History size={14} />
          {versions.length} saved versions
        </span>
      </div>

      <div className={styles.layout}>
        <aside className={styles.leftRail}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <p className={styles.panelKicker}>Co-Script passes</p>
              <p className={styles.panelTitle}>Choose the next writing move</p>
              <p className={styles.panelCaption}>
                The AI surface is split into script tasks, so ideation, outlining, drafting, and rewriting feel like one workflow instead of one generic prompt box.
              </p>
            </div>

            <div className={styles.stageList}>
              {WORKFLOW_STAGES.map((stage) => {
                const active = stage.key === currentStage;
                const Icon = stage.icon;
                return (
                  <div key={stage.key} className={cx(styles.stageCard, active && styles.stageCardActive)}>
                    <div className={styles.stageIcon}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className={styles.stageLabel}>{stage.label}</div>
                      <p className={styles.stageDetail}>{stage.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.modeGrid}>
              {AI_MODE_OPTIONS.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.key}
                    type="button"
                    className={cx(styles.modeCard, activeAiMode === mode.key && styles.modeCardActive)}
                    onClick={() => {
                      setActiveAiMode(mode.key);
                      setActiveTab("generate");
                    }}
                  >
                    <div className={styles.modeCardTop}>
                      <Icon size={16} />
                      <span className={styles.modeMeta}>{getAiModeMeta(mode.key, hasBrief, hasDraft, hasSelection)}</span>
                    </div>
                    <strong>{mode.label}</strong>
                    <p>{mode.detail}</p>
                  </button>
                );
              })}
            </div>

            <div className={styles.passCard}>
              <div className={styles.passHeader}>
                <div>
                  <p className={styles.sectionLabel}>This pass reads</p>
                  <div className={styles.contextPills}>
                    {getAiInputs(activeAiMode, hasDraft, hasSelection).map((label) => (
                      <span key={label} className={styles.contextPill}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                <span className={styles.passState}>{activeAiConfig.label}</span>
              </div>

              {activeAiMode === "rewrite" ? (
                <>
                  <div className={styles.recipeRow}>
                    {REWRITE_RECIPES.map((recipe) => (
                      <button
                        key={recipe.key}
                        type="button"
                        className={cx(styles.recipeChip, rewriteRecipe === recipe.key && styles.recipeChipActive)}
                        onClick={() => setRewriteRecipe(recipe.key)}
                      >
                        {recipe.label}
                      </button>
                    ))}
                  </div>
                  <p className={styles.helperText}>{selectedRewriteRecipe.detail}</p>
                  <label className={styles.field}>
                    <span>Rewrite direction</span>
                    <textarea
                      rows={4}
                      className={styles.compactTextArea}
                      value={rewriteInstruction}
                      onChange={(event) => setRewriteInstruction(event.target.value)}
                      placeholder="Explain how the passage should change."
                    />
                  </label>
                  <p className={styles.helperText}>
                    {rewriteScope === "selection"
                      ? hasSelection
                        ? `Rewrite will target the selected ${selectionWordCount}-word passage and keep the rest of the draft as context.`
                        : "Select a passage to run the current rewrite recipe on a specific section."
                      : "No selection is required. Co-Script will rewrite the full draft."}
                  </p>
                  <div className={styles.actionColumn}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => void runRewritePass()}
                      disabled={Boolean(runningAiMode) || loadingDocument}
                    >
                      {runningAiMode === "rewrite" ? <Loader2 size={14} className="spinner" /> : <Sparkles size={14} />}
                      {rewriteScope === "selection" ? "Rewrite selection" : "Rewrite draft"}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => void scoreScript()} disabled={scoring}>
                      {scoring ? <Loader2 size={14} className="spinner" /> : <BarChart3 size={14} />}
                      Analyze draft
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label className={styles.field}>
                    <span>Direction for this pass</span>
                    <textarea
                      rows={4}
                      className={styles.compactTextArea}
                      value={aiDirection}
                      onChange={(event) => setAiDirection(event.target.value)}
                      placeholder="Optional: push for a contrarian angle, a 45-second cold open, a more technical tone, or a tighter platform fit."
                    />
                  </label>
                  <p className={styles.helperText}>
                    {activeAiMode === "angles"
                      ? "Angle explorer returns multiple paths so the brief hardens around a real choice."
                      : activeAiMode === "outline"
                        ? hasDraft
                          ? "Outline builder will organize the brief and your current notes into a clearer section map."
                          : "Outline builder will create a section map from the brief before you start drafting."
                        : hasDraft
                          ? "First draft pass will turn the brief and current notes into a cleaner scripted draft."
                          : "First draft pass will write a first working version from the brief and format settings."}
                  </p>
                  <div className={styles.actionColumn}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => void runGenerationMode(activeAiMode)}
                      disabled={Boolean(runningAiMode) || loadingDocument}
                    >
                      {runningAiMode === activeAiMode ? <Loader2 size={14} className="spinner" /> : <Sparkles size={14} />}
                      Run {activeAiConfig.label}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => void generateHooks()} disabled={scoring}>
                      <Lightbulb size={14} />
                      Hook variants
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <p className={styles.panelKicker}>Brief</p>
              <p className={styles.panelTitle}>Lock the angle before the prose</p>
              <div className={styles.briefMeter}>
                <strong>{[audience, objective, hook].filter((value) => value.trim()).length}/3</strong>
                <span>brief fields locked</span>
              </div>
            </div>

            <label className={styles.field}>
              <span>Audience</span>
              <input
                placeholder="Who needs this script?"
                value={audience}
                onChange={(event) => {
                  setAudience(event.target.value);
                  markDirty();
                }}
              />
            </label>
            <label className={styles.field}>
              <span>Objective</span>
              <input
                placeholder="What should the script make happen?"
                value={objective}
                onChange={(event) => {
                  setObjective(event.target.value);
                  markDirty();
                }}
              />
            </label>
            <label className={styles.field}>
              <span>Opening angle</span>
              <textarea
                placeholder="Write the hook, tension, or sharpest first line."
                value={hook}
                onChange={(event) => {
                  setHook(event.target.value);
                  markDirty();
                }}
                rows={4}
                className={styles.compactTextArea}
              />
            </label>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <p className={styles.panelKicker}>Format</p>
              <p className={styles.panelTitle}>{blueprint.guide}</p>
            </div>

            <div className={styles.selectGrid}>
              <label className={styles.field}>
                <span>Script type</span>
                <select
                  value={scriptType}
                  onChange={(event) => {
                    setScriptType(event.target.value);
                    markDirty();
                  }}
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Tone</span>
                <select
                  value={tone}
                  onChange={(event) => {
                    setTone(event.target.value);
                    markDirty();
                  }}
                >
                  {TONE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Platform</span>
                <select
                  value={platform}
                  onChange={(event) => {
                    setPlatform(event.target.value);
                    markDirty();
                  }}
                >
                  {PLATFORM_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.actionColumn}>
              <button className="btn btn-secondary btn-sm" onClick={applyStarterStructure}>
                <Wand2 size={14} />
                Insert starter structure
              </button>
              <button className="btn btn-ghost btn-sm" onClick={resetDraft}>
                Clear draft
              </button>
            </div>
          </section>
        </aside>

        <section className={styles.documentColumn}>
          <div className={styles.documentShell}>
            <div className={styles.documentToolbar}>
              <div>
                <p className={styles.panelKicker}>Writing sheet</p>
                <p className={styles.documentTitle}>{blueprint.label}</p>
              </div>
              <div className={styles.toolbarMeta}>
                {loadId && (
                  <span className={styles.metaPill}>
                    <History size={14} />
                    Loaded draft
                  </span>
                )}
                <span className={styles.metaPill}>
                  <Target size={14} />
                  {documentState.label}
                </span>
              </div>
            </div>

            <div className={styles.signalBand}>
              <div className={styles.signalLead}>
                <p className={styles.signalLabel}>Editor state</p>
                <p className={styles.signalText}>
                  {activeAiMode === "rewrite"
                    ? hasSelection
                      ? `Rewrite passes will target the selected ${selectionWordCount}-word passage while preserving the rest of the draft as context.`
                      : "No passage is selected, so rewrite passes will target the full draft."
                    : hasDraft
                      ? `Co-Script will read the current draft together with the brief for the next ${activeAiConfig.label.toLowerCase()} pass.`
                      : "Co-Script will build from the brief until a draft exists in the editor."}
                </p>
              </div>
              <div className={styles.contextPills}>
                <span className={styles.contextPill}>{activeAiConfig.label}</span>
                <span className={styles.contextPill}>{[audience, objective, hook].filter((value) => value.trim()).length}/3 brief locked</span>
                <span className={styles.contextPill}>{hasSelection ? `${selectionWordCount} words selected` : "No selection"}</span>
              </div>
            </div>

            <div className={styles.outlineStrip}>
              {outlineItems.map((item) => (
                <span key={item.id} className={styles.outlineChip}>
                  {item.label}
                </span>
              ))}
            </div>

            <div className={styles.documentPage}>
              <div className={styles.documentPageHeader}>
                <div>
                  <p className={styles.documentPageKicker}>Document</p>
                  <h2>{title || "Untitled Script"}</h2>
                </div>
                <div className={styles.documentStats}>
                  <span>{platform}</span>
                  <span>{tone}</span>
                  <span>{wordCount} words</span>
                </div>
              </div>

              {loadingDocument && (
                <div className={styles.documentLoading}>
                  <Loader2 size={16} className="spinner" />
                  Loading saved draft…
                </div>
              )}

              <textarea
                ref={editorRef}
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                  markDirty();
                }}
                onSelect={syncEditorSelection}
                onClick={syncEditorSelection}
                onKeyUp={syncEditorSelection}
                placeholder={`Start writing your ${blueprint.label.toLowerCase()} here.\n\nUse structure when you want a scaffold, or draft freely and refine once the argument is visible.`}
                className={styles.documentEditor}
              />

              <div className={styles.documentFooter}>
                <span>
                  {hasSelection
                    ? `${selectionWordCount} words selected for rewrite passes.`
                    : hook.trim()
                      ? `Hook ready: ${hook.trim()}`
                      : "No opening angle locked yet."}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={focusEditor}>
                  <NotebookPen size={14} />
                  Focus editor
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className={styles.rightRail}>
          <div className={styles.panel}>
            <div className={styles.tabRow}>
              {PANEL_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    className={cx(styles.tabButton, activeTab === tab.key && styles.tabButtonActive)}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "generate" && (
              <div className={styles.tabPanel}>
                <div className={styles.sectionBlock}>
                  <p className={styles.sectionLabel}>Current pass</p>
                  <p className={styles.panelTitle}>{activeAiConfig.label}</p>
                  <p className={styles.mutedText}>
                    {aiResult
                      ? aiResult.summary
                      : activeAiMode === "angles"
                        ? "Generate a small set of directions from the brief, then promote the best angle into the hook field."
                        : activeAiMode === "outline"
                          ? "Build a section map before drafting so the argument has a visible spine."
                          : activeAiMode === "draft"
                            ? "Write a first full pass that fits the selected script type and platform."
                            : "Rewrite the whole draft or just the selected passage with a clear editorial intent."}
                  </p>
                </div>

                {!aiResult && (
                  <div className={styles.cardStack}>
                    {AI_MODE_OPTIONS.map((mode) => {
                      const Icon = mode.icon;
                      return (
                        <div key={mode.key} className={styles.resultCard}>
                          <div className={styles.resultCardHeader}>
                            <strong>{mode.label}</strong>
                            <span className="badge badge-blue">{getAiModeMeta(mode.key, hasBrief, hasDraft, hasSelection)}</span>
                          </div>
                          <p className={styles.mutedText}>{mode.detail}</p>
                          <div className={styles.contextHeader}>
                            <Icon size={16} />
                            <p className={styles.mutedText}>{getAiInputs(mode.key, hasDraft, hasSelection).join(" · ")}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {aiResult?.kind === "angles" && (
                  <div className={styles.cardStack}>
                    {aiResult.angles.map((angle, index) => (
                      <div key={`${angle.label}-${index}`} className={styles.resultCard}>
                        <div className={styles.resultCardHeader}>
                          <strong>{angle.label}</strong>
                          <button className="btn btn-ghost btn-sm" onClick={() => applyAngleOption(angle)}>
                            Use angle
                          </button>
                        </div>
                        <p className={styles.copyBlock}>{angle.hook}</p>
                        <p className={styles.mutedText}>{angle.why_it_works}</p>
                        {angle.beats.length > 0 && (
                          <ul className={styles.beatList}>
                            {angle.beats.map((beat) => (
                              <li key={beat}>{beat}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {aiResult?.kind === "outline" && (
                  <>
                    <div className={styles.sectionBlock}>
                      <p className={styles.sectionLabel}>Outline preview</p>
                      <div className={styles.outlineList}>
                        {aiResult.outline.map((item, index) => (
                          <div key={`${item.label}-${index}`} className={styles.outlineRow}>
                            <span className={styles.outlineIndex}>•</span>
                            <div>
                              <strong>{item.label}</strong>
                              <p>{item.purpose}</p>
                              {item.beats.length > 0 && (
                                <ul className={styles.beatList}>
                                  {item.beats.map((beat) => (
                                    <li key={beat}>{beat}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={styles.actionColumn}>
                      <button className="btn btn-primary btn-sm" onClick={() => applyOutlineResult("replace")}>
                        <PenLine size={14} />
                        Replace draft
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => applyOutlineResult("insert")}>
                        <NotebookPen size={14} />
                        Insert at cursor
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => applyOutlineResult("append")}>
                        <Layers3 size={14} />
                        Append below draft
                      </button>
                    </div>
                  </>
                )}

                {aiResult?.kind === "draft" && (
                  <>
                    <div className={styles.sectionBlock}>
                      <p className={styles.sectionLabel}>Draft preview</p>
                      <div className={cx(styles.resultPreview, styles.resultPreviewTall)}>
                        <p className={styles.copyBlock}>{aiResult.content}</p>
                      </div>
                    </div>
                    <div className={styles.actionColumn}>
                      <button className="btn btn-primary btn-sm" onClick={() => applyDraftResult("replace")}>
                        <PenLine size={14} />
                        Replace draft
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => applyDraftResult("append")}>
                        <Layers3 size={14} />
                        Append below draft
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => void copyTextToClipboard(aiResult.content, "AI draft copied to your clipboard.")}
                      >
                        <Copy size={14} />
                        Copy draft
                      </button>
                    </div>
                  </>
                )}

                {aiResult?.kind === "rewrite" && (
                  <>
                    <div className={styles.sectionBlock}>
                      <p className={styles.sectionLabel}>Rewrite preview</p>
                      <p className={styles.mutedText}>{aiResult.instruction}</p>
                      <div className={cx(styles.resultPreview, styles.resultPreviewCompact)}>
                        <p className={styles.copyBlock}>{aiResult.content}</p>
                      </div>
                    </div>
                    <div className={styles.actionColumn}>
                      <button className="btn btn-primary btn-sm" onClick={applyRewriteResult}>
                        <Wand2 size={14} />
                        {aiResult.scope === "selection" ? "Replace selection" : "Replace draft"}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => void copyTextToClipboard(aiResult.content, "Rewrite draft copied to your clipboard.")}
                      >
                        <Copy size={14} />
                        Copy rewrite
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "refine" && (
              <div className={styles.tabPanel}>
                <div className={styles.scoreCard}>
                  <div className={cx(
                    styles.scoreDial,
                    score >= 80 && styles.scoreHigh,
                    score >= 50 && score < 80 && styles.scoreMid,
                    score > 0 && score < 50 && styles.scoreLow,
                  )}>
                    {score || "—"}
                  </div>
                  <div>
                    <p className={styles.panelTitle}>Draft quality</p>
                    <p className={styles.mutedText}>
                      {score >= 80
                        ? "Strong enough for a final editorial pass."
                        : score >= 50
                          ? "Promising, but still uneven in parts."
                          : score > 0
                            ? "The draft needs more shaping before handoff."
                            : "Run analysis once the draft is on the page."}
                    </p>
                  </div>
                </div>

                <div className={styles.breakdownList}>
                  {Object.entries(breakdown).map(([key, value]) => (
                    <div key={key} className={styles.breakdownRow}>
                      <div className={styles.breakdownLabel}>
                        <span>{key.replace(/_/g, " ")}</span>
                        <strong>{value}/100</strong>
                      </div>
                      <div className={styles.breakdownTrack}>
                        <div
                          className={styles.breakdownBar}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.sectionBlock}>
                  <p className={styles.sectionLabel}>AI read</p>
                  {reasoning ? (
                    <p className={styles.copyBlock}>{reasoning}</p>
                  ) : (
                    <p className={styles.mutedText}>Score the draft to get structural feedback and rewrite direction.</p>
                  )}
                </div>

                <div className={styles.sectionBlock}>
                  <p className={styles.sectionLabel}>Hook lab</p>
                  {hookVariants.length > 0 ? (
                    <div className={styles.cardStack}>
                      {hookVariants.map((variant, index) => (
                        <div key={`${variant.type}-${index}`} className={styles.resultCard}>
                          <div className={styles.resultCardHeader}>
                            <span className="badge badge-blue">{variant.type}</span>
                            <button className="btn btn-ghost btn-sm" onClick={() => applyHookVariant(variant.text)}>
                              Use
                            </button>
                          </div>
                          <p className={styles.copyBlock}>{variant.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.mutedText}>Generate hook variants after a draft is in place.</p>
                  )}
                </div>

                <div className={styles.sectionBlock}>
                  <p className={styles.sectionLabel}>Framework fit</p>
                  {frameworkMatch.length > 0 ? (
                    <div className={styles.cardStack}>
                      {frameworkMatch.map((framework) => (
                        <div key={framework.name} className={styles.resultCard}>
                          <div className={styles.resultCardHeader}>
                            <strong>{framework.name}</strong>
                            <span className="badge badge-lime">{framework.fit}% fit</span>
                          </div>
                          <p className={styles.mutedText}>{framework.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.mutedText}>Run analysis to see which frameworks match this draft best.</p>
                  )}
                </div>

                <div className={styles.sectionBlock}>
                  <p className={styles.sectionLabel}>Audience lens</p>
                  {audienceAnalysis ? (
                    <p className={styles.copyBlock}>{audienceAnalysis}</p>
                  ) : (
                    <p className={styles.mutedText}>Audience resonance will appear here after scoring.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "outline" && (
              <div className={styles.tabPanel}>
                <div className={styles.sectionBlock}>
                  <p className={styles.sectionLabel}>Document structure</p>
                  <p className={styles.mutedText}>{blueprint.guide}</p>
                </div>

                <div className={styles.outlineList}>
                  {outlineItems.map((item) => (
                    <div key={item.id} className={styles.outlineRow}>
                      <span className={styles.outlineIndex}>•</span>
                      <div>
                        <strong>{item.label}</strong>
                        <p>{item.hint}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.sectionBlock}>
                  <p className={styles.sectionLabel}>Structure actions</p>
                  <div className={styles.actionColumn}>
                    <button className="btn btn-secondary btn-sm" onClick={applyStarterStructure}>
                      <Wand2 size={14} />
                      Insert starter outline
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={focusEditor}>
                      <NotebookPen size={14} />
                      Continue writing
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "versions" && (
              <div className={styles.tabPanel}>
                <div className={styles.sectionBlock}>
                  <p className={styles.sectionLabel}>Saved history</p>
                  <p className={styles.mutedText}>
                    Each cloud save preserves the previous body as a version when the document text changes.
                  </p>
                </div>

                {loadingVersions ? (
                  <div className={styles.loadingRow}>
                    <Loader2 size={16} className="spinner" />
                    Loading versions…
                  </div>
                ) : versions.length > 0 ? (
                  <div className={styles.cardStack}>
                    {versions.map((version) => (
                      <div key={version.id} className={styles.resultCard}>
                        <div className={styles.resultCardHeader}>
                          <strong>Version {version.version_number}</strong>
                          <span className="badge badge-orange">{version.score || 0} score</span>
                        </div>
                        <p className={styles.mutedText}>{new Date(version.created_at).toLocaleString()}</p>
                        <button className="btn btn-ghost btn-sm" onClick={() => restoreVersion(version)}>
                          Restore to editor
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.mutedText}>
                    {scriptId
                      ? "No saved versions yet. Save after a meaningful draft change to start the history trail."
                      : "Version history begins after the first authenticated cloud save."}
                  </p>
                )}
              </div>
            )}

            {activeTab === "context" && (
              <div className={styles.tabPanel}>
                <div className={styles.sectionBlock}>
                  <p className={styles.sectionLabel}>Support material</p>
                  <p className={styles.mutedText}>
                    Research, references, and frameworks live here to strengthen the next pass without turning the
                    editor into a separate research product. The goal is stronger hooks, cleaner proof, and sharper
                    turns.
                  </p>
                </div>

                {persistenceMode !== "cloud" ? (
                  <div className={styles.sectionBlock}>
                    <p className={styles.sectionLabel}>Sign in for context</p>
                    <p className={styles.mutedText}>
                      Local drafting still works, but research inputs, saved references, and framework history load from
                      the authenticated workspace.
                    </p>
                  </div>
                ) : loadingContext ? (
                  <div className={styles.loadingRow}>
                    <Loader2 size={16} className="spinner" />
                    Loading support material…
                  </div>
                ) : (
                  <>
                    {contextError && (
                      <div className={styles.sectionBlock}>
                        <p className={styles.mutedText}>{contextError}</p>
                      </div>
                    )}

                    <div className={styles.sectionBlock}>
                      <div className={styles.contextHeader}>
                        <p className={styles.sectionLabel}>Research signals</p>
                        <a href="/research" className="btn btn-ghost btn-sm">
                          Open research
                        </a>
                      </div>
                      {researchItems.length > 0 ? (
                        <div className={styles.cardStack}>
                          {researchItems.map((item) => (
                            <div key={item.id} className={styles.resultCard}>
                              <div className={styles.resultCardHeader}>
                                <strong>{item.title}</strong>
                                <span className="badge badge-lime">{item.outlier_score}x</span>
                              </div>
                              <p className={styles.mutedText}>
                                {item.platform} signal{item.view_count > 0 ? ` · ${item.view_count.toLocaleString()} views` : ""}
                              </p>
                              <div className={styles.actionRow}>
                                <button className="btn btn-secondary btn-sm" onClick={() => addResearchSignal(item)}>
                                  Add to pass
                                </button>
                                {item.url && (
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                                    <ExternalLink size={12} />
                                    Source
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.mutedText}>No research items are available yet. Watchlists still need more upstream sync.</p>
                      )}
                    </div>

                    <div className={styles.sectionBlock}>
                      <div className={styles.contextHeader}>
                        <p className={styles.sectionLabel}>Vault references</p>
                        <a href="/vault" className="btn btn-ghost btn-sm">
                          Open vault
                        </a>
                      </div>
                      {vaultItems.length > 0 ? (
                        <div className={styles.cardStack}>
                          {vaultItems.map((item) => (
                            <div key={item.id} className={styles.resultCard}>
                              <div className={styles.resultCardHeader}>
                                <strong>{item.title}</strong>
                                {item.tags[0] ? <span className="badge badge-blue">{item.tags[0]}</span> : null}
                              </div>
                              <p className={styles.copyBlock}>
                                {(item.content || item.notes || "Saved reference.").slice(0, 180)}
                                {(item.content || item.notes || "").length > 180 ? "..." : ""}
                              </p>
                              <div className={styles.actionRow}>
                                <button className="btn btn-secondary btn-sm" onClick={() => addVaultReference(item)}>
                                  Add to pass
                                </button>
                                {item.source_url && (
                                  <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                                    <ExternalLink size={12} />
                                    Source
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.mutedText}>No vault references yet. Save useful snippets to reuse them inside the editor.</p>
                      )}
                    </div>

                    <div className={styles.sectionBlock}>
                      <div className={styles.contextHeader}>
                        <p className={styles.sectionLabel}>Framework cues</p>
                        <a href="/frameworks" className="btn btn-ghost btn-sm">
                          Open frameworks
                        </a>
                      </div>
                      {supportFrameworks.length > 0 ? (
                        <div className={styles.cardStack}>
                          {supportFrameworks.map((framework) => (
                            <div key={framework.id} className={styles.resultCard}>
                              <div className={styles.resultCardHeader}>
                                <strong>{framework.name}</strong>
                                <span className="badge badge-blue">{framework.category}</span>
                              </div>
                              <p className={styles.mutedText}>{framework.description}</p>
                              {Array.isArray(framework.structure) && framework.structure.length > 0 && (
                                <ul className={styles.beatList}>
                                  {framework.structure.slice(0, 3).map((step) => (
                                    <li key={step}>{step}</li>
                                  ))}
                                </ul>
                              )}
                              <div className={styles.actionRow}>
                                <button className="btn btn-secondary btn-sm" onClick={() => addFrameworkGuide(framework)}>
                                  Add to pass
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.mutedText}>Frameworks will appear here once the library is populated for this workspace.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </aside>
      </div>
    </div>
  );
}
