"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Building2, FolderOpen, ClipboardList, LayoutTemplate, X, Loader2 } from "lucide-react";

interface SearchResult {
  type: "script" | "client" | "project" | "brief" | "template";
  id: string;
  title: string;
  subtitle?: string;
}

const TYPE_ICONS = {
  script: FileText,
  client: Building2,
  project: FolderOpen,
  brief: ClipboardList,
  template: LayoutTemplate,
};

const TYPE_ROUTES: Record<string, string> = {
  script: "/scripts",
  client: "/clients",
  project: "/projects",
  brief: "/briefs",
  template: "/templates",
};

export default function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cmd+K to open
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setSelected(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const allResults: SearchResult[] = [];

    try {
      const [scriptsRes, clientsRes, projectsRes, briefsRes, templatesRes] = await Promise.all([
        fetch("/api/scripts").then((r) => r.json()).catch(() => ({ scripts: [] })),
        fetch("/api/clients").then((r) => r.json()).catch(() => ({ clients: [] })),
        fetch("/api/projects").then((r) => r.json()).catch(() => ({ projects: [] })),
        fetch("/api/briefs").then((r) => r.json()).catch(() => ({ briefs: [] })),
        fetch(`/api/templates?search=${encodeURIComponent(q)}`).then((r) => r.json()).catch(() => ({ templates: [] })),
      ]);

      const lq = q.toLowerCase();

      (scriptsRes.scripts || []).forEach((s: { id: string; title: string; status: string }) => {
        if (s.title?.toLowerCase().includes(lq)) {
          allResults.push({ type: "script", id: s.id, title: s.title, subtitle: s.status });
        }
      });

      (clientsRes.clients || []).forEach((c: { id: string; name: string; industry: string }) => {
        if (c.name?.toLowerCase().includes(lq)) {
          allResults.push({ type: "client", id: c.id, title: c.name, subtitle: c.industry });
        }
      });

      (projectsRes.projects || []).forEach((p: { id: string; name: string; status: string }) => {
        if (p.name?.toLowerCase().includes(lq)) {
          allResults.push({ type: "project", id: p.id, title: p.name, subtitle: p.status });
        }
      });

      (briefsRes.briefs || []).forEach((b: { id: string; title: string; platform: string }) => {
        if (b.title?.toLowerCase().includes(lq)) {
          allResults.push({ type: "brief", id: b.id, title: b.title, subtitle: b.platform });
        }
      });

      (templatesRes.templates || []).forEach((t: { id: string; name: string; category: string }) => {
        if (t.name?.toLowerCase().includes(lq)) {
          allResults.push({ type: "template", id: t.id, title: t.name, subtitle: t.category });
        }
      });
    } catch {
      // Non-critical
    }

    setResults(allResults.slice(0, 10));
    setSelected(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  function navigate(result: SearchResult) {
    const base = TYPE_ROUTES[result.type] || "";
    router.push(`${base}/${result.id}`);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) { navigate(results[selected]); }
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%",
          maxWidth: 540,
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          marginTop: "15vh",
          alignSelf: "flex-start",
        }}
      >
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderBottom: "1px solid var(--line)" }}>
          <Search size={18} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search scripts, clients, projects, briefs..."
            style={{ flex: 1, background: "transparent", border: "none", fontSize: "0.95rem", padding: "0.25rem 0" }}
          />
          {loading && <Loader2 size={16} className="spinner" />}
          <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflow: "auto" }}>
          {query && results.length === 0 && !loading && (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
              No results found
            </div>
          )}
          {results.map((r, i) => {
            const Icon = TYPE_ICONS[r.type] || FileText;
            return (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => navigate(r)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: i === selected ? "var(--accent-dim)" : "transparent",
                  border: "none",
                  textAlign: "left",
                  color: "var(--ink)",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--line)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={() => setSelected(i)}
              >
                <Icon size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{r.title}</div>
                  {r.subtitle && (
                    <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{r.type} {r.subtitle && `\u2022 ${r.subtitle}`}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "0.5rem 1rem", borderTop: "1px solid var(--line)", display: "flex", gap: "1rem", fontSize: "0.7rem", color: "var(--muted)" }}>
          <span><kbd style={{ padding: "0 0.25rem", background: "var(--bg)", borderRadius: 2, fontFamily: "inherit" }}>\u2191\u2193</kbd> navigate</span>
          <span><kbd style={{ padding: "0 0.25rem", background: "var(--bg)", borderRadius: 2, fontFamily: "inherit" }}>\u23CE</kbd> select</span>
          <span><kbd style={{ padding: "0 0.25rem", background: "var(--bg)", borderRadius: 2, fontFamily: "inherit" }}>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
