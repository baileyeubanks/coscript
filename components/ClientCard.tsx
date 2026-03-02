"use client";

import { Building2, FileText, Palette } from "lucide-react";

interface ClientCardProps {
  client: {
    id: string;
    name: string;
    industry: string;
    website: string;
    logo_url: string;
    colors: Record<string, string>;
    has_brand_vault: boolean;
  };
  scriptCount?: number;
  onClick: () => void;
}

export default function ClientCard({ client, scriptCount, onClick }: ClientCardProps) {
  const primaryColor = client.colors?.primary || "var(--accent)";

  return (
    <div
      className="card"
      onClick={onClick}
      style={{ cursor: "pointer", padding: "1.25rem", transition: "border-color 0.15s" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
        {client.logo_url ? (
          <img
            src={client.logo_url}
            alt={client.name}
            style={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "var(--radius-sm)",
            background: primaryColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            fontWeight: 700,
            color: "#0f172a",
          }}>
            {client.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{client.name}</div>
          {client.industry && (
            <span className="badge badge-blue" style={{ fontSize: "0.65rem", marginTop: "0.25rem" }}>
              {client.industry}
            </span>
          )}
        </div>
        {client.colors?.primary && (
          <div style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: client.colors.primary,
            border: "2px solid var(--line)",
          }} />
        )}
      </div>

      <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "var(--muted)" }}>
        {scriptCount !== undefined && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <FileText size={12} /> {scriptCount} scripts
          </span>
        )}
        {client.has_brand_vault && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--accent)" }}>
            <Palette size={12} /> Brand Vault
          </span>
        )}
        {client.website && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <Building2 size={12} /> {new URL(client.website).hostname.replace("www.", "")}
          </span>
        )}
      </div>
    </div>
  );
}
