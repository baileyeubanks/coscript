"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PenTool,
  Search,
  Archive,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

const NAV = [
  { href: "/editor", label: "Editor", icon: PenTool },
  { href: "/", label: "Workspace", icon: LayoutDashboard },
  { href: "/scripts", label: "Drafts", icon: FileText },
  { href: "/research", label: "Research", icon: Search },
  { href: "/vault", label: "Vault", icon: Archive },
  { href: "/frameworks", label: "Frameworks", icon: BookOpen },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const isEditorRoute = pathname.startsWith("/editor");
  const railCollapsed = isEditorRoute || collapsed;

  const railStyles = isEditorRoute
    ? {
        background: "rgba(239, 231, 218, 0.96)",
        borderColor: "rgba(22, 22, 22, 0.1)",
        text: "rgba(22, 22, 22, 0.62)",
        active: "var(--signal)",
        activeBackground: "rgba(181, 82, 51, 0.1)",
      }
    : {
        background: "var(--surface)",
        borderColor: "var(--line)",
        text: "var(--muted)",
        active: "var(--accent)",
        activeBackground: "var(--accent-dim)",
  };

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: isEditorRoute ? 56 : railCollapsed ? 64 : 220,
          background: railStyles.background,
          borderRight: `1px solid ${railStyles.borderColor}`,
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: railCollapsed ? "1rem 0.5rem" : "1.25rem 1rem",
            borderBottom: `1px solid ${railStyles.borderColor}`,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            justifyContent: railCollapsed ? "center" : "flex-start",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: isEditorRoute ? "var(--signal)" : "var(--accent)",
              boxShadow: isEditorRoute ? "0 0 0 4px rgba(181, 82, 51, 0.12)" : "0 0 0 4px var(--accent-dim)",
              flexShrink: 0,
            }}
          />
          {!railCollapsed && (
            <div style={{ display: "grid", gap: "0.12rem" }}>
              <span style={{ fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.12em", textTransform: "uppercase", color: isEditorRoute ? "var(--paper-ink)" : "var(--ink)" }}>
                co-script
              </span>
              <span style={{ fontSize: "0.7rem", color: railStyles.text }}>
                editor-first writing system
              </span>
            </div>
          )}
        </div>

        {!railCollapsed && !isEditorRoute && (
          <button
            onClick={() => router.push("/editor")}
            className="btn btn-primary btn-sm"
            style={{ margin: "0.75rem 1rem 0" }}
          >
            <Plus size={14} /> Open Editor
          </button>
        )}

        <nav style={{ flex: 1, padding: "0.75rem 0.5rem" }}>
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: railCollapsed ? "0.6rem" : "0.5rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "0.125rem",
                  fontSize: "0.85rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? railStyles.active : railStyles.text,
                  background: active ? railStyles.activeBackground : "transparent",
                  justifyContent: railCollapsed ? "center" : "flex-start",
                  transition: "all 0.15s",
                }}
                title={railCollapsed ? item.label : undefined}
              >
                <item.icon size={18} />
                {!railCollapsed && item.label}
              </a>
            );
          })}
        </nav>

        <div style={{ padding: "0.75rem 0.5rem", borderTop: `1px solid ${railStyles.borderColor}` }}>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: railCollapsed ? "0.6rem" : "0.5rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              color: railStyles.text,
              background: "transparent",
              width: "100%",
              justifyContent: railCollapsed ? "center" : "flex-start",
            }}
            title={railCollapsed ? "Log out" : undefined}
          >
            <LogOut size={18} />
            {!railCollapsed && "Log out"}
          </button>
          {!isEditorRoute && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.5rem",
                borderRadius: "var(--radius-sm)",
                color: railStyles.text,
                background: "transparent",
                width: "100%",
                marginTop: "0.25rem",
              }}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
    </div>
  );
}
