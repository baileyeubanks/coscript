"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ExternalLink, PenTool, Plus, Search, Tag, Trash2 } from "lucide-react";
import type { VaultItemRecord } from "@/lib/contracts";

type VaultItem = VaultItemRecord;

export default function VaultPage() {
  const router = useRouter();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/vault")
      .then((response) => response.json())
      .then((data) => {
        setItems(data.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function addItem() {
    if (!title.trim()) return;
    const response = await fetch("/api/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        source_url: sourceUrl,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        notes,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setItems([data.item, ...items]);
      setTitle("");
      setContent("");
      setSourceUrl("");
      setTags("");
      setNotes("");
      setShowAdd(false);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Remove from vault?")) return;
    await fetch(`/api/vault/${id}`, { method: "DELETE" });
    setItems(items.filter((item) => item.id !== id));
  }

  const filtered = items.filter((item) => {
    if (!search) return true;
    return (
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div style={{ padding: "2rem" }}>
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
          background: "linear-gradient(145deg, rgba(181, 82, 51, 0.07), rgba(255, 255, 255, 0.88))",
        }}
      >
        <div style={{ maxWidth: 760 }}>
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
            Reference vault
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: ".4rem" }}>
            Saved material for the next writing pass.
          </h1>
          <p style={{ color: "var(--muted)", fontSize: ".9rem", lineHeight: 1.65 }}>
            The vault holds hooks, references, and snippets that should be pulled into the editor when a draft needs
            more support, proof, or texture.
          </p>
        </div>
        <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={() => router.push("/editor")}>
            <PenTool size={16} /> Open editor
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add reference
          </button>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: "1.5rem" }}>
        <Search
          size={16}
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}
        />
        <input
          placeholder="Search by title or tag..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ paddingLeft: "2.25rem" }}
        />
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: "1rem", display: "grid", gap: ".6rem" }}>
          <input placeholder="Title *" value={title} onChange={(event) => setTitle(event.target.value)} />
          <textarea placeholder="Content or excerpt" value={content} onChange={(event) => setContent(event.target.value)} rows={4} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: ".5rem" }}>
            <input placeholder="Source URL (optional)" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} />
            <input placeholder="Tags (comma-separated)" value={tags} onChange={(event) => setTags(event.target.value)} />
          </div>
          <textarea placeholder="Notes for later use" value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-sm" onClick={addItem}>
              Save reference
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
            <div key={item} className="skeleton" style={{ height: 100 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <Archive size={32} style={{ color: "var(--muted)", marginBottom: ".75rem" }} />
          <p style={{ color: "var(--muted)" }}>
            {items.length === 0
              ? "The vault is empty. Save references here, then pull them into the editor as the draft sharpens."
              : "No references match this search."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {filtered.map((item) => (
            <div key={item.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: ".75rem", marginBottom: ".55rem" }}>
                <div style={{ fontWeight: 700, fontSize: ".92rem" }}>{item.title}</div>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteItem(item.id)} style={{ color: "var(--red)", padding: ".25rem" }}>
                  <Trash2 size={14} />
                </button>
              </div>

              {item.content && (
                <p
                  style={{
                    fontSize: ".81rem",
                    color: "var(--muted)",
                    lineHeight: 1.6,
                    marginBottom: ".6rem",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical" as const,
                  }}
                >
                  {item.content}
                </p>
              )}

              {item.tags.length > 0 && (
                <div style={{ display: "flex", gap: ".3rem", flexWrap: "wrap", marginBottom: ".65rem" }}>
                  {item.tags.map((tag) => (
                    <span key={tag} className="badge badge-blue">
                      <Tag size={10} /> {tag}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".75rem", fontSize: ".72rem", color: "var(--muted)" }}>
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                <div style={{ display: "flex", gap: ".45rem", flexWrap: "wrap" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => router.push("/editor")}>
                    Use in editor
                  </button>
                  {item.source_url && (
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                      <ExternalLink size={12} /> Source
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
