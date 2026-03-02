"use client";

import { useState, useEffect } from "react";
import { FolderOpen } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface ProjectPickerProps {
  clientId?: string | null;
  value: string | null;
  onChange: (projectId: string | null) => void;
  style?: React.CSSProperties;
}

export default function ProjectPicker({ clientId, value, onChange, style }: ProjectPickerProps) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (clientId) params.set("client_id", clientId);
    fetch(`/api/projects?${params}`)
      .then((r) => r.json())
      .then((data) => setProjects(data.projects || []))
      .catch(() => {});
  }, [clientId]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", ...style }}>
      <FolderOpen size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        style={{ width: "100%", fontSize: "0.8rem" }}
      >
        <option value="">No project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
}
