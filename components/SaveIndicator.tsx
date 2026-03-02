"use client";

import { Check, Loader2, AlertCircle } from "lucide-react";

interface SaveIndicatorProps {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
}

export default function SaveIndicator({ dirty, saving, saved }: SaveIndicatorProps) {
  if (saving) {
    return (
      <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--muted)" }}>
        <Loader2 size={12} className="spinner" /> Saving...
      </span>
    );
  }

  if (saved) {
    return (
      <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--green)" }}>
        <Check size={12} /> Saved
      </span>
    );
  }

  if (dirty) {
    return (
      <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--orange)" }}>
        <AlertCircle size={12} /> Unsaved
      </span>
    );
  }

  return null;
}
