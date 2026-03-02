"use client";

import { Lightbulb } from "lucide-react";
import ClientPicker from "@/components/ClientPicker";
import ProjectPicker from "@/components/ProjectPicker";

const TONES = ["conversational", "professional", "urgent", "inspiring", "educational", "provocative"];
const PLATFORMS = ["youtube", "tiktok", "instagram", "linkedin", "twitter", "email"];

interface ScriptMetaBarProps {
  audience: string;
  objective: string;
  tone: string;
  platform: string;
  hook: string;
  clientId: string | null;
  projectId: string | null;
  onFieldChange: (field: string, value: string | null) => void;
}

export default function ScriptMetaBar({
  audience,
  objective,
  tone,
  platform,
  hook,
  clientId,
  projectId,
  onFieldChange,
}: ScriptMetaBarProps) {
  return (
    <>
      {/* Config Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr",
          gap: "0.5rem",
          padding: "0.75rem 1.25rem",
          borderBottom: "1px solid var(--line)",
          background: "var(--surface)",
        }}
      >
        <input
          placeholder="Audience..."
          value={audience}
          onChange={(e) => onFieldChange("audience", e.target.value)}
        />
        <input
          placeholder="Objective..."
          value={objective}
          onChange={(e) => onFieldChange("objective", e.target.value)}
        />
        <select value={tone} onChange={(e) => onFieldChange("tone", e.target.value)} style={{ width: "auto" }}>
          {TONES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        <select value={platform} onChange={(e) => onFieldChange("platform", e.target.value)} style={{ width: "auto" }}>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
        <ClientPicker value={clientId} onChange={(v) => onFieldChange("clientId", v)} />
        <ProjectPicker clientId={clientId} value={projectId} onChange={(v) => onFieldChange("projectId", v)} />
      </div>

      {/* Hook Field */}
      <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
          <Lightbulb size={14} style={{ color: "var(--accent)" }} />
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Hook
          </span>
        </div>
        <input
          value={hook}
          onChange={(e) => onFieldChange("hook", e.target.value)}
          placeholder="Write your hook \u2014 the first thing they see or hear..."
          style={{ fontSize: "0.95rem", fontWeight: 600 }}
        />
      </div>
    </>
  );
}
