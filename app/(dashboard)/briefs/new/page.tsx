"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import ClientPicker from "@/components/ClientPicker";
import ProjectPicker from "@/components/ProjectPicker";

const PLATFORMS = ["youtube", "tiktok", "instagram", "linkedin", "twitter", "email"];
const TONES = ["conversational", "professional", "urgent", "inspiring", "educational", "provocative"];

export default function NewBriefPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}><div className="skeleton" style={{ height: 400 }} /></div>}>
      <NewBriefInner />
    </Suspense>
  );
}

function NewBriefInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState<string | null>(searchParams.get("client_id"));
  const [projectId, setProjectId] = useState<string | null>(searchParams.get("project_id"));
  const [objective, setObjective] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [platform, setPlatform] = useState("");
  const [tone, setTone] = useState("conversational");
  const [keyMessages, setKeyMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");

  function addMessage() {
    if (newMessage.trim()) {
      setKeyMessages([...keyMessages, newMessage.trim()]);
      setNewMessage("");
    }
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/briefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        client_id: clientId,
        project_id: projectId,
        objective,
        target_audience: targetAudience,
        platform,
        tone,
        key_messages: keyMessages,
        deadline: deadline || null,
        notes,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/briefs/${data.brief.id}`);
    }
    setSaving(false);
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 700 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: "1rem" }}>
        <ArrowLeft size={14} /> Back
      </button>

      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem" }}>New Brief</h1>

      <div style={{ display: "grid", gap: "1.25rem" }}>
        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief title..." style={{ fontSize: "1rem", fontWeight: 600 }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Client</label>
            <ClientPicker value={clientId} onChange={setClientId} />
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Project</label>
            <ProjectPicker clientId={clientId} value={projectId} onChange={setProjectId} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Objective</label>
          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="What should this content achieve?"
            rows={2}
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Target Audience</label>
          <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Who is this for?" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Platform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ width: "100%" }}>
              <option value="">Any</option>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ width: "100%" }}>
              {TONES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Key Messages</label>
          <div style={{ display: "grid", gap: "0.375rem", marginBottom: "0.5rem" }}>
            {keyMessages.map((msg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ flex: 1, fontSize: "0.85rem", padding: "0.375rem 0.5rem", background: "var(--bg)", borderRadius: "var(--radius-sm)" }}>{msg}</span>
                <button onClick={() => setKeyMessages(keyMessages.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.375rem" }}>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMessage())}
              placeholder="Add a key message..."
              style={{ flex: 1 }}
            />
            <button className="btn btn-ghost btn-sm" onClick={addMessage}><Plus size={14} /></button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Deadline</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional context or instructions..."
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !title.trim()} style={{ justifyContent: "center" }}>
          {saving ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}
          {saving ? "Creating..." : "Create Brief"}
        </button>
      </div>
    </div>
  );
}
