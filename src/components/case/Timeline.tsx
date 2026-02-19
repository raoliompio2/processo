"use client";

import { useCallback, useEffect, useState } from "react";
import { EvidenceCard } from "./EvidenceCard";

type EvidenceWithRelations = {
  id: string;
  type: string;
  blobUrl: string | null;
  transcriptText: string | null;
  ocrText: string | null;
  fileName: string | null;
  notes: string | null;
  capturedAt: string | null;
  createdAt: string;
  jobs: { id: string; jobType: string; status: string }[];
  tags: { tag: { id: string; name: string } }[];
};

type Tag = { id: string; name: string };

type Props = {
  caseId: string;
  canEdit: boolean;
  refreshKey?: number;
};

export function Timeline({ caseId, canEdit, refreshKey }: Props) {
  const [evidence, setEvidence] = useState<EvidenceWithRelations[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [onlyPendingJobs, setOnlyPendingJobs] = useState(false);

  useEffect(() => {
    fetch(`/api/tags?caseId=${caseId}`)
      .then((r) => r.json())
      .then((data) => setTags(Array.isArray(data) ? data : []))
      .catch(() => setTags([]));
  }, [caseId, refreshKey]);

  const fetchEvidence = useCallback(() => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (tagFilter) params.set("tagId", tagFilter);
    if (onlyPendingJobs) params.set("onlyPendingJobs", "true");
    const url = `/api/cases/${caseId}/evidence?${params.toString()}`;
    return fetch(url)
      .then((r) => r.json())
      .then((data) => setEvidence(Array.isArray(data) ? data : []))
      .catch(() => setEvidence([]))
      .finally(() => setLoading(false));
  }, [caseId, typeFilter, tagFilter, onlyPendingJobs]);

  useEffect(() => {
    setLoading(true);
    fetchEvidence();
  }, [fetchEvidence, refreshKey]);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Filtrar:</span>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border bg-background px-2 py-1 text-sm"
        >
          <option value="">Tipo: todos</option>
          <option value="image">Imagem</option>
          <option value="audio">Áudio</option>
          <option value="text">Texto</option>
        </select>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="rounded-md border bg-background px-2 py-1 text-sm"
        >
          <option value="">Tag: todas</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyPendingJobs}
            onChange={(e) => setOnlyPendingJobs(e.target.checked)}
            className="rounded border-input"
          />
          Só pendentes (job)
        </label>
      </div>
      <div className="space-y-3">
        {evidence.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma evidência ainda.</p>
        ) : (
          evidence.map((e) => (
            <EvidenceCard
              key={e.id}
              evidence={e as unknown as Parameters<typeof EvidenceCard>[0]["evidence"]}
              baseUrl={baseUrl}
              canEdit={canEdit}
              onTranscriptSaved={fetchEvidence}
              onEvidenceUpdated={fetchEvidence}
              onEvidenceDeleted={fetchEvidence}
            />
          ))
        )}
      </div>
    </div>
  );
}
