"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Building2 } from "lucide-react";
import ClientCard from "@/components/ClientCard";

interface Client {
  id: string;
  name: string;
  industry: string;
  website: string;
  logo_url: string;
  colors: Record<string, string>;
  has_brand_vault: boolean;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [newWebsite, setNewWebsite] = useState("");

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(data.clients || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!newName.trim()) return;
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, industry: newIndustry, website: newWebsite }),
    });
    if (res.ok) {
      const data = await res.json();
      setClients([...clients, { ...data.client, has_brand_vault: false }]);
      setShowAdd(false);
      setNewName("");
      setNewIndustry("");
      setNewWebsite("");
    }
  }

  const filtered = search
    ? clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.industry.toLowerCase().includes(search.toLowerCase()))
    : clients;

  return (
    <div style={{ padding: "2rem", maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Building2 size={24} style={{ color: "var(--accent)" }} /> Clients
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Manage client profiles and brand vaults
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Client
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem" }}>New Client</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Client name *" />
            <input value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} placeholder="Industry" />
            <input value={newWebsite} onChange={(e) => setNewWebsite(e.target.value)} placeholder="Website URL" />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-primary btn-sm" onClick={handleAdd}>Create</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            style={{ paddingLeft: "2rem" }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
          <Building2 size={40} style={{ opacity: 0.3, margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "0.9rem" }}>{search ? "No clients match your search" : "No clients yet"}</p>
          {!search && <p style={{ fontSize: "0.8rem" }}>Add your first client to start building brand vaults</p>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => router.push(`/clients/${client.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
