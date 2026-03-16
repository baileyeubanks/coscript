"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Lightbulb, PenTool, Search, Shapes, Sparkles } from "lucide-react";
import type { FrameworkRecord } from "@/lib/contracts";

type Framework = FrameworkRecord;

export default function FrameworksLibrary() {
  const router = useRouter();
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/frameworks")
      .then((response) => response.json())
      .then((data) => {
        const list = (data.frameworks ?? []).map((framework: Framework) => ({
          ...framework,
          structure:
            typeof framework.structure === "string"
              ? JSON.parse(framework.structure)
              : framework.structure,
        }));
        setFrameworks(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = ["all", ...Array.from(new Set(frameworks.map((framework) => framework.category)))];

  const filtered = frameworks.filter((framework) => {
    if (
      search &&
      !framework.name.toLowerCase().includes(search.toLowerCase()) &&
      !framework.description.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (category !== "all" && framework.category !== category) return false;
    return true;
  });

  const categoryIcon = (value: string) => {
    if (value === "hooks") return <Lightbulb size={14} />;
    if (value === "structure") return <Shapes size={14} />;
    return <Sparkles size={14} />;
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
          background: "linear-gradient(145deg, rgba(94, 106, 82, 0.08), rgba(255, 252, 247, 0.92))",
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <div
            style={{
              fontSize: ".72rem",
              letterSpacing: ".16em",
              textTransform: "uppercase" as const,
              fontWeight: 800,
              color: "var(--signal)",
              marginBottom: ".45rem",
            }}
          >
            Framework library
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: ".4rem" }}>
            Reusable hook and narrative systems for Co-Script.
          </h1>
          <p style={{ color: "var(--muted)", fontSize: ".9rem", lineHeight: 1.65 }}>
            Frameworks are support material, not a separate workflow. Use them to shape the hook, the story turn, and
            the proof stack inside the editor.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push("/editor")}>
          <PenTool size={16} /> Open editor
        </button>
      </div>

      <div style={{ display: "flex", gap: ".75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search
            size={16}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}
          />
          <input
            placeholder="Search frameworks..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
        <select value={category} onChange={(event) => setCategory(event.target.value)} style={{ width: "auto", minWidth: 150 }}>
          {categories.map((value) => (
            <option key={value} value={value}>
              {value === "all" ? "All categories" : value.charAt(0).toUpperCase() + value.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: ".75rem" }}>
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton" style={{ height: 120 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <BookOpen size={32} style={{ color: "var(--muted)", marginBottom: ".75rem" }} />
          <p style={{ color: "var(--muted)" }}>No frameworks match this search yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: ".75rem" }}>
          {filtered.map((framework) => (
            <div
              key={framework.id}
              className="card"
              style={{ cursor: "pointer" }}
              onClick={() => setExpanded(expanded === framework.id ? null : framework.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap", marginBottom: ".4rem" }}>
                    <span className={`badge ${framework.category === "hooks" ? "badge-lime" : "badge-blue"}`}>
                      {categoryIcon(framework.category)} {framework.category}
                    </span>
                    {framework.source && (
                      <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>Source: {framework.source}</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>{framework.name}</div>
                  <p style={{ fontSize: ".82rem", color: "var(--muted)", marginTop: ".25rem", lineHeight: 1.6 }}>
                    {framework.description}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push("/editor");
                  }}
                >
                  Use in editor
                </button>
              </div>

              {expanded === framework.id && (
                <div style={{ marginTop: "1rem", borderTop: "1px solid var(--line)", paddingTop: "1rem" }}>
                  <div style={{ marginBottom: ".85rem" }}>
                    <div
                      style={{
                        fontSize: ".72rem",
                        fontWeight: 800,
                        color: "var(--accent)",
                        textTransform: "uppercase" as const,
                        letterSpacing: ".08em",
                        marginBottom: ".45rem",
                      }}
                    >
                      Structure
                    </div>
                    <ol style={{ paddingLeft: "1.25rem", fontSize: ".84rem", lineHeight: 1.8, color: "var(--muted)" }}>
                      {(Array.isArray(framework.structure) ? framework.structure : []).map((step, index) => (
                        <li key={`${framework.id}-${index}`}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {framework.example && (
                    <div
                      style={{
                        padding: ".85rem",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--bg)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: ".72rem",
                          fontWeight: 800,
                          color: "var(--moss)",
                          textTransform: "uppercase" as const,
                          letterSpacing: ".08em",
                          marginBottom: ".35rem",
                        }}
                      >
                        Example usage
                      </div>
                      <div style={{ fontSize: ".84rem", color: "var(--muted)", lineHeight: 1.65, fontStyle: "italic" }}>
                        {framework.example}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
