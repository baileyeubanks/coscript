"use client";

import { Suspense, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, BarChart3, Lightbulb, Loader2 } from "lucide-react";
import { useEditorStore } from "@/lib/stores/editorStore";
import EditorToolbar from "@/components/editor/EditorToolbar";
import EditorSidebar from "@/components/editor/EditorSidebar";
import ScriptMetaBar from "@/components/editor/ScriptMetaBar";
import ExportModal from "@/components/export/ExportModal";
import TeleprompterView from "@/components/export/TeleprompterView";

export default function EditorPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}><div className="skeleton" style={{ height: "100vh" }} /></div>}>
      <EditorInner />
    </Suspense>
  );
}

function EditorInner() {
  const searchParams = useSearchParams();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const store = useEditorStore();

  // Compute word count
  useEffect(() => {
    const words = store.content.trim().split(/\s+/).filter(Boolean).length;
    if (words !== store.wordCount) {
      useEditorStore.setState({ wordCount: words });
    }
  }, [store.content, store.wordCount]);

  // Load existing script via ?load=ID
  useEffect(() => {
    const loadId = searchParams.get("load");
    if (!loadId) return;
    useEditorStore.setState({ saving: true }); // reuse as loading indicator
    fetch(`/api/scripts/${loadId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.script) store.loadScript(data.script);
      })
      .catch((err) => console.error("Failed to load script:", err))
      .finally(() => useEditorStore.setState({ saving: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load script type from URL param
  useEffect(() => {
    const type = searchParams.get("type");
    if (type && !searchParams.get("load")) {
      useEditorStore.setState({ scriptType: type });
    }
  }, [searchParams]);

  const save = useCallback(async () => {
    const s = useEditorStore.getState();
    useEditorStore.setState({ saving: true, saved: false });
    const body = {
      title: s.title,
      script_type: s.scriptType,
      content: s.content,
      hook: s.hook,
      audience: s.audience,
      objective: s.objective,
      tone: s.tone,
      platform: s.platform,
      status: s.status,
      word_count: s.wordCount,
      client_id: s.clientId,
      project_id: s.projectId,
      brief_id: s.briefId,
      template_id: s.templateId,
    };
    const url = s.scriptId ? `/api/scripts/${s.scriptId}` : "/api/scripts";
    const method = s.scriptId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      const data = await res.json();
      if (!s.scriptId && data.script?.id) {
        useEditorStore.setState({ scriptId: data.script.id });
      }
      useEditorStore.setState({ dirty: false, saved: true, saving: false });
      setTimeout(() => useEditorStore.setState({ saved: false }), 2000);
    } else {
      useEditorStore.setState({ saving: false });
    }
  }, []);

  // Cmd+S shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [save]);

  // Auto-save every 30s when dirty
  useEffect(() => {
    if (store.dirty) {
      autoSaveTimer.current = setTimeout(() => save(), 30000);
    }
    return () => clearTimeout(autoSaveTimer.current);
  }, [store.dirty, save]);

  async function scoreScript() {
    const s = useEditorStore.getState();
    if (!s.content.trim()) return;
    useEditorStore.setState({ scoring: true, activeTab: "score" });
    const res = await fetch("/api/ai/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: s.content,
        hook: s.hook,
        audience: s.audience,
        objective: s.objective,
        script_type: s.scriptType,
        script_id: s.scriptId,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      store.setScoreData(data);
    }
    useEditorStore.setState({ scoring: false });
  }

  async function generateScript() {
    const s = useEditorStore.getState();
    useEditorStore.setState({ generating: true });
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hook: s.hook,
        audience: s.audience,
        objective: s.objective,
        tone: s.tone,
        platform: s.platform,
        script_type: s.scriptType,
        client_id: s.clientId,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.content) {
        useEditorStore.setState({ content: data.content, dirty: true, saved: false });
      }
    }
    useEditorStore.setState({ generating: false });
  }

  async function generateHooks() {
    const s = useEditorStore.getState();
    useEditorStore.setState({ activeTab: "hooks", scoring: true });
    const res = await fetch("/api/ai/hooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: s.content,
        audience: s.audience,
        objective: s.objective,
        script_type: s.scriptType,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      store.setHookVariants(data.hooks ?? []);
    }
    useEditorStore.setState({ scoring: false });
  }

  async function rewriteScript() {
    const s = useEditorStore.getState();
    if (!s.content.trim()) return;
    useEditorStore.setState({ rewriting: true, rewriteResult: "" });
    const res = await fetch("/api/ai/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: s.content,
        instruction: s.rewriteInstruction,
        tone: s.rewriteTone || s.tone,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      useEditorStore.setState({ rewriteResult: data.content || "" });
    }
    useEditorStore.setState({ rewriting: false });
  }

  function applyRewrite() {
    const s = useEditorStore.getState();
    if (s.rewriteResult) {
      useEditorStore.setState({ content: s.rewriteResult, rewriteResult: "", dirty: true, saved: false });
    }
  }

  function handleFieldChange(field: string, value: string | null) {
    store.setField(field, value);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(store.content);
  }

  return (
    <>
      <div style={{ display: "flex", height: "100vh" }}>
        {/* LEFT: Editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid var(--line)" }}>
          <EditorToolbar
            title={store.title}
            scriptType={store.scriptType}
            status={store.status}
            dirty={store.dirty}
            saving={store.saving}
            saved={store.saved}
            onTitleChange={(v) => store.setField("title", v)}
            onTypeChange={(v) => store.setField("scriptType", v)}
            onStatusChange={(v) => store.setField("status", v)}
            onSave={save}
            onCopy={copyToClipboard}
            onExport={() => useEditorStore.setState({ showExport: true })}
          />

          <ScriptMetaBar
            audience={store.audience}
            objective={store.objective}
            tone={store.tone}
            platform={store.platform}
            hook={store.hook}
            clientId={store.clientId}
            projectId={store.projectId}
            onFieldChange={handleFieldChange}
          />

          {/* Main Editor Area */}
          <div style={{ flex: 1, position: "relative" }}>
            <textarea
              ref={editorRef}
              value={store.content}
              onChange={(e) => store.setField("content", e.target.value)}
              placeholder={"Start writing your script...\n\nTip: Write naturally, then use the AI panel to score and improve."}
              style={{
                width: "100%",
                height: "100%",
                background: "var(--bg)",
                border: "none",
                resize: "none",
                padding: "1.5rem",
                fontSize: "0.95rem",
                lineHeight: 1.8,
                color: "var(--ink)",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.5rem 1.25rem",
              borderTop: "1px solid var(--line)",
              background: "var(--surface)",
              fontSize: "0.75rem",
              color: "var(--muted)",
            }}
          >
            <span>{store.wordCount} words</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-primary btn-sm" onClick={generateScript} disabled={store.generating}>
                {store.generating ? <Loader2 size={14} /> : <Sparkles size={14} />}
                Generate
              </button>
              <button className="btn btn-secondary btn-sm" onClick={scoreScript} disabled={store.scoring}>
                {store.scoring ? <Loader2 size={14} /> : <BarChart3 size={14} />}
                Score
              </button>
              <button className="btn btn-ghost btn-sm" onClick={generateHooks}>
                <Lightbulb size={14} /> Hooks
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: AI Sidebar */}
        <EditorSidebar
          activeTab={store.activeTab}
          onTabChange={(tab) => store.setActiveTab(tab)}
          score={store.score}
          breakdown={store.breakdown}
          reasoning={store.reasoning}
          hookVariants={store.hookVariants}
          frameworkMatch={store.frameworkMatch}
          audienceAnalysis={store.audienceAnalysis}
          rewriteInstruction={store.rewriteInstruction}
          rewriteTone={store.rewriteTone}
          rewriteResult={store.rewriteResult}
          rewriting={store.rewriting}
          hasContent={!!store.content.trim()}
          onRewriteInstructionChange={(v) => useEditorStore.setState({ rewriteInstruction: v })}
          onRewriteToneChange={(v) => useEditorStore.setState({ rewriteTone: v })}
          onRewrite={rewriteScript}
          onApplyRewrite={applyRewrite}
          onUseHook={(text) => store.setField("hook", text)}
        />
      </div>

      {/* Export Modal */}
      <ExportModal
        open={store.showExport}
        onClose={() => useEditorStore.setState({ showExport: false })}
        onTeleprompter={() => useEditorStore.setState({ showExport: false, showTeleprompter: true })}
        title={store.title}
        scriptType={store.scriptType}
        audience={store.audience}
        objective={store.objective}
        tone={store.tone}
        platform={store.platform}
        hook={store.hook}
        content={store.content}
        score={store.score}
        status={store.status}
        clientName={store.clientName}
        projectName={store.projectName}
        wordCount={store.wordCount}
      />

      {/* Teleprompter */}
      {store.showTeleprompter && (
        <TeleprompterView
          content={store.content}
          title={store.title}
          onClose={() => useEditorStore.setState({ showTeleprompter: false })}
        />
      )}
    </>
  );
}
