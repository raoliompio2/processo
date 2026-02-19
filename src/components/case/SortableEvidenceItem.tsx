"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EvidenceCard } from "./EvidenceCard";
import { GripVertical } from "lucide-react";

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

type Props = {
  evidence: EvidenceWithRelations;
  baseUrl: string;
  canEdit: boolean;
  reorderEnabled?: boolean;
  onTranscriptSaved?: () => void;
  onEvidenceUpdated?: () => void;
  onEvidenceDeleted?: () => void;
};

export function SortableEvidenceItem({
  evidence,
  baseUrl,
  canEdit,
  reorderEnabled = false,
  onTranscriptSaved,
  onEvidenceUpdated,
  onEvidenceDeleted,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: evidence.id,
    disabled: !reorderEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-start gap-2 rounded-lg border bg-card transition-shadow ${isDragging ? "z-50 opacity-90 shadow-lg" : ""}`}
    >
      {canEdit && reorderEnabled && (
        <button
          type="button"
          className="mt-3 touch-none cursor-grab rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label="Arrastar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <EvidenceCard
          evidence={evidence as unknown as Parameters<typeof EvidenceCard>[0]["evidence"]}
          baseUrl={baseUrl}
          canEdit={canEdit}
          onTranscriptSaved={onTranscriptSaved}
          onEvidenceUpdated={onEvidenceUpdated}
          onEvidenceDeleted={onEvidenceDeleted}
        />
      </div>
    </div>
  );
}
