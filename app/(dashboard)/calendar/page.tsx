"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Plus } from "lucide-react";
import MonthView from "@/components/calendar/MonthView";
import DayDetail from "@/components/calendar/DayDetail";
import EventForm from "@/components/calendar/EventForm";

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

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchEvents = useCallback(async () => {
    const m = `${year}-${String(month + 1).padStart(2, "0")}`;
    const res = await fetch(`/api/calendar?month=${m}`);
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events || []);
    }
  }, [year, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
    fetchEvents();
  }

  async function updateEventStatus(id: string, status: string) {
    await fetch("/api/calendar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchEvents();
  }

  const selectedEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate)
    : [];

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Calendar size={24} /> Content Calendar
        </h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <Plus size={14} /> New Event
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem" }}>
        {/* Month view */}
        <MonthView
          year={year}
          month={month}
          events={events}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />

        {/* Sidebar */}
        <div>
          {showForm ? (
            <div className="card" style={{ padding: "1rem" }}>
              <EventForm
                defaultDate={selectedDate || undefined}
                onCreated={() => { setShowForm(false); fetchEvents(); }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          ) : selectedDate ? (
            <DayDetail
              date={selectedDate}
              events={selectedEvents}
              onDelete={deleteEvent}
              onStatusChange={updateEventStatus}
            />
          ) : (
            <div style={{ color: "var(--muted)", fontSize: "0.85rem", textAlign: "center", padding: "3rem 0" }}>
              Select a date to see events
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
