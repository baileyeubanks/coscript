"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Plus, Search, Building2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  client_id: string | null;
  deadline: string | null;
  clients: { name: string } | null;
  updated_at: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data.projects || []))
      .catch((err) => console.error("Failed to load projects:", err))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!newName.trim()) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDescription }),
    });
    if (res.ok) {
      const data = await res.json();
      setProjects([data.project, ...projects]);
      setShowAdd(false);
      setNewName("");
      setNewDescription("");
    }
  }

  const filtered = search
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  const STATUS_COLORS: Record<string, string> = {
    active: "badge-green",
    completed: "badge-lime",
    paused: "badge-orange",
    archived: "",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FolderOpen size={24} style={{ color: "var(--accent)" }} /> Projects
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Organize briefs and scripts by project
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> New Project
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem" }}>New Project</h3>
          <div style={{ display: "grid", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Project name *" />
            <input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description (optional)" />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-primary btn-sm" onClick={handleAdd}>Create</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." style={{ paddingLeft: "2rem" }} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
          <FolderOpen size={40} style={{ opacity: 0.3, margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "0.9rem" }}>{search ? "No projects match" : "No projects yet"}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              className="card"
              onClick={() => router.push(`/projects/${p.id}`)}
              style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", cursor: "pointer" }}
            >
              <FolderOpen size={20} style={{ color: "var(--accent)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.name}</div>
                <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                  {p.clients?.name && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Building2 size={11} /> {p.clients.name}
                    </span>
                  )}
                  {p.description && <span>{p.description.slice(0, 60)}{p.description.length > 60 ? "..." : ""}</span>}
                </div>
              </div>
              <span className={`badge ${STATUS_COLORS[p.status] || "badge-blue"}`} style={{ textTransform: "capitalize" }}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
