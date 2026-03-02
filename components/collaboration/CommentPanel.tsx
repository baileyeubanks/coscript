"use client";

import { useState } from "react";
import { MessageSquare, Send, Check, Loader2 } from "lucide-react";

interface Comment {
  id: string;
  author_name: string;
  body: string;
  line_number: number | null;
  status: string;
  is_external: boolean;
  created_at: string;
  replies?: Comment[];
}

interface CommentPanelProps {
  scriptId: string;
  comments: Comment[];
  loading: boolean;
  onRefresh: () => void;
}

export default function CommentPanel({ scriptId, comments, loading, onRefresh }: CommentPanelProps) {
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");

  async function handlePost() {
    if (!newComment.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/scripts/${scriptId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newComment.trim() }),
    });
    if (res.ok) {
      setNewComment("");
      onRefresh();
    }
    setPosting(false);
  }

  async function resolveComment(commentId: string) {
    await fetch(`/api/scripts/${scriptId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Resolved", parent_id: commentId }),
    });
    onRefresh();
  }

  const filtered = filter === "all"
    ? comments
    : comments.filter((c) => c.status === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--line)" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MessageSquare size={16} /> Comments
          {comments.length > 0 && (
            <span className="badge badge-blue">{comments.length}</span>
          )}
        </h3>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {(["all", "open", "resolved"] as const).map((f) => (
            <button
              key={f}
              className={`btn btn-ghost btn-sm ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
              style={{ fontSize: "0.7rem", color: filter === f ? "var(--accent)" : "var(--muted)" }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "0.75rem 1.25rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
            <Loader2 size={20} className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", textAlign: "center", padding: "2rem 0" }}>
            No comments yet. Add one below.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {filtered.map((c) => (
              <div key={c.id} className="card" style={{ padding: "0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>
                    {c.author_name}
                    {c.is_external && <span className="badge badge-orange" style={{ marginLeft: "0.375rem" }}>External</span>}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                {c.line_number && (
                  <span style={{ fontSize: "0.7rem", color: "var(--blue)" }}>Line {c.line_number}</span>
                )}
                <p style={{ fontSize: "0.85rem", lineHeight: 1.6, marginTop: "0.25rem" }}>{c.body}</p>

                {/* Replies */}
                {c.replies && c.replies.length > 0 && (
                  <div style={{ marginTop: "0.5rem", paddingLeft: "0.75rem", borderLeft: "2px solid var(--line)" }}>
                    {c.replies.map((r) => (
                      <div key={r.id} style={{ marginBottom: "0.375rem" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.75rem" }}>{r.author_name}</span>
                        <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{r.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {c.status === "open" && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => resolveComment(c.id)}
                    style={{ marginTop: "0.375rem", fontSize: "0.7rem" }}
                  >
                    <Check size={12} /> Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New comment input */}
      <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--line)", display: "flex", gap: "0.5rem" }}>
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          onKeyDown={(e) => e.key === "Enter" && handlePost()}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary btn-sm" onClick={handlePost} disabled={posting || !newComment.trim()}>
          {posting ? <Loader2 size={14} className="spinner" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}
