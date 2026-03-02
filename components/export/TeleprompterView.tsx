"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Play, Pause, Minus, Plus, RotateCcw } from "lucide-react";

interface TeleprompterViewProps {
  content: string;
  title: string;
  onClose: () => void;
}

export default function TeleprompterView({ content, title, onClose }: TeleprompterViewProps) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(40); // pixels per second
  const [fontSize, setFontSize] = useState(48);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<number>(0);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const animate = useCallback(
    (timestamp: number) => {
      if (!containerRef.current) return;
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      scrollRef.current += speed * delta;
      containerRef.current.scrollTop = scrollRef.current;

      if (scrollRef.current >= containerRef.current.scrollHeight - containerRef.current.clientHeight) {
        setPlaying(false);
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    },
    [speed]
  );

  useEffect(() => {
    if (playing) {
      lastTimeRef.current = 0;
      animRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animRef.current);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, animate]);

  function handleReset() {
    setPlaying(false);
    scrollRef.current = 0;
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }

  // Keyboard controls
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSpeed((s) => Math.min(s + 10, 200)); }
      if (e.key === "ArrowDown") { e.preventDefault(); setSpeed((s) => Math.max(s - 10, 10)); }
      if (e.key === "+" || e.key === "=") setFontSize((s) => Math.min(s + 4, 96));
      if (e.key === "-") setFontSize((s) => Math.max(s - 4, 24));
      if (e.key === "r") handleReset();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="teleprompter-overlay">
      {/* Controls bar */}
      <div className="teleprompter-controls">
        <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button className="btn btn-ghost btn-sm" onClick={handleReset} title="Reset (R)">
            <RotateCcw size={14} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Size</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setFontSize((s) => Math.max(s - 4, 24))}>
              <Minus size={12} />
            </button>
            <span style={{ fontSize: "0.75rem", minWidth: 30, textAlign: "center" }}>{fontSize}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setFontSize((s) => Math.min(s + 4, 96))}>
              <Plus size={12} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Speed</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setSpeed((s) => Math.max(s - 10, 10))}>
              <Minus size={12} />
            </button>
            <span style={{ fontSize: "0.75rem", minWidth: 30, textAlign: "center" }}>{speed}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setSpeed((s) => Math.min(s + 10, 200))}>
              <Plus size={12} />
            </button>
          </div>

          <button
            className={`btn ${playing ? "btn-secondary" : "btn-primary"} btn-sm`}
            onClick={() => setPlaying((p) => !p)}
            style={{ minWidth: 80 }}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
            {playing ? "Pause" : "Play"}
          </button>

          <button className="btn btn-ghost btn-sm" onClick={onClose} title="Close (Esc)">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Script content */}
      <div ref={containerRef} className="teleprompter-content" style={{ fontSize: `${fontSize}px` }}>
        <div style={{ minHeight: "50vh" }} />
        {content.split("\n").map((line, i) => (
          <p key={i} style={{ margin: "0.5em 0", minHeight: "1em" }}>
            {line || "\u00A0"}
          </p>
        ))}
        <div style={{ minHeight: "50vh" }} />
      </div>
    </div>
  );
}
