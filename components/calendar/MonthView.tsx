"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  date: string;
  status: string;
}

interface MonthViewProps {
  year: number;
  month: number; // 0-indexed
  events: CalendarEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const TYPE_COLORS: Record<string, string> = {
  deadline: "var(--red)",
  shoot: "var(--green)",
  review: "var(--blue)",
  delivery: "var(--accent)",
};

export default function MonthView({
  year,
  month,
  events,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: MonthViewProps) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function eventsForDay(day: number) {
    const d = dateStr(day);
    return events.filter((e) => e.date === d);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <button className="btn btn-ghost btn-sm" onClick={onPrevMonth}>
          <ChevronLeft size={16} />
        </button>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
          {MONTHS[month]} {year}
        </h2>
        <button className="btn btn-ghost btn-sm" onClick={onNextMonth}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
        {DAYS.map((d) => (
          <div key={d} style={{ textAlign: "center", padding: "0.5rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={i} style={{ minHeight: 80, background: "var(--surface)", borderRadius: 4 }} />;
          }

          const d = dateStr(day);
          const dayEvents = eventsForDay(day);
          const isToday = d === today;
          const isSelected = d === selectedDate;

          return (
            <div
              key={i}
              onClick={() => onSelectDate(d)}
              style={{
                minHeight: 80,
                background: isSelected ? "var(--accent-dim)" : "var(--surface)",
                borderRadius: 4,
                padding: "0.375rem",
                cursor: "pointer",
                border: isSelected ? "1px solid var(--accent)" : "1px solid transparent",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{
                fontSize: "0.75rem",
                fontWeight: isToday ? 800 : 400,
                color: isToday ? "var(--accent)" : "var(--ink)",
                marginBottom: "0.25rem",
              }}>
                {day}
              </div>
              {dayEvents.slice(0, 3).map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    fontSize: "0.6rem",
                    padding: "0.125rem 0.25rem",
                    borderRadius: 3,
                    marginBottom: 2,
                    background: `${TYPE_COLORS[ev.event_type] || "var(--blue)"}22`,
                    color: TYPE_COLORS[ev.event_type] || "var(--blue)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {ev.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>+{dayEvents.length - 3} more</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
