"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ background: "#0c1322", color: "#edf3ff", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Something went wrong</h2>
          <p style={{ color: "#9cadc8", marginBottom: "1rem" }}>{error.message}</p>
          <button onClick={reset} style={{ background: "#102641", color: "#e8f1ff", border: "1px solid #3f618f", borderRadius: 999, padding: "0.625rem 1.25rem", fontWeight: 700, cursor: "pointer", fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
