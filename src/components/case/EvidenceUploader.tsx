"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Upload, FileImage, FileAudio, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACCEPT = "image/*,audio/ogg,audio/mpeg,audio/mp4,audio/x-m4a,.ogg,.mp3,.m4a";

type FileStatus = "pending" | "uploading" | "done" | "error";

type QueuedFile = {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
};

function getType(file: File): "image" | "audio" | null {
  const isImage = file.type.startsWith("image/");
  const isAudio =
    file.type.startsWith("audio/") || /\.(ogg|mp3|m4a)$/i.test(file.name);
  return isImage ? "image" : isAudio ? "audio" : null;
}

type Props = {
  caseId: string;
  onUploaded?: () => void;
};

export function EvidenceUploader({ caseId, onUploaded }: Props) {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processOne = useCallback(
    async (item: QueuedFile): Promise<void> => {
      const type = getType(item.file);
      if (!type) {
        setQueue((q) =>
          q.map((x) =>
            x.id === item.id
              ? { ...x, status: "error" as const, error: "Tipo não suportado" }
              : x
          )
        );
        return;
      }

      setQueue((q) =>
        q.map((x) => (x.id === item.id ? { ...x, status: "uploading" as const, progress: 10 } : x))
      );

      try {
        const createRes = await fetch("/api/evidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId,
            type,
            file_name: item.file.name,
            file_size: item.file.size,
            mime_type: item.file.type,
          }),
        });
        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({}));
          throw new Error(err.error ?? "Erro ao criar evidência");
        }
        const evidence = await createRes.json();

        setQueue((q) =>
          q.map((x) => (x.id === item.id ? { ...x, progress: 50 } : x))
        );

        const form = new FormData();
        form.append("file", item.file);
        const uploadRes = await fetch(`/api/evidence/${evidence.id}/upload`, {
          method: "POST",
          body: form,
        });
        if (!uploadRes.ok) throw new Error("Erro no upload");

        setQueue((q) =>
          q.map((x) =>
            x.id === item.id
              ? { ...x, status: "done" as const, progress: 100 }
              : x
          )
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao enviar";
        setQueue((q) =>
          q.map((x) =>
            x.id === item.id ? { ...x, status: "error" as const, error: msg } : x
          )
        );
      }
    },
    [caseId]
  );

  const processQueue = useCallback(async () => {
    const pending = queue.filter((x) => x.status === "pending");
    if (pending.length === 0) return;
    for (const item of pending) {
      await processOne(item);
    }
    toast.success(
      pending.length === 1 ? "Evidência adicionada." : "Upload concluído."
    );
    onUploaded?.();
  }, [queue, processOne, onUploaded]);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      const valid: QueuedFile[] = list
        .filter((file) => getType(file))
        .map((file) => ({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          status: "pending" as FileStatus,
          progress: 0,
        }));
      const invalidCount = list.length - valid.length;
      if (invalidCount > 0) {
        toast.error(
          `${invalidCount} arquivo(s) ignorado(s). Use imagens ou áudios (ogg, mp3, m4a).`
        );
      }
      if (valid.length) {
        setQueue((q) => [...q, ...valid]);
        toast.info(
          valid.length === 1
            ? "1 arquivo na fila. Clique em Enviar para enviar."
            : `${valid.length} arquivos na fila. Clique em Enviar para enviar.`
        );
      }
    },
    []
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.length) addFiles(files);
      e.target.value = "";
    },
    [addFiles]
  );

  const removeFromQueue = useCallback((id: string) => {
    setQueue((q) => q.filter((x) => x.id !== id));
  }, []);

  const clearDone = useCallback(() => {
    setQueue((q) => q.filter((x) => x.status !== "done" && x.status !== "error"));
  }, []);

  const pendingCount = queue.filter((x) => x.status === "pending").length;
  const hasPending = pendingCount > 0;

  return (
    <div className="space-y-4">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 bg-muted/30 hover:border-muted-foreground/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={onInput}
          className="hidden"
          id="evidence-upload-multi"
        />
        <label
          htmlFor="evidence-upload-multi"
          className="flex cursor-pointer flex-col items-center gap-2"
        >
          <div className="rounded-full bg-muted p-3">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Arraste vários arquivos ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground">
            Imagens e áudios (ogg, mp3, m4a) — múltiplos de uma vez
          </p>
        </label>
        {hasPending && (
          <div className="mt-4">
            <Button
              type="button"
              size="sm"
              onClick={processQueue}
              className="rounded-full"
            >
              Enviar {pendingCount} arquivo{pendingCount !== 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </div>

      {queue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Fila de envio</span>
            {(queue.some((x) => x.status === "done") ||
              queue.some((x) => x.status === "error")) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearDone}
              >
                Limpar concluídos
              </Button>
            )}
          </div>
          <ul className="space-y-2 rounded-lg border bg-card p-2">
            {queue.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-md border bg-background/50 px-3 py-2 text-sm"
              >
                {getType(item.file) === "image" ? (
                  <FileImage className="h-5 w-5 shrink-0 text-muted-foreground" />
                ) : (
                  <FileAudio className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1 truncate" title={item.file.name}>
                  {item.file.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {(item.file.size / 1024).toFixed(1)} KB
                </span>
                {item.status === "uploading" && (
                  <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.status === "done" && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                )}
                {item.status === "error" && (
                  <span className="flex items-center gap-1 text-destructive" title={item.error}>
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span className="max-w-[120px] truncate text-xs">
                      {item.error}
                    </span>
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeFromQueue(item.id)}
                  aria-label="Remover da fila"
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
