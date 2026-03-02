"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import ClientPicker from "@/components/ClientPicker";

interface EventFormProps {
  defaultDate?: string;
  onCreated: () => void;
  onCancel: () => void;
}

const EVENT_TYPES = [
  { value: "deadline", label: "Deadline" },
  { value: "shoot", label: "Shoot Day" },
  { value: "review", label: "Review" },
  { value: "delivery", label: "Delivery" },
];

export default function EventForm({ defaultDate, onCreated, onCancel }: EventFormProps) {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("deadline");
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split("T")[0]);
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSaving(true);
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        event_type: eventType,
        date,
        time_start: timeStart || null,
        time_end: timeEnd || null,
        notes,
        client_id: clientId,
      }),
    });
    if (res.ok) {
      onCreated();
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 700 }}>New Event</h3>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Event title..."
        required
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <div>
          <label style={{ fontSize: "0.7rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>Start</label>
          <input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: "0.7rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>End</label>
          <input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
        </div>
      </div>

      <ClientPicker value={clientId} onChange={setClientId} />

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes..."
        rows={2}
        style={{ resize: "none" }}
      />

      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !title.trim()}>
          {saving ? <Loader2 size={14} className="spinner" /> : null}
          Create Event
        </button>
      </div>
    </form>
  );
}
