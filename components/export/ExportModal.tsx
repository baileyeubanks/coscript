"use client";

import { X, Copy, FileText, FileDown, Monitor, Check } from "lucide-react";
import { useState } from "react";
import { downloadMarkdown } from "@/lib/utils/exportMarkdown";
import { downloadDocx } from "@/lib/utils/exportDocx";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onTeleprompter: () => void;
  title: string;
  scriptType: string;
  audience: string;
  objective: string;
  tone: string;
  platform: string;
  hook: string;
  content: string;
  score: number;
  status: string;
  clientName?: string;
  projectName?: string;
  wordCount: number;
}

export default function ExportModal({
  open,
  onClose,
  onTeleprompter,
  title,
  scriptType,
  audience,
  objective,
  tone,
  platform,
  hook,
  content,
  score,
  status,
  clientName,
  projectName,
  wordCount,
}: ExportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const exportOpts = {
    title,
    scriptType,
    audience,
    objective,
    tone,
    platform,
    hook,
    content,
    score,
    status,
    clientName,
    projectName,
    wordCount,
  };

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleMarkdown() {
    downloadMarkdown(exportOpts);
    onClose();
  }

  async function handleDocx() {
    await downloadDocx(exportOpts);
    onClose();
  }

  function handleTeleprompter() {
    onTeleprompter();
    onClose();
  }

  const options = [
    {
      icon: copied ? Check : Copy,
      label: "Copy to Clipboard",
      description: "Plain text, ready to paste",
      onClick: handleCopy,
      accent: copied,
    },
    {
      icon: FileText,
      label: "Markdown (.md)",
      description: "With YAML frontmatter metadata",
      onClick: handleMarkdown,
    },
    {
      icon: FileDown,
      label: "Word Document (.docx)",
      description: "Formatted with title page and metadata",
      onClick: handleDocx,
    },
    {
      icon: Monitor,
      label: "Teleprompter",
      description: "Full-screen large text with auto-scroll",
      onClick: handleTeleprompter,
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Export Script</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gap: "0.5rem" }}>
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={opt.onClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem",
                background: "var(--bg)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-sm)",
                width: "100%",
                textAlign: "left",
                color: "var(--ink)",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-sm)",
                  background: opt.accent ? "var(--green)" : "var(--accent-dim)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <opt.icon size={18} style={{ color: opt.accent ? "white" : "var(--accent)" }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{opt.label}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.125rem" }}>{opt.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
