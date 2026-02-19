"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import { SortableEvidenceItem } from "./SortableEvidenceItem";

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
  const [reordering, setReordering] = useState(false);

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const canReorder =
    canEdit &&
    !typeFilter &&
    !tagFilter &&
    !onlyPendingJobs &&
    evidence.length > 1;

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = evidence.findIndex((e) => e.id === active.id);
      const newIndex = evidence.findIndex((e) => e.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const next = [...evidence];
      const [removed] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, removed);
      const orderedIds = next.map((e) => e.id);
      setReordering(true);
      try {
        const res = await fetch(`/api/cases/${caseId}/evidence/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds }),
        });
        if (res.ok) {
          setEvidence(next);
          toast.success("Ordem atualizada.");
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error ?? "Erro ao reordenar");
          fetchEvidence();
        }
      } catch {
        toast.error("Erro ao reordenar");
        fetchEvidence();
      } finally {
        setReordering(false);
      }
    },
    [caseId, evidence, fetchEvidence]
  );

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
        {canEdit && (typeFilter || tagFilter || onlyPendingJobs) && evidence.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Remova os filtros para reordenar a timeline.
          </span>
        )}
      </div>
      <div className="space-y-3">
        {evidence.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma evidência ainda.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={evidence.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
              disabled={reordering}
            >
              {evidence.map((e) => (
                <SortableEvidenceItem
                  key={e.id}
                  evidence={e}
                  baseUrl={baseUrl}
                  canEdit={canEdit}
                  reorderEnabled={canReorder}
                  onTranscriptSaved={fetchEvidence}
                  onEvidenceUpdated={fetchEvidence}
                  onEvidenceDeleted={fetchEvidence}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
