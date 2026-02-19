"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Fact = {
  id: string;
  title: string;
  description: string | null;
  evidence: { evidenceId: string; evidence?: { id: string; fileName: string | null } }[];
};

type EvidenceItem = { id: string; fileName: string | null; type: string };

type Props = {
  caseId: string;
  canEdit: boolean;
  refreshKey?: number;
};

export function FactsPanel({ caseId, canEdit, refreshKey }: Props) {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [factToDelete, setFactToDelete] = useState<Fact | null>(null);

  const fetchFacts = () => {
    fetch(`/api/facts?caseId=${caseId}`)
      .then((r) => r.json())
      .then((data) => setFacts(Array.isArray(data) ? data : []))
      .catch(() => setFacts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFacts();
  }, [caseId, refreshKey]);

  useEffect(() => {
    if (caseId && (showForm || editingId))
      fetch(`/api/cases/${caseId}/evidence`)
        .then((r) => r.json())
        .then((data) => setEvidenceList(Array.isArray(data) ? data : []))
        .catch(() => setEvidenceList([]));
  }, [caseId, showForm, editingId]);

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setEvidenceIds([]);
    setShowForm(true);
  };

  const openEdit = (f: Fact) => {
    setShowForm(false);
    setEditingId(f.id);
    setTitle(f.title);
    setDescription(f.description ?? "");
    setEvidenceIds(f.evidence.map((e) => e.evidenceId));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const toggleEvidence = (id: string) => {
    setEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/facts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          title,
          description: description || undefined,
          evidenceIds,
        }),
      });
      if (res.ok) {
        closeForm();
        fetchFacts();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/facts/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          evidenceIds,
        }),
      });
      if (res.ok) {
        closeForm();
        fetchFacts();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!factToDelete) return;
    await fetch(`/api/facts/${factToDelete.id}`, { method: "DELETE" });
    setFactToDelete(null);
    fetchFacts();
  };

  if (loading) return <div className="text-sm text-muted-foreground">Carregando...</div>;

  const isEditing = !!editingId;

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Fatos</h3>
      {canEdit && (
        <>
          {!showForm && !editingId ? (
            <Button size="sm" variant="outline" onClick={openCreate}>
              Adicionar fato
            </Button>
          ) : (
            <form
              onSubmit={isEditing ? handleUpdate : handleCreate}
              className="space-y-2 rounded border p-2"
            >
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Título do fato"
              />
              <Label>Descrição</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[60px] w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Opcional"
              />
              <div>
                <Label>Evidências vinculadas</Label>
                <div className="mt-1 max-h-32 overflow-y-auto space-y-1 rounded border p-2">
                  {evidenceList.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhuma evidência no caso.</p>
                  ) : (
                    evidenceList.map((ev) => (
                      <label key={ev.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={evidenceIds.includes(ev.id)}
                          onChange={() => toggleEvidence(ev.id)}
                          className="rounded border-input"
                        />
                        {ev.fileName || ev.id.slice(0, 8)} ({ev.type})
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Salvando..." : "Salvar"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={closeForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </>
      )}
      <ul className="space-y-2">
        {facts.map((f) => (
          <li key={f.id} className="rounded border p-2 text-sm">
            <p className="font-medium">{f.title}</p>
            {f.description && (
              <p className="text-muted-foreground">{f.description}</p>
            )}
            {f.evidence.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {f.evidence.length} evidência(s) vinculada(s)
              </p>
            )}
            {canEdit && (
              <div className="mt-1 flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(f)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setFactToDelete(f)}
                >
                  Remover
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {factToDelete && (
        <ConfirmDialog
          open={!!factToDelete}
          title="Remover fato"
          description="Remover este fato?"
          confirmLabel="Remover"
          variant="destructive"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setFactToDelete(null)}
        />
      )}
    </div>
  );
}
