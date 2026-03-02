"use client";

import { Clock, MapPin, FileText, Trash2 } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  date: string;
  time_start: string | null;
  time_end: string | null;
  notes: string;
  status: string;
  scripts?: { title: string } | null;
  coscript_projects?: { name: string } | null;
  clients?: { name: string } | null;
}

interface DayDetailProps {
  date: string;
  events: CalendarEvent[];
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  deadline: "Deadline",
  shoot: "Shoot Day",
  review: "Review",
  delivery: "Delivery",
};

const TYPE_COLORS: Record<string, string> = {
  deadline: "badge-red",
  shoot: "badge-green",
  review: "badge-blue",
  delivery: "badge-lime",
};

export default function DayDetail({ date, events, onDelete, onStatusChange }: DayDetailProps) {
  const formatted = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem" }}>{formatted}</h3>

      {events.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No events scheduled.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {events.map((ev) => (
            <div key={ev.id} className="card" style={{ padding: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.375rem" }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{ev.title}</span>
                  <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.25rem" }}>
                    <span className={`badge ${TYPE_COLORS[ev.event_type] || "badge-blue"}`}>
                      {TYPE_LABELS[ev.event_type] || ev.event_type}
                    </span>
                    <span className={`badge ${ev.status === "completed" ? "badge-green" : ev.status === "cancelled" ? "badge-red" : "badge-blue"}`}>
                      {ev.status}
                    </span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => onDelete(ev.id)} style={{ color: "var(--red)" }}>
                  <Trash2 size={12} />
                </button>
              </div>

              {(ev.time_start || ev.time_end) && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.375rem" }}>
                  <Clock size={12} />
                  {ev.time_start && ev.time_start.slice(0, 5)}
                  {ev.time_start && ev.time_end && " \u2014 "}
                  {ev.time_end && ev.time_end.slice(0, 5)}
                </div>
              )}

              {ev.scripts?.title && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                  <FileText size={12} /> {ev.scripts.title}
                </div>
              )}

              {ev.clients?.name && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                  <MapPin size={12} /> {ev.clients.name}
                </div>
              )}

              {ev.notes && (
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.375rem", lineHeight: 1.5 }}>{ev.notes}</p>
              )}

              {ev.status === "scheduled" && (
                <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.5rem" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => onStatusChange(ev.id, "completed")} style={{ color: "var(--green)", fontSize: "0.7rem" }}>
                    Mark Complete
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => onStatusChange(ev.id, "cancelled")} style={{ color: "var(--red)", fontSize: "0.7rem" }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
