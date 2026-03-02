import { create } from "zustand";
import type { ScoreBreakdown, HookVariant, FrameworkMatch, EditorTab } from "@/lib/types/coscript";

interface EditorState {
  // Script data
  scriptId: string | null;
  title: string;
  scriptType: string;
  content: string;
  hook: string;
  audience: string;
  objective: string;
  tone: string;
  platform: string;
  status: string;
  clientId: string | null;
  projectId: string | null;
  briefId: string | null;
  templateId: string | null;
  wordCount: number;

  // Client/project display names (for export)
  clientName: string;
  projectName: string;

  // AI panel
  activeTab: EditorTab;
  score: number;
  breakdown: ScoreBreakdown;
  reasoning: string;
  hookVariants: HookVariant[];
  frameworkMatch: FrameworkMatch[];
  audienceAnalysis: string;

  // Rewrite state
  rewriteInstruction: string;
  rewriteTone: string;
  rewriteResult: string;

  // UI state
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  scoring: boolean;
  generating: boolean;
  rewriting: boolean;
  analyzing: boolean;
  showExport: boolean;
  showTeleprompter: boolean;

  // Actions
  setField: (field: string, value: unknown) => void;
  markDirty: () => void;
  markSaved: () => void;
  setSaving: (v: boolean) => void;
  setActiveTab: (tab: EditorTab) => void;
  setScoreData: (data: {
    score: number;
    breakdown: ScoreBreakdown;
    reasoning: string;
    hooks: HookVariant[];
    frameworks: FrameworkMatch[];
    audience_analysis: string;
  }) => void;
  setHookVariants: (hooks: HookVariant[]) => void;
  loadScript: (script: Record<string, unknown>) => void;
  reset: () => void;
}

const INITIAL_BREAKDOWN: ScoreBreakdown = {
  hook_strength: 0,
  clarity: 0,
  structure: 0,
  emotional_pull: 0,
  cta_power: 0,
};

export const useEditorStore = create<EditorState>((set) => ({
  scriptId: null,
  title: "Untitled Script",
  scriptType: "video_script",
  content: "",
  hook: "",
  audience: "",
  objective: "",
  tone: "conversational",
  platform: "youtube",
  status: "draft",
  clientId: null,
  projectId: null,
  briefId: null,
  templateId: null,
  wordCount: 0,

  clientName: "",
  projectName: "",

  activeTab: "score",
  score: 0,
  breakdown: { ...INITIAL_BREAKDOWN },
  reasoning: "",
  hookVariants: [],
  frameworkMatch: [],
  audienceAnalysis: "",

  rewriteInstruction: "",
  rewriteTone: "",
  rewriteResult: "",

  dirty: false,
  saving: false,
  saved: false,
  scoring: false,
  generating: false,
  rewriting: false,
  analyzing: false,
  showExport: false,
  showTeleprompter: false,

  setField: (field, value) =>
    set((s) => ({ ...s, [field]: value, dirty: true, saved: false })),

  markDirty: () => set({ dirty: true, saved: false }),

  markSaved: () => set({ dirty: false, saved: true, saving: false }),

  setSaving: (v) => set({ saving: v }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setScoreData: (data) =>
    set({
      score: data.score ?? 0,
      breakdown: data.breakdown ?? INITIAL_BREAKDOWN,
      reasoning: data.reasoning ?? "",
      hookVariants: data.hooks ?? [],
      frameworkMatch: data.frameworks ?? [],
      audienceAnalysis: data.audience_analysis ?? "",
    }),

  setHookVariants: (hooks) => set({ hookVariants: hooks }),

  loadScript: (script) =>
    set({
      scriptId: (script.id as string) ?? null,
      title: (script.title as string) ?? "Untitled Script",
      scriptType: (script.script_type as string) ?? "video_script",
      content: (script.content as string) ?? "",
      hook: (script.hook as string) ?? "",
      audience: (script.audience as string) ?? "",
      objective: (script.objective as string) ?? "",
      tone: (script.tone as string) ?? "conversational",
      platform: (script.platform as string) ?? "youtube",
      status: (script.status as string) ?? "draft",
      clientId: (script.client_id as string) ?? null,
      projectId: (script.project_id as string) ?? null,
      briefId: (script.brief_id as string) ?? null,
      templateId: (script.template_id as string) ?? null,
      wordCount: (script.word_count as number) ?? 0,
      score: (script.score as number) ?? 0,
      breakdown: (script.score_breakdown as ScoreBreakdown) ?? INITIAL_BREAKDOWN,
      reasoning: ((script.ai_feedback as Record<string, string>)?.reasoning as string) ?? "",
      audienceAnalysis: ((script.ai_feedback as Record<string, string>)?.audience_analysis as string) ?? "",
      dirty: false,
      saved: false,
    }),

  reset: () =>
    set({
      scriptId: null,
      title: "Untitled Script",
      scriptType: "video_script",
      content: "",
      hook: "",
      audience: "",
      objective: "",
      tone: "conversational",
      platform: "youtube",
      status: "draft",
      clientId: null,
      projectId: null,
      briefId: null,
      templateId: null,
      wordCount: 0,
      clientName: "",
      projectName: "",
      activeTab: "score",
      score: 0,
      breakdown: { ...INITIAL_BREAKDOWN },
      reasoning: "",
      hookVariants: [],
      frameworkMatch: [],
      audienceAnalysis: "",
      rewriteInstruction: "",
      rewriteTone: "",
      rewriteResult: "",
      dirty: false,
      saving: false,
      saved: false,
      scoring: false,
      generating: false,
      rewriting: false,
      analyzing: false,
      showExport: false,
      showTeleprompter: false,
    }),
}));
