"use client";

interface SkeletonProps {
  variant?: "card" | "row" | "text" | "score-ring" | "avatar";
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function Skeleton({ variant = "text", width, height, count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count });

  const styles: Record<string, React.CSSProperties> = {
    card: { width: width || "100%", height: height || 120, borderRadius: "var(--radius)" },
    row: { width: width || "100%", height: height || 40, borderRadius: "var(--radius-sm)" },
    text: { width: width || "80%", height: height || 16, borderRadius: 4 },
    "score-ring": { width: width || 64, height: height || 64, borderRadius: "50%" },
    avatar: { width: width || 32, height: height || 32, borderRadius: "50%" },
  };

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      {items.map((_, i) => (
        <div key={i} className="skeleton" style={styles[variant]} />
      ))}
    </div>
  );
}
