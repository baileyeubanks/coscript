"use client";

import { Save, Copy, Loader2, Download } from "lucide-react";
import SaveIndicator from "@/components/SaveIndicator";

const TYPES = [
  { value: "video_script", label: "Video Script" },
  { value: "social_media", label: "Social Post" },
  { value: "blog", label: "Blog Post" },
  { value: "ad_copy", label: "Ad Copy" },
  { value: "email", label: "Email" },
];

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "Review" },
  { value: "internal_review", label: "Internal Review" },
  { value: "client_review", label: "Client Review" },
  { value: "approved", label: "Approved" },
  { value: "produced", label: "Produced" },
  { value: "delivered", label: "Delivered" },
  { value: "published", label: "Published" },
];

interface EditorToolbarProps {
  title: string;
  scriptType: string;
  status: string;
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  onTitleChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onSave: () => void;
  onCopy: () => void;
  onExport: () => void;
}

export default function EditorToolbar({
  title,
  scriptType,
  status,
  dirty,
  saving,
  saved,
  onTitleChange,
  onTypeChange,
  onStatusChange,
  onSave,
  onCopy,
  onExport,
}: EditorToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.75rem 1.25rem",
        borderBottom: "1px solid var(--line)",
        background: "var(--surface)",
      }}
    >
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          fontSize: "1rem",
          fontWeight: 700,
          color: "var(--ink)",
          padding: "0.25rem",
        }}
        placeholder="Script title..."
      />
      <select value={scriptType} onChange={(e) => onTypeChange(e.target.value)} style={{ width: "auto", fontSize: "0.8rem" }}>
        {TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <select value={status} onChange={(e) => onStatusChange(e.target.value)} style={{ width: "auto", fontSize: "0.8rem" }}>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <SaveIndicator dirty={dirty} saving={saving} saved={saved} />
      <button className="btn btn-ghost btn-sm" onClick={onCopy} title="Copy to clipboard">
        <Copy size={14} />
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onExport} title="Export">
        <Download size={14} />
      </button>
      <button className="btn btn-secondary btn-sm" onClick={onSave} disabled={saving}>
        {saving ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}
        Save
      </button>
    </div>
  );
}
