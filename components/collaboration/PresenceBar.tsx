"use client";

interface PresenceUser {
  user_id: string;
  email: string;
  color: string;
}

interface PresenceBarProps {
  users: PresenceUser[];
}

export default function PresenceBar({ users }: PresenceBarProps) {
  if (users.length <= 1) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
      {users.map((u) => (
        <div
          key={u.user_id}
          title={u.email}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: u.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.65rem",
            fontWeight: 700,
            color: "#fff",
            border: "2px solid var(--surface)",
            marginLeft: users.indexOf(u) > 0 ? "-6px" : 0,
          }}
        >
          {u.email.charAt(0).toUpperCase()}
        </div>
      ))}
      <span style={{ fontSize: "0.7rem", color: "var(--muted)", marginLeft: "0.375rem" }}>
        {users.length} editing
      </span>
    </div>
  );
}
