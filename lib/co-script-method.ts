export type BuiltInFramework = {
  id: string;
  name: string;
  category: string;
  description: string;
  structure: string[];
  example: string;
  source: string;
  is_system: boolean;
};

const KALLAWAY_SIGNALS = [
  "Lead with a native-feeling hook archetype instead of a generic opener.",
  "Establish context quickly, then inject conflict before the viewer settles.",
  "Rehook every major beat so retention keeps renewing instead of decaying.",
  "Favor concrete proof, pattern interrupts, and conversational rhythm over essay language.",
  "Pick one story lens per script so the piece feels intentional, not stitched together.",
];

const INDUSTRY_BACKGROUND = [
  "Content Co-op serves industrial, energy, operations, and B2B brand storytelling where trust matters more than hype.",
  "Executives, operators, and buyers need proof, clarity, and consequences, not creator fluff.",
  "The strongest angles usually connect field reality, business stakes, and one clear strategic takeaway.",
  "Scripts should sound credible on camera and survive internal review from leadership, marketing, and operations teams.",
];

const HOOK_ARCHETYPES = [
  "Contrarian truth",
  "Hidden cost",
  "What changed",
  "Operator confession",
  "Myth vs reality",
  "Before / after proof",
  "High-stakes question",
  "Pattern interrupt stat",
];

export const CO_SCRIPT_METHOD_NAME = "Signal -> Tension -> Proof -> Turn -> Payoff";

export function getPlatformGuide(platform: string) {
  const guides: Record<string, string> = {
    youtube: "Write for YouTube with a fast opening, visible rehooks, and enough payoff to justify the click.",
    tiktok: "Write for TikTok with immediate tension, conversational cadence, and short visual beats that keep moving.",
    instagram: "Write for Instagram Reels with compact lines, repeatable phrasing, and image-friendly scene changes.",
    linkedin: "Write for LinkedIn with business clarity, earned authority, and a useful takeaway that sounds credible aloud.",
    twitter: "Write for Twitter/X with sharp phrasing, dense value, and a first line that can stand on its own.",
    email: "Write for email with one central promise, escalating proof, and a CTA that feels obvious by the end.",
  };

  return guides[platform] || guides.youtube;
}

export function getTypeGuide(scriptType: string) {
  const guides: Record<string, string> = {
    video_script: "Format like production-ready spoken script copy with visible beat changes where helpful.",
    social_media: "Format like creator-ready short-form copy, not like notes or assistant prose.",
    blog: "Format like a clean argument with section turns, but keep the voice spoken and specific.",
    ad_copy: "Format like concise persuasive copy with a single promise, proof, and action.",
    email: "Format like a ready-to-send email with subject, body progression, and one ask.",
  };

  return guides[scriptType] || guides.video_script;
}

export function buildMethodContext() {
  return [
    `Core method: ${CO_SCRIPT_METHOD_NAME}.`,
    "Method signals:",
    ...KALLAWAY_SIGNALS.map((item) => `- ${item}`),
    "Industry grounding:",
    ...INDUSTRY_BACKGROUND.map((item) => `- ${item}`),
    "Preferred hook archetypes:",
    ...HOOK_ARCHETYPES.map((item) => `- ${item}`),
  ].join("\n");
}

export function buildGenerateSystemPrompt() {
  return `You are Co-Script, Content Co-op's research-shaped script engine.

You are inspired by proven creator storytelling systems, but you do not imitate any single creator verbatim.
Use this operating method:
${buildMethodContext()}

Rules:
- Think like a senior strategist for short-form and executive-facing brand video.
- Optimize for retention, clarity, credibility, and spoken delivery.
- Make the draft feel platform-native and camera-ready.
- Prefer specifics, stakes, and proof over adjectives.
- Return strict JSON only.`;
}

export function buildRewriteSystemPrompt() {
  return `You are Co-Script's rewrite engine.

Rewrite inside the same operating method:
${buildMethodContext()}

Rules:
- Preserve the author's core idea and point of view.
- Increase tension, clarity, proof, and rhythm without sounding synthetic.
- Keep the result ready to paste back into a working script.
- Return strict JSON only.`;
}

export function buildScoreSystemPrompt() {
  return `You are Co-Script's script analyst.

Evaluate scripts against this method:
${buildMethodContext()}

Scoring priorities:
- Hook strength: does the opener create immediate tension and relevance?
- Clarity: is every line easy to follow aloud?
- Structure: does the script escalate, rehook, and land a satisfying turn?
- Emotional pull: are there stakes, surprise, or human consequences?
- CTA power: does the ending convert the insight into a clear next move?

Return strict JSON only.`;
}

export function getBuiltInFrameworks(): BuiltInFramework[] {
  return [
    {
      id: "system-kallaway-signal-ledger",
      name: "Signal Ledger",
      category: "hooks",
      description: "Turn research into a hook by isolating one tension, one surprising fact, and one business consequence.",
      structure: [
        "Name the audience that should care.",
        "State the tension or costly misconception.",
        "Reveal the overlooked fact or shift.",
        "Point toward the payoff if they keep watching.",
      ],
      example: "Most plant tour videos look polished but say nothing. The ones that convert show the one process detail buyers actually use to judge risk.",
      source: "co-script",
      is_system: true,
    },
    {
      id: "system-context-conflict-turn",
      name: "Context / Conflict / Turn",
      category: "structure",
      description: "A short-form story spine for scripts that need immediate clarity and momentum.",
      structure: [
        "Context: establish the world in one or two lines.",
        "Conflict: show what is broken, changing, or expensive.",
        "Proof: ground the claim with evidence, example, or scene detail.",
        "Turn: reveal the insight, reframe, or operating principle.",
        "Payoff: end with consequence, action, or strategic takeaway.",
      ],
      example: "Everyone says plant content is boring. It is only boring when you hide the stakes. Show what failure costs, then show the operator move that prevents it.",
      source: "co-script",
      is_system: true,
    },
    {
      id: "system-operator-proof-stack",
      name: "Operator Proof Stack",
      category: "structure",
      description: "Use for industrial and B2B scripts that need to earn trust through proof instead of polish.",
      structure: [
        "Lead with the claim or misconception.",
        "Add one operational detail that proves credibility.",
        "Layer a metric, observed result, or concrete consequence.",
        "Translate the proof into a buyer or leadership takeaway.",
      ],
      example: "The strongest recruitment films do not say 'great culture.' They show the process, the standard, and what kind of person succeeds inside it.",
      source: "co-script",
      is_system: true,
    },
    {
      id: "system-rehook-ladder",
      name: "Rehook Ladder",
      category: "hooks",
      description: "Renew attention throughout the piece by escalating the question every few beats.",
      structure: [
        "Open with the first tension.",
        "After each proof beat, introduce a deeper implication.",
        "Use contrast language to reset attention.",
        "Reserve the cleanest payoff for the final third.",
      ],
      example: "That is only the visible problem. The real issue is what it signals to your buyers before a salesperson ever shows up.",
      source: "co-script",
      is_system: true,
    },
  ];
}
