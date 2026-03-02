"use client";

import { useState, useEffect } from "react";
import { GitCompare, Loader2 } from "lucide-react";
import VersionList from "./VersionList";
import VersionDiff from "./VersionDiff";

interface Version {
  id: string;
  version_number: number;
  content: string;
  score: number;
  created_at: string;
}

interface DiffChange {
  value: string;
  added: boolean;
  removed: boolean;
}

interface VersionCompareProps {
  versions: Version[];
  onRestore: (version: Version) => void;
}

export default function VersionCompare({ versions, onRestore }: VersionCompareProps) {
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  const [diff, setDiff] = useState<DiffChange[] | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareData, setCompareData] = useState<{
    version_a: { version_number: number; score: number };
    version_b: { version_number: number; score: number };
  } | null>(null);

  useEffect(() => {
    if (!selectedA || !selectedB || selectedA === selectedB) {
      setDiff(null);
      setCompareData(null);
      return;
    }

    setComparing(true);
    fetch("/api/versions/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version_a: selectedA, version_b: selectedB }),
    })
      .then((r) => r.json())
      .then((data) => {
        setDiff(data.diff || []);
        setCompareData({
          version_a: data.version_a,
          version_b: data.version_b,
        });
      })
      .catch(() => {
        setDiff(null);
        setCompareData(null);
      })
      .finally(() => setComparing(false));
  }, [selectedA, selectedB]);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <VersionList
        versions={versions}
        selectedA={selectedA}
        selectedB={selectedB}
        onSelectA={setSelectedA}
        onSelectB={setSelectedB}
        onRestore={onRestore}
      />

      {selectedA && selectedB && selectedA !== selectedB && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <GitCompare size={16} style={{ color: "var(--accent)" }} />
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700 }}>Comparison</h3>
            {comparing && <Loader2 size={14} className="spinner" style={{ color: "var(--muted)" }} />}
          </div>

          {diff && compareData && (
            <VersionDiff
              diff={diff}
              versionA={compareData.version_a}
              versionB={compareData.version_b}
            />
          )}
        </div>
      )}
    </div>
  );
}
