"use client";

import { useState } from "react";
import Image from "next/image";

type PublicEvidence = {
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

type Props = { evidence: PublicEvidence };

export function PublicEvidenceCard({ evidence }: Props) {
  const [showZoom, setShowZoom] = useState(false);
  const rawDate = evidence.capturedAt ?? evidence.createdAt;
  const date =
    typeof rawDate === "string"
      ? rawDate
      : new Date(rawDate).toISOString().slice(0, 19).replace("T", " ");

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          {date} — {evidence.type} {evidence.fileName && `· ${evidence.fileName}`}
        </p>
        {evidence.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {evidence.tags.map((t) => (
              <span
                key={t.id}
                className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
        {evidence.notes && (
          <p className="mt-1 text-sm text-muted-foreground">{evidence.notes}</p>
        )}
      </div>

      {evidence.type === "image" && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowZoom(true)}
            className="relative block aspect-video w-full overflow-hidden rounded-md border"
          >
            <Image
              src={evidence.viewUrl}
              alt={evidence.fileName ?? "Evidência"}
              fill
              className="object-contain"
              unoptimized
            />
          </button>
          {evidence.ocrText && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {evidence.ocrText}
            </p>
          )}
        </div>
      )}

      {evidence.type === "audio" && (
        <div className="mt-2">
          <audio controls className="w-full" src={evidence.viewUrl}>
            Áudio não suportado.
          </audio>
          {evidence.transcriptText && (
            <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
              {evidence.transcriptText}
            </p>
          )}
        </div>
      )}

      {evidence.type === "text" && (
        <div className="mt-2 rounded border bg-muted/30 p-2 text-sm">
          {evidence.transcriptText || evidence.ocrText || "—"}
        </div>
      )}

      {showZoom && evidence.type === "image" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowZoom(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setShowZoom(false)}
          aria-label="Fechar"
        >
          <Image
            src={evidence.viewUrl}
            alt={evidence.fileName ?? "Evidência"}
            width={1200}
            height={800}
            className="max-h-full max-w-full object-contain"
            unoptimized
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
