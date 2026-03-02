"use client";

import { FileText, Play } from "lucide-react";

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    category: string;
    industry: string;
    platform: string;
    description: string;
    is_system: boolean;
  };
  onUse: () => void;
  onPreview: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  video_script: "badge-blue",
  social_media: "badge-orange",
  blog: "badge-green",
  ad_copy: "badge-lime",
  email: "badge-blue",
};

export default function TemplateCard({ template, onUse, onPreview }: TemplateCardProps) {
  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FileText size={16} style={{ color: "var(--accent)" }} />
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{template.name}</span>
        </div>
        {template.is_system && (
          <span className="badge" style={{ fontSize: "0.6rem", background: "var(--surface-2)", color: "var(--muted)" }}>System</span>
        )}
      </div>

      <p style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: "0.75rem" }}>
        {template.description}
      </p>

      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <span className={`badge ${CATEGORY_COLORS[template.category] || "badge-blue"}`}>
          {template.category.replace(/_/g, " ")}
        </span>
        {template.platform && (
          <span className="badge" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
            {template.platform}
          </span>
        )}
        {template.industry && (
          <span className="badge" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
            {template.industry}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button className="btn btn-primary btn-sm" onClick={onUse} style={{ flex: 1 }}>
          <Play size={12} /> Use Template
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onPreview}>Preview</button>
      </div>
    </div>
  );
}
