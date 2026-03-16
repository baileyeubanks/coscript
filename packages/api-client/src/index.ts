import type {
  AuthSessionResponse,
  FrameworkRecord,
  ResearchItemRecord,
  ScriptBrief,
  ScriptRecord,
  ScriptVersionRecord,
  SignupResponse,
  VaultItemRecord,
  WatchlistRecord,
} from "@contentco-op/types";

type RequestOptions = RequestInit & {
  headers?: HeadersInit;
};

async function request<T>(baseUrl: string, path: string, init?: RequestOptions): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }

  return (await response.json()) as T;
}

export const api = {
  auth: {
    session: (baseUrl: string) => request<AuthSessionResponse>(baseUrl, "/api/auth/session"),
    login: (baseUrl: string, payload: { email: string; password: string }) =>
      request<{ success: boolean }>(baseUrl, "/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    signup: (baseUrl: string, payload: { email: string; password: string; display_name?: string }) =>
      request<SignupResponse>(baseUrl, "/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    logout: (baseUrl: string) =>
      request<{ success: boolean }>(baseUrl, "/api/auth/logout", { method: "POST" }),
  },
  scripts: {
    list: (baseUrl: string) => request<{ scripts: ScriptRecord[] }>(baseUrl, "/api/scripts"),
    create: (
      baseUrl: string,
      payload: Omit<ScriptRecord, "id" | "updated_at">,
    ) =>
      request<{ script: ScriptRecord }>(baseUrl, "/api/scripts", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    get: (baseUrl: string, id: string) =>
      request<{ script: ScriptRecord }>(baseUrl, `/api/scripts/${id}`),
    update: (baseUrl: string, id: string, payload: Partial<Omit<ScriptRecord, "id" | "updated_at">>) =>
      request<{ script: ScriptRecord }>(baseUrl, `/api/scripts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (baseUrl: string, id: string) =>
      request<{ success: boolean }>(baseUrl, `/api/scripts/${id}`, { method: "DELETE" }),
    versions: (baseUrl: string, id: string) =>
      request<{ versions: ScriptVersionRecord[] }>(baseUrl, `/api/scripts/${id}/versions`),
    share: (baseUrl: string, id: string) =>
      request<{ token: string }>(baseUrl, `/api/scripts/${id}/share`, { method: "POST" }),
  },
  ai: {
    generate: (
      baseUrl: string,
      payload: ScriptBrief & { mode: "angles" | "outline" | "draft"; current_content?: string; direction?: string },
    ) =>
      request<Record<string, unknown>>(baseUrl, "/api/ai/generate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    rewrite: (
      baseUrl: string,
      payload: {
        title: string;
        content: string;
        instruction: string;
        scope: "selection" | "document";
        audience?: string;
        objective?: string;
        hook?: string;
        tone?: string;
        platform?: string;
        script_type?: string;
      },
    ) =>
      request<Record<string, unknown>>(baseUrl, "/api/ai/rewrite", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    score: (baseUrl: string, payload: ScriptBrief & { content: string }) =>
      request<Record<string, unknown>>(baseUrl, "/api/ai/score", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    hooks: (baseUrl: string, payload: ScriptBrief & { content: string }) =>
      request<Record<string, unknown>>(baseUrl, "/api/ai/hooks", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  research: {
    list: (baseUrl: string, params = "") =>
      request<{ items: ResearchItemRecord[] }>(baseUrl, `/api/research${params}`),
    analyzeUrl: (baseUrl: string, payload: { url: string; objective?: string; audience?: string }) =>
      request<Record<string, unknown>>(baseUrl, "/api/ai/analyze-url", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  watchlists: {
    list: (baseUrl: string) => request<{ watchlists: WatchlistRecord[] }>(baseUrl, "/api/watchlists"),
    create: (baseUrl: string, payload: { name: string; platform: string; channel_url?: string }) =>
      request<{ watchlist: WatchlistRecord }>(baseUrl, "/api/watchlists", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    remove: (baseUrl: string, id: string) =>
      request<{ success: boolean }>(baseUrl, `/api/watchlists/${id}`, { method: "DELETE" }),
  },
  vault: {
    list: (baseUrl: string) => request<{ items: VaultItemRecord[] }>(baseUrl, "/api/vault"),
    create: (
      baseUrl: string,
      payload: {
        title: string;
        content?: string;
        source_url?: string;
        source_type?: string;
        tags?: string[];
        notes?: string;
      },
    ) =>
      request<{ item: VaultItemRecord }>(baseUrl, "/api/vault", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    remove: (baseUrl: string, id: string) =>
      request<{ success: boolean }>(baseUrl, `/api/vault/${id}`, { method: "DELETE" }),
  },
  frameworks: {
    list: (baseUrl: string) => request<{ frameworks: FrameworkRecord[] }>(baseUrl, "/api/frameworks"),
  },
};
