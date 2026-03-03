"use client";

import { useState, useEffect } from "react";
import { Building2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClientSummary {
  id: string;
  name: string;
  industry: string;
  logo_url: string | null;
  colors: { primary?: string } | null;
}

export default function ClientOverviewGrid() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients((data.clients || []).slice(0, 6)))
      .catch((err) => console.error("Failed to load clients overview:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: "1rem", textAlign: "center" }}><Loader2 size={16} className="spinner" /></div>;
  }

  if (clients.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
        No clients yet. Add your first client to get started.
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Building2 size={16} /> Clients
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.5rem" }}>
        {clients.map((c) => (
          <div
            key={c.id}
            onClick={() => router.push(`/clients/${c.id}`)}
            className="card"
            style={{ padding: "0.875rem", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              {c.logo_url ? (
                <img src={c.logo_url} alt="" style={{ width: 24, height: 24, borderRadius: 4 }} />
              ) : (
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  background: c.colors?.primary || "var(--accent-dim)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: c.colors?.primary ? "#fff" : "var(--accent)",
                }}>
                  {c.name.charAt(0)}
                </div>
              )}
              <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>{c.name}</span>
            </div>
            {c.industry && (
              <span className="badge badge-blue" style={{ fontSize: "0.6rem" }}>{c.industry}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
