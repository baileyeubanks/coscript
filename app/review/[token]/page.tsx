"use client";

import { useState, useEffect, use } from "react";
import { Check, X, MessageSquare, Send, Loader2, AlertTriangle } from "lucide-react";

interface ReviewBranding {
  logo_url?: string;
  primary_color?: string;
  company_name?: string;
}

interface ScriptData {
  id: string;
  title: string;
  content: string;
  hook: string;
  script_type: string;
  tone: string;
  platform: string;
  score: number;
  status: string;
}

interface Decision {
  id: string;
  decision: string;
  comment: string;
  created_at: string;
}

interface Comment {
  id: string;
  author_name: string;
  body: string;
  line_number: number | null;
  is_external: boolean;
  created_at: string;
}

export default function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [script, setScript] = useState<ScriptData | null>(null);
  const [branding, setBranding] = useState<ReviewBranding>({});
  const [permissions, setPermissions] = useState("view");
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Decision state
  const [showDecision, setShowDecision] = useState(false);
  const [decisionType, setDecisionType] = useState<"approved" | "changes_requested">("approved");
  const [decisionComment, setDecisionComment] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Comment state
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/reviews/${token}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Unable to load review");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setScript(data.script);
      setBranding(data.branding || {});
      setPermissions(data.permissions);
      setDecisions(data.decisions || []);

      // Fetch comments
      const commentsRes = await fetch(`/api/reviews/${token}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  async function submitDecision() {
    setSubmittingDecision(true);
    const res = await fetch(`/api/reviews/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: decisionType, comment: decisionComment }),
    });
    if (res.ok) {
      const data = await res.json();
      setDecisions([data.decision, ...decisions]);
      setShowDecision(false);
      setDecisionComment("");
    }
    setSubmittingDecision(false);
  }

  async function postComment() {
    if (!newComment.trim()) return;
    setPostingComment(true);
    const res = await fetch(`/api/reviews/${token}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newComment.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments([...comments, data.comment]);
      setNewComment("");
    }
    setPostingComment(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <Loader2 size={32} className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", flexDirection: "column", gap: "1rem" }}>
        <AlertTriangle size={48} style={{ color: "var(--orange)" }} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{error}</h2>
        <p style={{ color: "var(--muted)" }}>This review link may have expired or been revoked.</p>
      </div>
    );
  }

  if (!script) return null;

  const accentColor = branding.primary_color || "var(--accent)";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header
        style={{
          padding: "1rem 2rem",
          borderBottom: "1px solid var(--line)",
          background: "var(--surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {branding.logo_url ? (
            <img src={branding.logo_url} alt="" style={{ height: 32, borderRadius: 4 }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.8rem", color: "#0f172a" }}>
              {(branding.company_name || "C").charAt(0)}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{script.title}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
              {branding.company_name && `${branding.company_name} \u2022 `}
              Script Review
            </div>
          </div>
        </div>

        {permissions === "approve" && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn btn-sm"
              style={{ background: "var(--green)", color: "#fff" }}
              onClick={() => { setDecisionType("approved"); setShowDecision(true); }}
            >
              <Check size={14} /> Approve
            </button>
            <button
              className="btn btn-sm"
              style={{ background: "var(--orange)", color: "#fff" }}
              onClick={() => { setDecisionType("changes_requested"); setShowDecision(true); }}
            >
              <X size={14} /> Request Changes
            </button>
          </div>
        )}
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Script content */}
        <div style={{ padding: "2rem" }}>
          {script.hook && (
            <div style={{ padding: "1rem", background: `${accentColor}11`, border: `1px solid ${accentColor}33`, borderRadius: "var(--radius-sm)", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: accentColor, textTransform: "uppercase" }}>Hook</span>
              <p style={{ fontSize: "1rem", fontWeight: 600, marginTop: "0.25rem" }}>{script.hook}</p>
            </div>
          )}

          <div style={{ fontSize: "0.95rem", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {script.content.split("\n").map((line, i) => (
              <div key={i} style={{ display: "flex", gap: "1rem", padding: "0.125rem 0" }}>
                <span style={{ color: "var(--muted)", fontSize: "0.75rem", minWidth: 24, textAlign: "right", userSelect: "none", paddingTop: "0.125rem" }}>
                  {i + 1}
                </span>
                <span>{line || "\u00A0"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: comments + decisions */}
        <div style={{ borderLeft: "1px solid var(--line)", display: "flex", flexDirection: "column" }}>
          {/* Decisions */}
          {decisions.length > 0 && (
            <div style={{ padding: "1rem", borderBottom: "1px solid var(--line)" }}>
              <h4 style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>Decisions</h4>
              {decisions.map((d) => (
                <div key={d.id} style={{ padding: "0.5rem", background: "var(--bg)", borderRadius: "var(--radius-sm)", marginBottom: "0.375rem" }}>
                  <span className={`badge ${d.decision === "approved" ? "badge-green" : "badge-orange"}`}>
                    {d.decision === "approved" ? "Approved" : "Changes Requested"}
                  </span>
                  {d.comment && <p style={{ fontSize: "0.8rem", marginTop: "0.25rem", color: "var(--muted)" }}>{d.comment}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Comments */}
          <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
            <h4 style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <MessageSquare size={14} /> Comments
            </h4>
            {comments.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>No comments yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ padding: "0.625rem", background: "var(--bg)", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: 600 }}>
                        {c.author_name}
                        {c.is_external && <span style={{ color: "var(--orange)", marginLeft: "0.25rem" }}>(external)</span>}
                      </span>
                      <span style={{ color: "var(--muted)" }}>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>{c.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comment input */}
          {permissions !== "view" && (
            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--line)", display: "flex", gap: "0.5rem" }}>
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={(e) => e.key === "Enter" && postComment()}
              />
              <button className="btn btn-primary btn-sm" onClick={postComment} disabled={postingComment}>
                {postingComment ? <Loader2 size={14} className="spinner" /> : <Send size={14} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal */}
      {showDecision && (
        <div className="modal-backdrop" onClick={() => setShowDecision(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
              {decisionType === "approved" ? "Approve Script" : "Request Changes"}
            </h3>
            <textarea
              value={decisionComment}
              onChange={(e) => setDecisionComment(e.target.value)}
              placeholder={decisionType === "approved" ? "Any final notes? (optional)" : "What changes are needed?"}
              rows={4}
              style={{ width: "100%", resize: "none", marginBottom: "1rem" }}
            />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDecision(false)}>Cancel</button>
              <button
                className="btn btn-sm"
                style={{ background: decisionType === "approved" ? "var(--green)" : "var(--orange)", color: "#fff" }}
                onClick={submitDecision}
                disabled={submittingDecision}
              >
                {submittingDecision ? <Loader2 size={14} className="spinner" /> : null}
                {decisionType === "approved" ? "Approve" : "Request Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
