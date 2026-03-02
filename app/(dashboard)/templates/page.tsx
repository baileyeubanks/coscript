"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Plus } from "lucide-react";
import TemplateCard from "@/components/TemplateCard";
import TemplatePreview from "@/components/TemplatePreview";
import TemplateVariableForm from "@/components/TemplateVariableForm";

interface Template {
  id: string;
  name: string;
  category: string;
  industry: string;
  platform: string;
  description: string;
  structure: string[];
  example_content: string;
  prompt_instructions: string;
  variables: { name: string; label: string; placeholder: string }[];
  is_system: boolean;
}

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "video_script", label: "Video Script" },
  { value: "social_media", label: "Social Media" },
  { value: "ad_copy", label: "Ad Copy" },
  { value: "email", label: "Email" },
  { value: "blog", label: "Blog" },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [generateTemplate, setGenerateTemplate] = useState<Template | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("q", search);

    fetch(`/api/templates?${params}`)
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, search]);

  function handleUseTemplate(template: Template) {
    if (template.variables && template.variables.length > 0) {
      setGenerateTemplate(template);
    } else {
      // No variables — go straight to editor with template
      router.push(`/editor?template=${template.id}`);
    }
  }

  function handleGenerated(content: string) {
    // Navigate to editor with generated content
    const encoded = encodeURIComponent(content);
    router.push(`/editor?generated=${encoded}`);
    setGenerateTemplate(null);
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={24} style={{ color: "var(--accent)" }} /> Templates
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Start from proven structures and customize
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => router.push("/editor")}>
          <Plus size={14} /> Custom Template
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            style={{ paddingLeft: "2rem" }}
          />
        </div>
        <div className="tab-bar" style={{ flexShrink: 0 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={`tab ${category === c.value ? "active" : ""}`}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}
        </div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
          <FileText size={40} style={{ opacity: 0.3, margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "0.9rem" }}>No templates found</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onUse={() => handleUseTemplate(t)}
              onPreview={() => setPreviewTemplate(t)}
            />
          ))}
        </div>
      )}

      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onStart={() => {
            setPreviewTemplate(null);
            handleUseTemplate(previewTemplate);
          }}
        />
      )}

      {generateTemplate && (
        <TemplateVariableForm
          templateId={generateTemplate.id}
          templateName={generateTemplate.name}
          variables={generateTemplate.variables || []}
          onGenerated={handleGenerated}
          onClose={() => setGenerateTemplate(null)}
        />
      )}
    </div>
  );
}
