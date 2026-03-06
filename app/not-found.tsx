import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "4rem", fontWeight: 800, color: "var(--muted)", marginBottom: "0.5rem" }}>404</h1>
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>Page not found</p>
        <Link href="/" className="btn btn-primary" style={{ textDecoration: "none" }}>
          Back to Studio
        </Link>
      </div>
    </div>
  );
}
