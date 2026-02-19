"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewCasePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [peopleInvolved, setPeopleInvolved] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "closed">("draft");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          people_involved: peopleInvolved || undefined,
          status,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao criar caso");
      }
      const c = await res.json();
      router.push(`/cases/${c.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar caso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="w-full px-6 py-6 md:px-8 lg:px-10">
        <NavBar />
        <div className="mt-8">
          <h1 className="text-2xl font-semibold">Novo caso</h1>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-500">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
                placeholder="Ex: Caso WhatsApp João"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Opcional"
              />
            </div>
            <div>
              <Label htmlFor="people">Pessoas envolvidas</Label>
              <Input
                id="people"
                value={peopleInvolved}
                onChange={(e) => setPeopleInvolved(e.target.value)}
                disabled={loading}
                placeholder="Ex: João, Maria"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "active" | "closed")}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="draft">Rascunho</option>
                <option value="active">Ativo</option>
                <option value="closed">Encerrado</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Criando..." : "Criar caso"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/cases">Cancelar</Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
