import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";
import { createFactSchema } from "@/lib/validations/fact";

export async function GET(req: NextRequest) {
  const caseId = req.nextUrl.searchParams.get("caseId");
  if (!caseId) {
    return Response.json({ error: "caseId required" }, { status: 400 });
  }
  await requireCaseRole(caseId, "viewer");
  const facts = await prisma.fact.findMany({
    where: { caseId },
    include: { evidence: { include: { evidence: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(facts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createFactSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { caseId, title, description, evidenceIds } = parsed.data;
  await requireCaseRole(caseId, "editor");
  const fact = await prisma.fact.create({
    data: {
      caseId,
      title,
      description: description ?? undefined,
      evidence:
        evidenceIds && evidenceIds.length > 0
          ? {
              create: evidenceIds.map((evidenceId) => ({
                evidenceId,
              })),
            }
          : undefined,
    },
    include: { evidence: { include: { evidence: true } } },
  });
  return Response.json(fact);
}
