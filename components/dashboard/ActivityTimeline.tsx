"use client";

import { useState, useEffect } from "react";
import { Activity, Loader2 } from "lucide-react";

interface ActivityEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  created: "var(--green)",
  updated: "var(--blue)",
  scored: "var(--accent)",
  approved: "var(--green)",
  changes_requested: "var(--orange)",
  deleted: "var(--red)",
};

export default function ActivityTimeline() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity?limit=15")
      .then((r) => r.json())
      .then((data) => setActivities(data.activities || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: "1rem", textAlign: "center" }}><Loader2 size={16} className="spinner" /></div>;
  }

  if (activities.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
        No recent activity. Start creating scripts to see your timeline.
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Activity size={16} /> Recent Activity
      </h3>
      <div style={{ display: "grid", gap: "0.125rem" }}>
        {activities.map((a) => {
          const color = ACTION_COLORS[a.action] || "var(--muted)";
          const title = (a.metadata?.title as string) || a.entity_type;
          const relativeTime = getRelativeTime(a.created_at);

          return (
            <div key={a.id} style={{ display: "flex", gap: "0.75rem", padding: "0.5rem 0" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <div style={{ flex: 1, width: 1, background: "var(--line)" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.8rem" }}>
                  <span style={{ fontWeight: 600 }}>{a.action}</span>
                  <span style={{ color: "var(--muted)" }}> {a.entity_type} </span>
                  <span style={{ fontWeight: 600 }}>{title}</span>
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{relativeTime}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
