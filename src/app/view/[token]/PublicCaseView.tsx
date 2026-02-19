"use client";

import { useState, useMemo } from "react";
import { PublicEvidenceCard } from "@/components/case/PublicEvidenceCard";

type CaseData = {
  id: string;
  title: string;
  description: string | null;
  peopleInvolved: string | null;
  status: string;
};

type EvidenceData = {
  id: string;
  type: string;
  fileName: string | null;
  notes: string | null;
  capturedAt: string | null;
  createdAt: string;
  transcriptText: string | null;
  ocrText: string | null;
  viewUrl: string;
  tags: { id: string; name: string }[];
  jobs: { id: string; jobType: string; status: string }[];
};

type FactData = {
  id: string;
  title: string;
  description: string | null;
  evidenceIds: string[];
};

type Props = {
  initialData: {
    case: CaseData;
    evidence: EvidenceData[];
    facts: FactData[];
    tags: { id: string; name: string }[];
  };
};

export function PublicCaseView({ initialData }: Props) {
  const [typeFilter, setTypeFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const filteredEvidence = useMemo(() => {
    let list = initialData.evidence;
    if (typeFilter) list = list.filter((e) => e.type === typeFilter);
    if (tagFilter)
      list = list.filter((e) => e.tags.some((t) => t.id === tagFilter));
    return list;
  }, [initialData.evidence, typeFilter, tagFilter]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{initialData.case.title}</h1>
        {initialData.case.description && (
          <p className="mt-1 text-muted-foreground">
            {initialData.case.description}
          </p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Pessoas envolvidas: {initialData.case.peopleInvolved ?? "—"} · Status:{" "}
          {initialData.case.status}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="font-medium">Timeline de evidências</h2>
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
              {initialData.tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {filteredEvidence.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma evidência para exibir.
              </p>
            ) : (
              filteredEvidence.map((e) => (
                <PublicEvidenceCard key={e.id} evidence={e} />
              ))
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="font-medium">Fatos</h2>
          {initialData.facts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum fato registrado.
            </p>
          ) : (
            <ul className="space-y-3">
              {initialData.facts.map((f) => (
                <li key={f.id} className="border-b pb-2 last:border-0">
                  <span className="font-medium">{f.title}</span>
                  {f.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {f.description}
                    </p>
                  )}
                  {f.evidenceIds.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {f.evidenceIds.length} evidência(s) vinculada(s)
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
