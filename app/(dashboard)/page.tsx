"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, TrendingUp, Users, FolderOpen, ClipboardList, Eye, PenTool, BarChart3, Plus } from "lucide-react";
import PipelineBoard from "@/components/dashboard/PipelineBoard";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import ClientOverviewGrid from "@/components/dashboard/ClientOverviewGrid";

interface Stats {
  total_scripts: number;
  total_clients: number;
  total_projects: number;
  total_briefs: number;
  active_reviews: number;
  avg_score: number;
  status_breakdown: Record<string, number>;
}

interface PipelineData {
  pipeline: Record<string, { id: string; title: string; status: string; score: number; updated_at: string; clients?: { name: string } | null }[]>;
  stages: string[];
}

export default function StudioPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then((r) => r.json()),
      fetch("/api/dashboard/pipeline").then((r) => r.json()),
    ])
      .then(([statsData, pipelineData]) => {
        setStats(statsData);
        setPipeline(pipelineData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = stats
    ? [
        { label: "Scripts", value: stats.total_scripts, icon: FileText, color: "var(--accent)" },
        { label: "Clients", value: stats.total_clients, icon: Users, color: "var(--blue)" },
        { label: "Projects", value: stats.total_projects, icon: FolderOpen, color: "var(--green)" },
        { label: "Avg Score", value: stats.avg_score, icon: BarChart3, color: stats.avg_score >= 80 ? "var(--green)" : stats.avg_score >= 50 ? "var(--orange)" : "var(--red)" },
        { label: "Briefs", value: stats.total_briefs, icon: ClipboardList, color: "var(--orange)" },
        { label: "Active Reviews", value: stats.active_reviews, icon: Eye, color: "var(--blue)" },
      ]
    : [];

  const QUICK_ACTIONS = [
    { label: "New Script", href: "/editor", icon: PenTool },
    { label: "New Brief", href: "/briefs/new", icon: ClipboardList },
    { label: "New Client", href: "/clients", icon: Users },
    { label: "Templates", href: "/templates", icon: TrendingUp },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Studio</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Your agency command center</p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push("/editor")}>
          <Plus size={16} /> New Script
        </button>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {STAT_CARDS.map((card) => (
            <div key={card.label} className="card" style={{ padding: "1rem", textAlign: "center" }}>
              <card.icon size={20} style={{ color: card.color, marginBottom: "0.375rem" }} />
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            className="btn btn-secondary btn-sm"
            onClick={() => router.push(action.href)}
          >
            <action.icon size={14} /> {action.label}
          </button>
        ))}
      </div>

      {/* Pipeline Board */}
      {pipeline && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Script Pipeline</h2>
          <PipelineBoard pipeline={pipeline.pipeline} stages={pipeline.stages} />
        </div>
      )}

      {/* Bottom Grid: Activity + Clients */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.25rem" }}>
          <ActivityTimeline />
        </div>
        <div className="card" style={{ padding: "1.25rem" }}>
          <ClientOverviewGrid />
        </div>
      </div>
    </div>
  );
}
