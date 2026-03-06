"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { AuthSessionResponse } from "@/lib/contracts";
import { buildLoginPath, normalizeNextPath } from "@/lib/navigation";

function SignupPageContent() {
  const searchParams = useSearchParams();
  const nextPath = normalizeNextPath(searchParams.get("next"));

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
        // Ignore session probe failures on the disabled signup page.
      }
    }

    void hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [nextPath]);

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
          href={buildLoginPath(nextPath)}
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
          &larr; Back to sign in
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
            Account creation disabled
          </h1>
          <p
            style={{
              margin: "0 0 1.2rem",
              color: "#7a9bc4",
              fontSize: ".82rem",
              lineHeight: 1.5,
            }}
          >
            This pass is limited to one workspace owner login and does not allow self-serve signup.
          </p>

          <div
            style={{
              padding: ".85rem .95rem",
              borderRadius: 10,
              background: "rgba(107, 159, 212, 0.08)",
              border: "1px solid rgba(107, 159, 212, 0.2)",
              color: "#9ab9dd",
              fontSize: ".8rem",
              lineHeight: 1.6,
              marginBottom: "1rem",
            }}
          >
            Active workspace login:
            <br />
            <strong>bailey@contentco-op.com</strong>
          </div>

          <a
            href={buildLoginPath(nextPath)}
            style={{
              display: "inline-block",
              width: "100%",
              boxSizing: "border-box",
              textAlign: "center",
              background: "#6b9fd4",
              color: "#0c1322",
              border: "1px solid #6b9fd4",
              borderRadius: 999,
              padding: ".65rem 1.6rem",
              fontSize: ".74rem",
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase" as const,
              textDecoration: "none",
            }}
          >
            Return to sign in
          </a>
        </section>
      </div>
    </main>
  );
}

function SignupFallback() {
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
        <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>Loading sign-up…</h1>
        <p style={{ margin: ".6rem 0 0", color: "#7a9bc4", fontSize: ".82rem", lineHeight: 1.5 }}>
          Checking the current workspace session before rendering account creation.
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupPageContent />
    </Suspense>
  );
}
