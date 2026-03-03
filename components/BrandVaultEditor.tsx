"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Plus, X } from "lucide-react";

interface BrandVaultEditorProps {
  clientId: string;
}

interface BrandVault {
  voice_description: string;
  vocabulary: string[];
  hook_style: string;
  cta_patterns: string[];
  content_guidelines: string;
  tone_preferences: Record<string, string>;
  sample_scripts: string[];
  platform_notes: Record<string, string>;
}

const EMPTY_VAULT: BrandVault = {
  voice_description: "",
  vocabulary: [],
  hook_style: "",
  cta_patterns: [],
  content_guidelines: "",
  tone_preferences: {},
  sample_scripts: [],
  platform_notes: {},
};

export default function BrandVaultEditor({ clientId }: BrandVaultEditorProps) {
  const [vault, setVault] = useState<BrandVault>(EMPTY_VAULT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newVocab, setNewVocab] = useState("");
  const [newCta, setNewCta] = useState("");

  useEffect(() => {
    fetch(`/api/clients/${clientId}/brand`)
      .then((r) => r.json())
      .then((data) => {
        if (data.brand) setVault({ ...EMPTY_VAULT, ...data.brand });
      })
      .catch((err) => console.error("Failed to load brand vault:", err));
  }, [clientId]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/clients/${clientId}/brand`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vault),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  function addVocab() {
    if (newVocab.trim() && !vault.vocabulary.includes(newVocab.trim())) {
      setVault({ ...vault, vocabulary: [...vault.vocabulary, newVocab.trim()] });
      setNewVocab("");
    }
  }

  function removeVocab(word: string) {
    setVault({ ...vault, vocabulary: vault.vocabulary.filter((w) => w !== word) });
  }

  function addCta() {
    if (newCta.trim()) {
      setVault({ ...vault, cta_patterns: [...vault.cta_patterns, newCta.trim()] });
      setNewCta("");
    }
  }

  function removeCta(idx: number) {
    setVault({ ...vault, cta_patterns: vault.cta_patterns.filter((_, i) => i !== idx) });
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Brand Vault</h3>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}
          {saved ? "Saved!" : "Save"}
        </button>
      </div>

      <div>
        <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Brand Voice</label>
        <textarea
          value={vault.voice_description}
          onChange={(e) => setVault({ ...vault, voice_description: e.target.value })}
          placeholder="Describe the brand's voice and personality. e.g., Friendly but authoritative, uses simple language, avoids jargon..."
          rows={3}
          style={{ width: "100%", resize: "vertical" }}
        />
      </div>

      <div>
        <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Approved Vocabulary</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.5rem" }}>
          {vault.vocabulary.map((word) => (
            <span key={word} className="badge badge-lime" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              {word}
              <button onClick={() => removeVocab(word)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "inherit" }}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.375rem" }}>
          <input
            value={newVocab}
            onChange={(e) => setNewVocab(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVocab())}
            placeholder="Add word or phrase..."
            style={{ flex: 1 }}
          />
          <button className="btn btn-ghost btn-sm" onClick={addVocab}><Plus size={14} /></button>
        </div>
      </div>

      <div>
        <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Preferred Hook Style</label>
        <input
          value={vault.hook_style}
          onChange={(e) => setVault({ ...vault, hook_style: e.target.value })}
          placeholder="e.g., Question-based, Contrarian takes, Data-driven..."
        />
      </div>

      <div>
        <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>CTA Patterns</label>
        <div style={{ display: "grid", gap: "0.375rem", marginBottom: "0.5rem" }}>
          {vault.cta_patterns.map((cta, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ flex: 1, fontSize: "0.85rem", padding: "0.375rem 0.5rem", background: "var(--bg)", borderRadius: "var(--radius-sm)" }}>{cta}</span>
              <button onClick={() => removeCta(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.375rem" }}>
          <input
            value={newCta}
            onChange={(e) => setNewCta(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCta())}
            placeholder="e.g., Book a free strategy call..."
            style={{ flex: 1 }}
          />
          <button className="btn btn-ghost btn-sm" onClick={addCta}><Plus size={14} /></button>
        </div>
      </div>

      <div>
        <label style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "0.375rem" }}>Content Guidelines</label>
        <textarea
          value={vault.content_guidelines}
          onChange={(e) => setVault({ ...vault, content_guidelines: e.target.value })}
          placeholder="Any rules, restrictions, or preferences for content. e.g., Never mention competitors, Always include a disclaimer..."
          rows={3}
          style={{ width: "100%", resize: "vertical" }}
        />
      </div>
    </div>
  );
}
