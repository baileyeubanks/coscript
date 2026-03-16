"use client";

import { useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(false);
  const isEditorRoute = pathname.startsWith("/editor");
  const railCollapsed = isEditorRoute || collapsed || isMobile;

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const railStyles = isEditorRoute
    ? {
        background: "rgba(239, 231, 218, 0.96)",
        borderColor: "rgba(22, 22, 22, 0.08)",
        text: "rgba(22, 22, 22, 0.52)",
        active: "var(--signal)",
        activeBackground: "rgba(181, 82, 51, 0.08)",
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

  // Mobile: bottom tab bar
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <main style={{ flex: 1, overflow: "auto", paddingBottom: "3.5rem" }}>{children}</main>
        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            background: isEditorRoute
              ? "rgba(239, 231, 218, 0.98)"
              : "rgba(13, 23, 37, 0.98)",
            borderTop: `1px solid ${railStyles.borderColor}`,
            padding: "0.4rem 0 calc(0.4rem + env(safe-area-inset-bottom, 0px))",
            zIndex: 1000,
            backdropFilter: "blur(16px)",
          }}
        >
          {NAV.slice(0, 5).map((item) => {
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
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.15rem",
                  padding: "0.35rem 0.5rem",
                  borderRadius: "8px",
                  fontSize: "0.6rem",
                  fontWeight: active ? 700 : 500,
                  color: active ? railStyles.active : railStyles.text,
                  background: active ? railStyles.activeBackground : "transparent",
                  transition: "all 0.15s",
                }}
              >
                <item.icon size={18} />
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    );
  }

  // Desktop: left sidebar
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: isEditorRoute ? 52 : railCollapsed ? 56 : 200,
          background: railStyles.background,
          borderRight: `1px solid ${railStyles.borderColor}`,
          display: "flex",
          flexDirection: "column",
          transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: railCollapsed ? "0.85rem 0.45rem" : "1rem 0.85rem",
            borderBottom: `1px solid ${railStyles.borderColor}`,
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            justifyContent: railCollapsed ? "center" : "flex-start",
          }}
        >
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: isEditorRoute ? "var(--signal)" : "var(--accent)",
              boxShadow: isEditorRoute
                ? "0 0 0 3px rgba(181, 82, 51, 0.1)"
                : "0 0 0 3px var(--accent-dim)",
              flexShrink: 0,
            }}
          />
          {!railCollapsed && (
            <div style={{ display: "grid", gap: "0.08rem" }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "0.74rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase" as const,
                  color: isEditorRoute ? "var(--paper-ink)" : "var(--ink)",
                }}
              >
                co-script
              </span>
              <span style={{ fontSize: "0.62rem", color: railStyles.text }}>
                writing system
              </span>
            </div>
          )}
        </div>

        {!railCollapsed && !isEditorRoute && (
          <button
            onClick={() => router.push("/editor")}
            className="btn btn-primary btn-sm"
            style={{ margin: "0.65rem 0.65rem 0" }}
          >
            <Plus size={13} /> Open Editor
          </button>
        )}

        <nav style={{ flex: 1, padding: "0.65rem 0.4rem" }}>
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
                  gap: "0.55rem",
                  padding: railCollapsed ? "0.5rem" : "0.42rem 0.65rem",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "0.1rem",
                  fontSize: "0.8rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? railStyles.active : railStyles.text,
                  background: active ? railStyles.activeBackground : "transparent",
                  justifyContent: railCollapsed ? "center" : "flex-start",
                  transition: "all 0.15s",
                }}
                title={railCollapsed ? item.label : undefined}
              >
                <item.icon size={17} />
                {!railCollapsed && item.label}
              </a>
            );
          })}
        </nav>

        <div
          style={{
            padding: "0.55rem 0.4rem",
            borderTop: `1px solid ${railStyles.borderColor}`,
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
              padding: railCollapsed ? "0.5rem" : "0.42rem 0.65rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
              color: railStyles.text,
              background: "transparent",
              width: "100%",
              justifyContent: railCollapsed ? "center" : "flex-start",
            }}
            title={railCollapsed ? "Log out" : undefined}
          >
            <LogOut size={17} />
            {!railCollapsed && "Log out"}
          </button>
          {!isEditorRoute && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.4rem",
                borderRadius: "var(--radius-sm)",
                color: railStyles.text,
                background: "transparent",
                width: "100%",
                marginTop: "0.2rem",
              }}
            >
              {collapsed ? (
                <ChevronRight size={15} />
              ) : (
                <ChevronLeft size={15} />
              )}
            </button>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
    </div>
  );
}
