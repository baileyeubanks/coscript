"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ background: "#070f1c", color: "#edf3ff", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Something went wrong</h2>
          <p style={{ color: "#9caecc", marginBottom: "1rem" }}>{error.message}</p>
          <button onClick={reset} style={{ background: "#b5ff66", color: "#0d1b2d", border: "none", borderRadius: 999, padding: "0.6rem 1.2rem", fontWeight: 700, cursor: "pointer" }}>
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
