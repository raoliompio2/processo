import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { NavBar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

export default async function CasesPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const userId = session.user.id;

  const members = await prisma.caseMember.findMany({
    where: { userId },
    include: { case: true },
    orderBy: { case: { updatedAt: "desc" } },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <div className="w-full px-6 py-6 md:px-8 lg:px-10">
        <NavBar />
        <div className="mt-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Casos</h1>
          <Button asChild>
            <Link href="/cases/new">Criar caso</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {members.length === 0 ? (
            <p className="col-span-full text-muted-foreground">
              Nenhum caso ainda. Crie um caso para começar.
            </p>
          ) : (
            members.map((m) => (
              <Link
                key={m.case.id}
                href={`/cases/${m.case.id}`}
                className="rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50"
              >
                <h2 className="font-medium">{m.case.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {m.case.description ?? "Sem descrição"}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Status: {m.case.status}</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                    {m.role}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
