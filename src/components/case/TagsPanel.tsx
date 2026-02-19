"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Tag = { id: string; name: string };

type Props = {
  caseId: string;
  canEdit: boolean;
  refreshKey?: number;
  onTagsChange?: () => void;
};

export function TagsPanel({
  caseId,
  canEdit,
  refreshKey,
  onTagsChange,
}: Props) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const fetchTags = () => {
    fetch(`/api/tags?caseId=${caseId}`)
      .then((r) => r.json())
      .then((data) => setTags(Array.isArray(data) ? data : []))
      .catch(() => setTags([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTags();
  }, [caseId, refreshKey]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, name: name.trim() }),
      });
      if (res.ok) {
        setName("");
        setShowForm(false);
        fetchTags();
        onTagsChange?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Tags</h3>
      {canEdit && (
        <>
          {!showForm ? (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              Nova tag
            </Button>
          ) : (
            <form onSubmit={handleCreate} className="space-y-2 rounded border p-2">
              <Label>Nome da tag</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: WhatsApp, Print"
                required
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={submitting}>
                  Criar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </>
      )}
      <ul className="flex flex-wrap gap-1">
        {tags.length === 0 ? (
          <li className="text-sm text-muted-foreground">Nenhuma tag.</li>
        ) : (
          tags.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
            >
              <span>{t.name}</span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setTagToDelete(t)}
                  className="text-destructive hover:underline"
                >
                  Excluir
                </button>
              )}
            </li>
          ))
        )}
      </ul>

      {tagToDelete && (
        <ConfirmDialog
          open={!!tagToDelete}
          title="Remover tag"
          description={`Remover a tag "${tagToDelete.name}"?`}
          confirmLabel="Remover"
          variant="destructive"
          onConfirm={async () => {
            await fetch(`/api/tags/${tagToDelete.id}`, { method: "DELETE" });
            setTagToDelete(null);
            fetchTags();
            onTagsChange?.();
          }}
          onCancel={() => setTagToDelete(null)}
        />
      )}
    </div>
  );
}
