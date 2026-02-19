"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  caseId: string;
};

export function ExportPanel({ caseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setMarkdown(null);
    try {
      const res = await fetch(`/api/export/case/${caseId}`);
      if (!res.ok) throw new Error("Erro ao gerar");
      const text = await res.text();
      setMarkdown(text);
    } catch {
      toast.error("Erro ao gerar resumo");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    toast.success("Markdown copiado");
  };

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Exportar</h3>
      <Button
        size="sm"
        variant="outline"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? "Gerando..." : "Gerar resumo (Markdown)"}
      </Button>
      {markdown && (
        <>
          <Button size="sm" onClick={handleCopy}>
            Copiar markdown
          </Button>
          <pre className="max-h-48 overflow-auto rounded border bg-muted/50 p-2 text-xs">
            {markdown.slice(0, 1500)}
            {markdown.length > 1500 ? "…" : ""}
          </pre>
        </>
      )}
    </div>
  );
}
