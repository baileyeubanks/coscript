"use client";

import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  industry: string;
}

interface ClientPickerProps {
  value: string | null;
  onChange: (clientId: string | null) => void;
  style?: React.CSSProperties;
}

export default function ClientPicker({ value, onChange, style }: ClientPickerProps) {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(data.clients || []))
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", ...style }}>
      <Building2 size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        style={{ width: "100%", fontSize: "0.8rem" }}
      >
        <option value="">No client</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
