"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Evidence, EvidenceJob, EvidenceTag, Tag } from "@prisma/client";

type EvidenceWithRelations = Evidence & {
  jobs: EvidenceJob[];
  tags: (EvidenceTag & { tag: Tag })[];
};

type Props = {
  evidence: EvidenceWithRelations;
  baseUrl: string;
  canEdit: boolean;
  onTranscriptSaved?: () => void;
  onEvidenceUpdated?: () => void;
  onEvidenceDeleted?: () => void;
};

export function EvidenceCard({
  evidence,
  baseUrl,
  canEdit,
  onTranscriptSaved,
  onEvidenceUpdated,
  onEvidenceDeleted,
}: Props) {
  const [showZoom, setShowZoom] = useState(false);
  const [showTranscriptEdit, setShowTranscriptEdit] = useState(false);
  const [showEditMeta, setShowEditMeta] = useState(false);
  const [transcriptDraft, setTranscriptDraft] = useState(evidence.transcriptText ?? "");
  const [savingTranscript, setSavingTranscript] = useState(false);
  const [notesDraft, setNotesDraft] = useState(evidence.notes ?? "");
  const [tagIdsDraft, setTagIdsDraft] = useState<string[]>(
    evidence.tags.map((t) => t.tag.id)
  );
  const [caseTags, setCaseTags] = useState<{ id: string; name: string }[]>([]);
  const [savingMeta, setSavingMeta] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const cid = typeof evidence.caseId === "string" ? evidence.caseId : "";
    if (cid && showEditMeta)
      fetch(`/api/tags?caseId=${cid}`)
        .then((r) => r.json())
        .then((d) => setCaseTags(Array.isArray(d) ? d : []))
        .catch(() => setCaseTags([]));
  }, [evidence.caseId, showEditMeta]);

  const transcriptionJob = evidence.jobs.find((j) => j.jobType === "transcription");
  const ocrJob = evidence.jobs.find((j) => j.jobType === "ocr");
  const rawDate = evidence.capturedAt ?? evidence.createdAt;
  const date =
    typeof rawDate === "string"
      ? rawDate
      : rawDate instanceof Date
        ? rawDate.toISOString()
        : new Date().toISOString();

  const saveTranscript = async () => {
    if (!transcriptionJob) return;
    setSavingTranscript(true);
    try {
      const res = await fetch(`/api/jobs/${transcriptionJob.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "done",
          transcript_text: transcriptDraft,
        }),
      });
      if (res.ok) {
        setShowTranscriptEdit(false);
        onTranscriptSaved?.();
      }
    } finally {
      setSavingTranscript(false);
    }
  };

  const saveNotesAndTags = async () => {
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/evidence/${evidence.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft || null, tagIds: tagIdsDraft }),
      });
      if (res.ok) {
        setShowEditMeta(false);
        onEvidenceUpdated?.();
      }
    } finally {
      setSavingMeta(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setTagIdsDraft((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleDeleteClick = () => setShowDeleteConfirm(true);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/evidence/${evidence.id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteConfirm(false);
        onEvidenceDeleted?.();
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {date} — {evidence.type} {evidence.fileName && `· ${evidence.fileName}`}
          </p>
          {evidence.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {evidence.tags.map((t) => (
                <span
                  key={t.tag.id}
                  className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
                >
                  {t.tag.name}
                </span>
              ))}
            </div>
          )}
          {evidence.notes && (
            <p className="mt-1 text-sm text-muted-foreground">{evidence.notes}</p>
          )}
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowEditMeta(true);
                setNotesDraft(evidence.notes ?? "");
                setTagIdsDraft(evidence.tags.map((t) => t.tag.id));
              }}
            >
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDeleteClick}
              disabled={deleting}
            >
              Excluir
            </Button>
          </div>
        )}
      </div>

      {evidence.type === "image" && evidence.blobUrl && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowZoom(true)}
            className="relative block aspect-video w-full overflow-hidden rounded-md border"
          >
            <Image
              src={evidence.blobUrl}
              alt={evidence.fileName ?? "Evidência"}
              fill
              className="object-contain"
              unoptimized
            />
          </button>
          {ocrJob && (
            <p className="mt-1 text-xs text-muted-foreground">
              OCR: {ocrJob.status}
              {evidence.ocrText && ` — ${evidence.ocrText.slice(0, 80)}…`}
            </p>
          )}
        </div>
      )}

      {evidence.type === "audio" && (
        <div className="mt-2">
          {evidence.blobUrl ? (
            <audio controls src={evidence.blobUrl} className="w-full" />
          ) : (
            <p className="text-sm text-muted-foreground">Arquivo ainda não enviado.</p>
          )}
          <div className="mt-2">
            {evidence.transcriptText ? (
              <p className="text-sm">{evidence.transcriptText}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Sem transcrição</p>
            )}
            {canEdit && transcriptionJob && (
              <Button
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={() => {
                  setShowTranscriptEdit(true);
                  setTranscriptDraft(evidence.transcriptText ?? "");
                }}
              >
                Editar transcrição
              </Button>
            )}
          </div>
          {transcriptionJob && (
            <p className="mt-1 text-xs text-muted-foreground">
              Status: {transcriptionJob.status}
            </p>
          )}
        </div>
      )}

      {showZoom && evidence.type === "image" && evidence.blobUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowZoom(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setShowZoom(false)}
            className="absolute right-4 top-4 text-white"
          >
            Fechar
          </button>
          <Image
            src={evidence.blobUrl}
            alt={evidence.fileName ?? "Zoom"}
            width={1200}
            height={800}
            className="max-h-full max-w-full object-contain"
            unoptimized
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showTranscriptEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-lg bg-background p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-medium">Editar transcrição</h3>
            <textarea
              value={transcriptDraft}
              onChange={(e) => setTranscriptDraft(e.target.value)}
              className="mt-2 min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Cole ou digite a transcrição..."
            />
            <div className="mt-3 flex gap-2">
              <Button onClick={saveTranscript} disabled={savingTranscript}>
                {savingTranscript ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" onClick={() => setShowTranscriptEdit(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEditMeta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowEditMeta(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-background p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-medium">Editar evidência</h3>
            <div className="mt-3 space-y-3">
              <div>
                <Label>Observações</Label>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className="mt-1 min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Notas sobre esta evidência..."
                />
              </div>
              <div>
                <Label>Tags</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {caseTags.map((t) => (
                    <label key={t.id} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={tagIdsDraft.includes(t.id)}
                        onChange={() => toggleTag(t.id)}
                        className="rounded border-input"
                      />
                      {t.name}
                    </label>
                  ))}
                  {caseTags.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Crie tags no painel lateral.
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={saveNotesAndTags} disabled={savingMeta}>
                {savingMeta ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" onClick={() => setShowEditMeta(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Excluir evidência"
        description="Excluir esta evidência? O arquivo será removido."
        confirmLabel="Excluir"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
