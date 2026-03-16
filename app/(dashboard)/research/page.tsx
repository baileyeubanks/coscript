"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ExternalLink,
  Eye,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import type { ResearchItemRecord, WatchlistRecord } from "@/lib/contracts";

type Watchlist = WatchlistRecord;
type ResearchItem = ResearchItemRecord;

export default function ResearchHub() {
  const router = useRouter();
  const [tab, setTab] = useState<"watchlists" | "outliers" | "trending">("watchlists");
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [outliers, setOutliers] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newPlatform, setNewPlatform] = useState("youtube");

  useEffect(() => {
    Promise.all([
      fetch("/api/watchlists").then((response) => response.json()),
      fetch("/api/research?sort=outlier_score").then((response) => response.json()),
    ])
      .then(([watchlistData, researchData]) => {
        setWatchlists(watchlistData.watchlists ?? []);
        setOutliers(researchData.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function addWatchlist() {
    if (!newName.trim()) return;
    const response = await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        platform: newPlatform,
        channel_url: newUrl,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setWatchlists([data.watchlist, ...watchlists]);
      setNewName("");
      setNewUrl("");
      setShowAdd(false);
    }
  }

  async function deleteWatchlist(id: string) {
    if (!confirm("Remove this watchlist?")) return;
    await fetch(`/api/watchlists/${id}`, { method: "DELETE" });
    setWatchlists(watchlists.filter((watchlist) => watchlist.id !== id));
  }

  function formatViews(count: number) {
    if (count >= 1e6) return `${(count / 1e6).toFixed(1)}M`;
    if (count >= 1e3) return `${(count / 1e3).toFixed(1)}K`;
    return String(count);
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div
        className="card"
        style={{
          display: "grid",
          gap: "1rem",
          marginBottom: "1.5rem",
          background: "linear-gradient(160deg, rgba(44, 84, 128, 0.07), rgba(94, 106, 82, 0.08), rgba(181, 82, 51, 0.07))",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <div
              style={{
                fontSize: ".72rem",
                letterSpacing: ".16em",
                textTransform: "uppercase" as const,
                fontWeight: 800,
                color: "var(--signal)",
                marginBottom: ".45rem",
              }}
            >
              Research inputs
            </div>
            <h1 style={{ fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: ".4rem" }}>
              Signal intake for the next script build.
            </h1>
            <p style={{ color: "var(--muted)", fontSize: ".92rem", lineHeight: 1.65 }}>
              Watchlists and outlier leads are upstream inputs for the editor. We use them to find tension, proof,
              and repeatable hook patterns before the writing pass starts.
            </p>
          </div>
          <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={() => router.push("/editor")}>
              <Sparkles size={16} /> Open editor
            </button>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add watchlist
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: ".75rem",
            padding: ".9rem 1rem",
            borderRadius: 18,
            border: "1px solid rgba(181, 82, 51, 0.16)",
            background: "rgba(255, 255, 255, 0.72)",
          }}
        >
            <AlertCircle size={16} style={{ color: "var(--signal)", flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, color: "var(--muted)", fontSize: ".82rem", lineHeight: 1.6 }}>
            Signal sync is still partial in this pass. Watchlist freshness and status are real, but upstream
            ingestion remains limited and automated pattern extraction is not yet fully wired.
          </p>
        </div>
      </div>

      <div className="tab-bar" style={{ marginBottom: "1.25rem" }}>
        <button className={`tab ${tab === "watchlists" ? "active" : ""}`} onClick={() => setTab("watchlists")}>
          Watchlists ({watchlists.length})
        </button>
        <button className={`tab ${tab === "outliers" ? "active" : ""}`} onClick={() => setTab("outliers")}>
          Proof leads ({outliers.length})
        </button>
        <button className={`tab ${tab === "trending" ? "active" : ""}`} onClick={() => setTab("trending")}>
          Trending watch
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: "1rem", display: "grid", gap: ".6rem" }}>
          <input
            placeholder="Watchlist name (for example: a creator or channel)"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
          />
          <input
            placeholder="Channel URL (optional)"
            value={newUrl}
            onChange={(event) => setNewUrl(event.target.value)}
          />
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            <select value={newPlatform} onChange={(event) => setNewPlatform(event.target.value)} style={{ width: "auto" }}>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={addWatchlist}>
              Save watchlist
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gap: ".5rem" }}>
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton" style={{ height: 88 }} />
          ))}
        </div>
      ) : tab === "watchlists" ? (
        watchlists.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
            <Search size={32} style={{ color: "var(--muted)", marginBottom: ".75rem" }} />
            <p style={{ color: "var(--muted)" }}>
              No watchlists yet. Add creators or channels so the editor has a stronger pool of upstream signals.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: ".6rem" }}>
            {watchlists.map((watchlist) => (
              <div
                key={watchlist.id}
                className="card"
                style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.95rem 1.1rem" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: ".92rem" }}>{watchlist.name}</div>
                  <div style={{ fontSize: ".76rem", color: "var(--muted)", marginTop: ".18rem" }}>
                    {watchlist.platform} ·{" "}
                    {watchlist.last_synced_at
                      ? `Last sync ${new Date(watchlist.last_synced_at).toLocaleDateString()}`
                      : "No sync recorded yet"}
                  </div>
                </div>
                <span className={`badge ${watchlist.status === "active" ? "badge-green" : "badge-orange"}`}>
                  {watchlist.status}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteWatchlist(watchlist.id)} style={{ color: "var(--red)" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )
      ) : tab === "outliers" ? (
        outliers.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
            <TrendingUp size={32} style={{ color: "var(--muted)", marginBottom: ".75rem" }} />
            <p style={{ color: "var(--muted)" }}>
              No outlier leads yet. Once the pipeline has more signal, this surface should point the editor toward the
              strongest next angles.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {outliers.map((item) => (
              <div key={item.id} className="card" style={{ padding: 0 }}>
                {item.thumbnail_url && (
                  <div
                    style={{
                      width: "100%",
                      height: 160,
                      background: "var(--line)",
                      borderRadius: "var(--radius) var(--radius) 0 0",
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      src={item.thumbnail_url}
                      alt=""
                      width={560}
                      height={320}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}
                <div style={{ padding: ".95rem" }}>
                  <div style={{ fontWeight: 700, fontSize: ".88rem", marginBottom: ".35rem", lineHeight: 1.4 }}>
                    {item.title}
                  </div>
                  <div style={{ display: "flex", gap: ".75rem", fontSize: ".75rem", color: "var(--muted)", flexWrap: "wrap" }}>
                    <span>
                      <Eye size={12} style={{ display: "inline", verticalAlign: "middle" }} /> {formatViews(item.view_count)}
                    </span>
                    <span className="badge badge-lime">{item.outlier_score}x outlier</span>
                    <span>{item.platform}</span>
                  </div>
                  <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem", flexWrap: "wrap" }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push("/editor")}>
                      Use in editor
                    </button>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                        <ExternalLink size={12} /> Open source
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <TrendingUp size={32} style={{ color: "var(--muted)", marginBottom: ".75rem" }} />
          <p style={{ color: "var(--muted)" }}>
            Trending discovery will later widen the signal pool, but the editor-centered flow already works with
            watchlists, outliers, and saved references today.
          </p>
        </div>
      )}
    </div>
  );
}
