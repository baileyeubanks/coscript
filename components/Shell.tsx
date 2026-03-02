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
  Building2,
  LayoutTemplate,
  FolderOpen,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import QuickSearch from "./QuickSearch";
import KeyboardShortcuts from "./KeyboardShortcuts";

const NAV = [
  { href: "/", label: "Studio", icon: LayoutDashboard },
  { href: "/scripts", label: "Scripts", icon: FileText },
  { href: "/editor", label: "New Script", icon: PenTool },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/research", label: "Research", icon: Search },
  { href: "/vault", label: "Vault", icon: Archive },
  { href: "/frameworks", label: "Frameworks", icon: BookOpen },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const sidebar = (
    <>
      <div
        style={{
          padding: collapsed ? "1.25rem 0.5rem" : "1.25rem 1rem",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--accent)",
            boxShadow: "0 0 0 4px var(--accent-dim)",
            flexShrink: 0,
          }}
        />
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Co-Script</span>
        )}
      </div>

      {!collapsed && (
        <button
          onClick={() => { router.push("/editor"); setMobileOpen(false); }}
          className="btn btn-primary btn-sm"
          style={{ margin: "0.75rem 1rem 0" }}
        >
          <Plus size={14} /> New Script
        </button>
      )}

      <nav style={{ flex: 1, padding: "0.75rem 0.5rem", overflowY: "auto" }}>
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: collapsed ? "0.5rem" : "0.5rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                marginBottom: "0.125rem",
                fontSize: "0.85rem",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--accent)" : "var(--muted)",
                background: active ? "var(--accent-dim)" : "transparent",
                justifyContent: collapsed ? "center" : "flex-start",
                transition: "all 0.15s",
              }}
            >
              <item.icon size={18} />
              {!collapsed && item.label}
            </a>
          );
        })}
      </nav>

      <div style={{ padding: "0.75rem 0.5rem", borderTop: "1px solid var(--line)" }}>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: collapsed ? "0.5rem" : "0.5rem 0.75rem",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem",
            color: "var(--muted)",
            background: "transparent",
            width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <LogOut size={18} />
          {!collapsed && "Log out"}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="shell-collapse-btn"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.5rem",
            borderRadius: "var(--radius-sm)",
            color: "var(--muted)",
            background: "transparent",
            width: "100%",
            marginTop: "0.25rem",
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop sidebar */}
      <aside
        className="shell-sidebar"
        style={{
          width: collapsed ? 64 : 220,
          background: "var(--surface)",
          borderRight: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s",
          flexShrink: 0,
        }}
      >
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="shell-mobile-overlay" onClick={() => setMobileOpen(false)}>
          <aside
            className="shell-mobile-sidebar"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 260,
              background: "var(--surface)",
              borderRight: "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
              height: "100vh",
            }}
          >
            {sidebar}
          </aside>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Mobile topbar */}
        <div className="shell-mobile-topbar" style={{ display: "none" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Co-Script</span>
          <div style={{ width: 32 }} />
        </div>

        <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
      </div>

      {/* Global portals */}
      <QuickSearch />
      <KeyboardShortcuts />
    </div>
  );
}
