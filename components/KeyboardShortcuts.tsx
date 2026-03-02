"use client";

import { useEffect, useState } from "react";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: ["\u2318", "S"], description: "Save script" },
  { keys: ["\u2318", "K"], description: "Quick search" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["Esc"], description: "Close modal / teleprompter" },
  { keys: ["Space"], description: "Play / pause teleprompter" },
  { keys: ["\u2191"], description: "Increase teleprompter speed" },
  { keys: ["\u2193"], description: "Decrease teleprompter speed" },
  { keys: ["+"], description: "Increase teleprompter font" },
  { keys: ["-"], description: "Decrease teleprompter font" },
  { keys: ["R"], description: "Reset teleprompter" },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && e.target === document.body) {
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Keyboard size={18} /> Keyboard Shortcuts
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gap: "0.375rem" }}>
          {SHORTCUTS.map((s) => (
            <div key={s.description} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{s.description}</span>
              <div style={{ display: "flex", gap: "0.25rem" }}>
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 28,
                      height: 28,
                      padding: "0 0.375rem",
                      background: "var(--bg)",
                      border: "1px solid var(--line)",
                      borderRadius: 4,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      fontFamily: "inherit",
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
