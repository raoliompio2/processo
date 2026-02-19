"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Member = {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayLabel?: string;
};

type Props = {
  caseId: string;
  isOwner: boolean;
};

export function MembersPanel({ caseId, isOwner }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("viewer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const fetchMembers = () => {
    fetch(`/api/cases/${caseId}/members`)
      .then((r) => r.json())
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, [caseId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao convidar");
      setEmail("");
      setShowInvite(false);
      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!memberToRemove) return;
    await fetch(`/api/cases/${caseId}/members/${memberToRemove.id}`, {
      method: "DELETE",
    });
    setMemberToRemove(null);
    fetchMembers();
  };

  const handleRoleChange = async (memberId: string, role: "editor" | "viewer") => {
    await fetch(`/api/cases/${caseId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    fetchMembers();
  };

  if (loading) return <div className="text-sm text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Membros</h3>
      {isOwner && (
        <>
          {!showInvite ? (
            <Button size="sm" variant="outline" onClick={() => setShowInvite(true)}>
              Convidar por email
            </Button>
          ) : (
            <form onSubmit={handleInvite} className="space-y-2 rounded border p-2">
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@exemplo.com"
              />
              <Label>Função</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={submitting}>
                  Convidar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowInvite(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </>
      )}
      <ul className="space-y-1 text-sm">
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-2 rounded border px-2 py-1">
            <span className="min-w-0 flex-1 truncate" title={m.email ?? m.userId}>
              {m.displayLabel ?? m.email ?? m.userId}
            </span>
            {isOwner && m.role !== "owner" ? (
              <>
                <select
                  value={m.role}
                  onChange={(e) =>
                    handleRoleChange(m.id, e.target.value as "editor" | "viewer")
                  }
                  className="rounded border bg-background px-2 py-0.5 text-xs"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive shrink-0"
                  onClick={() => setMemberToRemove(m)}
                >
                  Remover
                </Button>
              </>
            ) : (
              <span className="shrink-0 text-muted-foreground">{m.role}</span>
            )}
          </li>
        ))}
      </ul>

      {memberToRemove && (
        <ConfirmDialog
          open={!!memberToRemove}
          title="Remover membro"
          description={`Remover ${memberToRemove.displayLabel ?? memberToRemove.email ?? memberToRemove.userId} do caso?`}
          confirmLabel="Remover"
          variant="destructive"
          onConfirm={handleRemoveConfirm}
          onCancel={() => setMemberToRemove(null)}
        />
      )}
    </div>
  );
}
