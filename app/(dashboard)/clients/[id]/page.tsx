"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Trash2, FileText } from "lucide-react";
import BrandVaultEditor from "@/components/BrandVaultEditor";

interface Client {
  id: string;
  name: string;
  industry: string;
  website: string;
  logo_url: string;
  colors: Record<string, string>;
}

interface Script {
  id: string;
  title: string;
  script_type: string;
  status: string;
  score: number;
  updated_at: string;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "brand" | "scripts">("overview");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editWebsite, setEditWebsite] = useState("");

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.client) {
          setClient(data.client);
          setEditName(data.client.name);
          setEditIndustry(data.client.industry || "");
          setEditWebsite(data.client.website || "");
        }
      })
      .catch((err) => console.error("Failed to load client data:", err))
      .finally(() => setLoading(false));

    // Fetch scripts for this client
    fetch(`/api/scripts?client_id=${id}`)
      .then((r) => r.json())
      .then((data) => setScripts(data.scripts || []))
      .catch((err) => console.error("Failed to load client data:", err));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, industry: editIndustry, website: editWebsite }),
    });
    if (res.ok) {
      const data = await res.json();
      setClient(data.client);
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this client and all associated data?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    router.push("/clients");
  }

  const scoreClass = (s: number) => (s >= 80 ? "score-high" : s >= 50 ? "score-mid" : "score-low");

  if (loading) return <div style={{ padding: "2rem" }}><div className="skeleton" style={{ height: 400 }} /></div>;
  if (!client) return <div style={{ padding: "2rem", color: "var(--muted)" }}>Client not found</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: 900 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => router.push("/clients")} style={{ marginBottom: "1rem" }}>
        <ArrowLeft size={14} /> Back to Clients
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-sm)",
            background: client.colors?.primary || "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#0f172a",
          }}>
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>{client.name}</h1>
            <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>
              {client.industry && <span className="badge badge-blue">{client.industry}</span>}
              <span>{scripts.length} scripts</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(!editing)}>Edit</button>
          <button className="btn btn-ghost btn-sm" onClick={handleDelete} style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="tab-bar" style={{ marginBottom: "1.5rem" }}>
        <button className={`tab ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>Overview</button>
        <button className={`tab ${tab === "brand" ? "active" : ""}`} onClick={() => setTab("brand")}>Brand Vault</button>
        <button className={`tab ${tab === "scripts" ? "active" : ""}`} onClick={() => setTab("scripts")}>Scripts ({scripts.length})</button>
      </div>

      {tab === "overview" && (
        <div className="card" style={{ padding: "1.25rem" }}>
          {editing ? (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>Industry</label>
                <input value={editIndustry} onChange={(e) => setEditIndustry(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>Website</label>
                <input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 size={14} className="spinner" /> : <Save size={14} />} Save
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "0.5rem", fontSize: "0.85rem" }}>
              <div><span style={{ color: "var(--muted)" }}>Name:</span> {client.name}</div>
              <div><span style={{ color: "var(--muted)" }}>Industry:</span> {client.industry || "\u2014"}</div>
              <div><span style={{ color: "var(--muted)" }}>Website:</span> {client.website || "\u2014"}</div>
            </div>
          )}
        </div>
      )}

      {tab === "brand" && <BrandVaultEditor clientId={id} />}

      {tab === "scripts" && (
        <div>
          {scripts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
              <FileText size={32} style={{ opacity: 0.3, margin: "0 auto 0.75rem" }} />
              <p style={{ fontSize: "0.85rem" }}>No scripts for this client yet</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {scripts.map((s) => (
                <div
                  key={s.id}
                  className="card"
                  onClick={() => router.push(`/scripts/${s.id}`)}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1.25rem", cursor: "pointer" }}
                >
                  <div className={`score-ring ${scoreClass(s.score)}`} style={{ width: 36, height: 36, fontSize: "0.75rem" }}>
                    {s.score || "\u2014"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{s.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                      {s.script_type.replace(/_/g, " ")} &middot; {s.status}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                    {new Date(s.updated_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
