"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Props = {
  caseId: string;
  shareToken: string | null | undefined;
  onShareChange: () => void;
};

export function ShareCaseDialog({ caseId, shareToken, onShareChange }: Props) {
  const [open, setOpen] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const currentUrl =
    publicUrl ??
    (shareToken && typeof window !== "undefined"
      ? `${window.location.origin}/view/${shareToken}`
      : null);

  const handleOpen = async () => {
    setOpen(true);
    if (shareToken) {
      setPublicUrl(
        typeof window !== "undefined"
          ? `${window.location.origin}/view/${shareToken}`
          : null
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/share`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao gerar link");
        setOpen(false);
        return;
      }
      setPublicUrl(data.publicUrl ?? null);
      onShareChange();
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!currentUrl) return;
    navigator.clipboard.writeText(currentUrl).then(
      () => toast.success("Link copiado"),
      () => toast.error("Não foi possível copiar")
    );
  };

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/share`, { method: "DELETE" });
      if (res.ok) {
        setPublicUrl(null);
        onShareChange();
        setOpen(false);
        toast.success("Link desativado");
      } else {
        toast.error("Erro ao desativar link");
      }
    } finally {
      setRevoking(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        Compartilhar
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !loading && !revoking && setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-dialog-title"
        >
          <div
            className="w-full max-w-md rounded-lg border bg-background p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="share-dialog-title" className="font-semibold">
              Link público de visualização
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quem tiver este link poderá ver o caso em modo somente leitura (evidências e fatos).
            </p>
            {loading ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Gerando link…
              </p>
            ) : currentUrl ? (
              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="share-url">Link</Label>
                  <Input
                    id="share-url"
                    readOnly
                    value={currentUrl}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={handleCopy}>
                    Copiar link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                  >
                    Fechar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={handleRevoke}
                    disabled={revoking}
                  >
                    {revoking ? "Desativando…" : "Desativar link"}
                  </Button>
                </div>
              </div>
            ) : null}
            {!loading && !currentUrl && (
              <Button
                className="mt-4"
                onClick={() => setOpen(false)}
              >
                Fechar
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
