"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, FolderOpen, Trash2, FileText } from "lucide-react";
import BriefCard from "@/components/BriefCard";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  client_id: string | null;
  deadline: string | null;
  clients: { name: string; industry: string } | null;
}

interface Brief {
  id: string;
  title: string;
  platform: string;
  status: string;
  deadline: string | null;
  clients: { name: string } | null;
}

interface Script {
  id: string;
  title: string;
  script_type: string;
  status: string;
  score: number;
  updated_at: string;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProject(data.project || null);
        setBriefs(data.briefs || []);
        setScripts(data.scripts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.push("/projects");
  }

  const scoreClass = (s: number) => (s >= 80 ? "score-high" : s >= 50 ? "score-mid" : "score-low");

  if (loading) return <div style={{ padding: "2rem" }}><div className="skeleton" style={{ height: 400 }} /></div>;
  if (!project) return <div style={{ padding: "2rem", color: "var(--muted)" }}>Project not found</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: 900 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => router.push("/projects")} style={{ marginBottom: "1rem" }}>
        <ArrowLeft size={14} /> Back to Projects
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FolderOpen size={22} style={{ color: "var(--accent)" }} /> {project.name}
          </h1>
          <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.375rem" }}>
            {project.clients?.name && <span>{project.clients.name}</span>}
            {project.description && <span>{project.description}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-primary btn-sm" onClick={() => router.push(`/briefs/new?project_id=${id}${project.client_id ? `&client_id=${project.client_id}` : ""}`)}>
            <Plus size={14} /> New Brief
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleDelete} style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
        </div>
      </div>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Briefs ({briefs.length})</h2>
          {briefs.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No briefs yet. Create one to start generating scripts.</p>
          ) : (
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {briefs.map((b) => (
                <BriefCard key={b.id} brief={b} onClick={() => router.push(`/briefs/${b.id}`)} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Scripts ({scripts.length})</h2>
          {scripts.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No scripts linked to this project yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {scripts.map((s) => (
                <div
                  key={s.id}
                  className="card"
                  onClick={() => router.push(`/scripts/${s.id}`)}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1.25rem", cursor: "pointer" }}
                >
                  <div className={`score-ring ${scoreClass(s.score)}`} style={{ width: 36, height: 36, fontSize: "0.75rem" }}>
                    {s.score || "\u2014"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{s.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{s.script_type.replace(/_/g, " ")}</div>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{new Date(s.updated_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
