"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

const ACCEPT = "image/*,audio/ogg,audio/mpeg,audio/mp4,audio/x-m4a,.ogg,.mp3,.m4a";

type Props = {
  caseId: string;
  onUploaded?: () => void;
};

export function EvidenceUploader({ caseId, onUploaded }: Props) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = useCallback(
    async (file: File) => {
      const isImage = file.type.startsWith("image/");
      const isAudio =
        file.type.startsWith("audio/") ||
        /\.(ogg|mp3|m4a)$/i.test(file.name);
      const type = isImage ? "image" : isAudio ? "audio" : null;
      if (!type) {
        toast.error("Tipo não suportado. Use imagem ou áudio.");
        return;
      }

      setLoading(true);
      setProgress(10);
      try {
        const createRes = await fetch("/api/evidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId,
            type,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
          }),
        });
        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({}));
          throw new Error(err.error ?? "Erro ao criar evidência");
        }
        const evidence = await createRes.json();
        setProgress(50);

        const form = new FormData();
        form.append("file", file);
        const uploadRes = await fetch(`/api/evidence/${evidence.id}/upload`, {
          method: "POST",
          body: form,
        });
        if (!uploadRes.ok) throw new Error("Erro no upload");
        setProgress(100);
        toast.success("Evidência adicionada.");
        onUploaded?.();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao enviar");
      } finally {
        setLoading(false);
        setProgress(0);
      }
    },
    [caseId, onUploaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );
  const onInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-6 text-center transition-colors hover:border-muted-foreground/50"
    >
      <input
        type="file"
        accept={ACCEPT}
        onChange={onInput}
        disabled={loading}
        className="hidden"
        id="evidence-upload"
      />
      <label htmlFor="evidence-upload" className="cursor-pointer">
        <p className="text-sm text-muted-foreground">
          Arraste uma imagem ou áudio aqui ou clique para selecionar
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Imagens e áudios (ogg, mp3, m4a)
        </p>
      </label>
      {loading && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
