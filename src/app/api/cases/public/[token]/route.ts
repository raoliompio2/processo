import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const c = await prisma.case.findUnique({
    where: { shareToken: token },
    include: {
      evidence: {
        orderBy: [
          { sortOrder: "asc" },
          { capturedAt: "asc" },
          { createdAt: "asc" },
        ],
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
  if (!c) {
    return Response.json({ error: "Link inválido ou desativado" }, { status: 404 });
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
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
    viewUrl: `${baseUrl.replace(/\/$/, "")}/api/public/evidence?token=${encodeURIComponent(token)}&id=${e.id}`,
  }));
  const facts = c.facts.map((f) => ({
    id: f.id,
    title: f.title,
    description: f.description,
    evidenceIds: f.evidence.map((ev) => ev.evidence.id),
  }));
  return Response.json({
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
  });
}
