import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";
import { updateFactSchema } from "@/lib/validations/fact";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fact = await prisma.fact.findUnique({ where: { id }, include: { case: true } });
  if (!fact) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  await requireCaseRole(fact.caseId, "editor");
  const body = await req.json();
  const parsed = updateFactSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updateData: Parameters<typeof prisma.fact.update>[0]["data"] = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined)
    updateData.description = parsed.data.description;
  if (parsed.data.evidenceIds !== undefined) {
    await prisma.factEvidence.deleteMany({ where: { factId: id } });
    if (parsed.data.evidenceIds.length > 0) {
      updateData.evidence = {
        create: parsed.data.evidenceIds.map((evidenceId) => ({
          evidenceId,
        })),
      };
    }
  }

  const updated = await prisma.fact.update({
    where: { id },
    data: updateData,
    include: { evidence: { include: { evidence: true } } },
  });
  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fact = await prisma.fact.findUnique({ where: { id } });
  if (!fact) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  await requireCaseRole(fact.caseId, "editor");
  await prisma.fact.delete({ where: { id } });
  return Response.json({ ok: true });
}
