"use client";

import { FileText, Calendar, Building2 } from "lucide-react";

interface BriefCardProps {
  brief: {
    id: string;
    title: string;
    platform: string;
    status: string;
    deadline: string | null;
    clients?: { name: string } | null;
  };
  onClick: () => void;
}

const BRIEF_STATUS_COLORS: Record<string, string> = {
  draft: "badge-blue",
  active: "badge-green",
  completed: "badge-lime",
  archived: "",
};

export default function BriefCard({ brief, onClick }: BriefCardProps) {
  return (
    <div className="card" onClick={onClick} style={{ padding: "1rem", cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FileText size={14} style={{ color: "var(--accent)" }} />
          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{brief.title}</span>
        </div>
        <span className={`badge ${BRIEF_STATUS_COLORS[brief.status] || "badge-blue"}`} style={{ textTransform: "capitalize" }}>
          {brief.status}
        </span>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "var(--muted)" }}>
        {brief.clients?.name && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <Building2 size={11} /> {brief.clients.name}
          </span>
        )}
        {brief.platform && <span>{brief.platform}</span>}
        {brief.deadline && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <Calendar size={11} /> {new Date(brief.deadline).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
