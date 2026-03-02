"use client";

import { useToastStore } from "@/lib/stores/toastStore";
import { X } from "lucide-react";

export default function Toast() {
  const { toasts, remove } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-sm)",
            background: t.type === "error" ? "var(--red)" : t.type === "success" ? "var(--green)" : "var(--surface-2)",
            color: "var(--ink)",
            fontSize: "0.85rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            animation: "fadeIn 0.2s ease",
            minWidth: 240,
          }}
        >
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
