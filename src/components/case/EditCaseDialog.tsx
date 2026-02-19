"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CaseData = {
  id: string;
  title: string;
  description: string | null;
  peopleInvolved: string | null;
  status: string;
};

type Props = {
  caseData: CaseData;
  isOwner: boolean;
  onUpdated: () => void;
};

export function EditCaseDialog({ caseData, isOwner, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(caseData.title);
  const [description, setDescription] = useState(caseData.description ?? "");
  const [peopleInvolved, setPeopleInvolved] = useState(
    caseData.peopleInvolved ?? ""
  );
  const [status, setStatus] = useState(caseData.status);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          people_involved: peopleInvolved || null,
          status,
        }),
      });
      if (res.ok) {
        setOpen(false);
        onUpdated();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) return null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Editar caso
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-background p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Editar caso</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-desc">Descrição</Label>
                <textarea
                  id="edit-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="edit-people">Pessoas envolvidas</Label>
                <Input
                  id="edit-people"
                  value={peopleInvolved}
                  onChange={(e) => setPeopleInvolved(e.target.value)}
                  placeholder="Ex: João, Maria"
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="draft">Rascunho</option>
                  <option value="active">Ativo</option>
                  <option value="closed">Encerrado</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
