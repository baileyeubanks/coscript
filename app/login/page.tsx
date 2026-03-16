"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import type { AuthSessionResponse } from "@/lib/contracts";
import { normalizeNextPath } from "@/lib/navigation";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const nextPath = normalizeNextPath(searchParams.get("next"));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (!res.ok) return;

        const data = (await res.json()) as AuthSessionResponse;
        if (!cancelled && data.authenticated) {
          window.location.replace(nextPath);
        }
      } catch {
        // Ignore session probe failures on the login page.
      }
    }

    void hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [nextPath]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }
      window.location.href = nextPath;
    } catch {
      setError("Connection error. Try again.");
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0c1322",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        <a
          href="https://contentco-op.com"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: ".4rem",
            fontSize: ".72rem",
            letterSpacing: ".1em",
            textTransform: "uppercase" as const,
            fontWeight: 600,
            color: "#5a7ea8",
            textDecoration: "none",
            marginBottom: "1.2rem",
          }}
        >
          &larr; contentco-op.com
        </a>

        <section
          style={{
            border: "1px solid #2b4263",
            borderRadius: 18,
            background: "linear-gradient(160deg, #101b2e, #0d1828)",
            padding: "2rem 1.6rem",
          }}
        >
          <div
            style={{
              fontSize: ".72rem",
              letterSpacing: ".18em",
              textTransform: "uppercase" as const,
              color: "#6b9fd4",
              fontWeight: 700,
            }}
          >
            co-script
          </div>
          <h1
            style={{
              margin: ".3rem 0 .4rem",
              fontSize: "1.4rem",
              color: "#edf3ff",
              letterSpacing: "-.02em",
              fontWeight: 700,
            }}
          >
            Sign in
          </h1>
          <p
            style={{
              margin: "0 0 1.2rem",
              color: "#7a9bc4",
              fontSize: ".82rem",
              lineHeight: 1.5,
            }}
          >
            Script generation from watchlists, outlier detection, and
            AI-powered writing for your Co-Script workspace.
          </p>

          <div
            style={{
              marginBottom: "1rem",
              padding: ".75rem .85rem",
              borderRadius: 10,
              border: "1px solid rgba(107, 159, 212, 0.2)",
              background: "rgba(107, 159, 212, 0.08)",
              color: "#9ab9dd",
              fontSize: ".78rem",
              lineHeight: 1.55,
            }}
          >
            Temporary access is limited to the current workspace owner.
            <br />
            <strong>Email:</strong> bailey@contentco-op.com
          </div>

          {error && (
            <div
              style={{
                color: "#de7676",
                fontSize: ".82rem",
                marginBottom: ".8rem",
                padding: ".5rem .75rem",
                borderRadius: 8,
                background: "rgba(222, 118, 118, 0.08)",
                border: "1px solid rgba(222, 118, 118, 0.2)",
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: ".7rem" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: ".28rem" }}>
              <label
                style={{
                  fontSize: ".68rem",
                  letterSpacing: ".1em",
                  textTransform: "uppercase" as const,
                  color: "#7a9bc4",
                  fontWeight: 700,
                }}
              >
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                defaultValue="bailey@contentco-op.com"
                autoComplete="email"
                style={{
                  border: "1px solid #325276",
                  borderRadius: 10,
                  background: "#0d1a2e",
                  color: "#e9f0ff",
                  padding: ".65rem .75rem",
                  fontSize: ".88rem",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 140ms ease",
                  width: "100%",
                  boxSizing: "border-box" as const,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#6b9fd4")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#325276")}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: ".28rem" }}>
              <label
                style={{
                  fontSize: ".68rem",
                  letterSpacing: ".1em",
                  textTransform: "uppercase" as const,
                  color: "#7a9bc4",
                  fontWeight: 700,
                }}
              >
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="Password"
                autoComplete="current-password"
                style={{
                  border: "1px solid #325276",
                  borderRadius: 10,
                  background: "#0d1a2e",
                  color: "#e9f0ff",
                  padding: ".65rem .75rem",
                  fontSize: ".88rem",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 140ms ease",
                  width: "100%",
                  boxSizing: "border-box" as const,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#6b9fd4")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#325276")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: ".4rem",
                background: "#6b9fd4",
                color: "#0c1322",
                border: "1px solid #6b9fd4",
                borderRadius: 999,
                padding: ".65rem 1.6rem",
                fontSize: ".74rem",
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase" as const,
                cursor: loading ? "wait" : "pointer",
                fontFamily: "inherit",
                transition: "opacity 140ms ease, transform 140ms ease",
                opacity: loading ? 0.6 : 1,
                width: "100%",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.opacity = "0.88";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = loading ? "0.6" : "1";
                e.currentTarget.style.transform = "none";
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p
            style={{
              margin: "1.2rem 0 0",
              textAlign: "center",
              fontSize: ".76rem",
              color: "#4a6888",
            }}
          >
            Google sign-in and self-serve account creation are disabled for this pass.
          </p>
        </section>
      </div>
    </main>
  );
}

function LoginFallback() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0c1322",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          border: "1px solid #2b4263",
          borderRadius: 18,
          background: "linear-gradient(160deg, #101b2e, #0d1828)",
          padding: "2rem 1.6rem",
          color: "#edf3ff",
        }}
      >
        <div
          style={{
            fontSize: ".72rem",
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "#6b9fd4",
            fontWeight: 700,
            marginBottom: ".45rem",
          }}
        >
          co-script
        </div>
        <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>Loading sign-in…</h1>
        <p style={{ margin: ".6rem 0 0", color: "#7a9bc4", fontSize: ".82rem", lineHeight: 1.5 }}>
          Checking the current workspace session before rendering auth controls.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
