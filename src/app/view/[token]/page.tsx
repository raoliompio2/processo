import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { PublicCaseView } from "./PublicCaseView";

type Props = { params: Promise<{ token: string }> };

export default async function ViewPublicPage({ params }: Props) {
  const { token } = await params;
  const c = await prisma.case.findUnique({
    where: { shareToken: token },
    include: {
      evidence: {
        orderBy: { capturedAt: "asc" },
        include: {
          tags: { include: { tag: true } },
          jobs: { select: { id: true, jobType: true, status: true } },
        },
      },
      facts: {
        orderBy: { createdAt: "asc" },
        include: { evidence: { include: { evidence: { select: { id: true } } } } },
      },
      tags: true,
    },
  });
  if (!c) notFound();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const cleanBase = baseUrl.replace(/\/$/, "");

  const evidence = c.evidence.map((e) => ({
    id: e.id,
    type: e.type,
    fileName: e.fileName,
    notes: e.notes,
    capturedAt: e.capturedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    transcriptText: e.transcriptText,
    ocrText: e.ocrText,
    tags: e.tags.map((t) => t.tag),
    jobs: e.jobs,
    viewUrl: `${cleanBase}/api/public/evidence?token=${encodeURIComponent(token)}&id=${e.id}`,
  }));

  const facts = c.facts.map((f) => ({
    id: f.id,
    title: f.title,
    description: f.description,
    evidenceIds: f.evidence.map((ev) => ev.evidence.id),
  }));

  const initialData = {
    case: {
      id: c.id,
      title: c.title,
      description: c.description,
      peopleInvolved: c.peopleInvolved,
      status: c.status,
    },
    evidence,
    facts,
    tags: c.tags,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-6 py-6 md:px-8 lg:px-10">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Visualização pública · somente leitura
          </p>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:underline"
          >
            Ir para início
          </Link>
        </div>
        <PublicCaseView initialData={initialData} />
      </div>
    </div>
  );
}
