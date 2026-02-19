import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params;
  const { userId } = await requireCaseRole(caseId, "editor");

  const body = await req.json();
  const orderedIds = Array.isArray(body?.orderedIds)
    ? (body.orderedIds as string[])
    : [];
  if (orderedIds.length === 0) {
    return Response.json(
      { error: "orderedIds must be a non-empty array" },
      { status: 400 }
    );
  }

  const evidenceInCase = await prisma.evidence.findMany({
    where: { caseId, id: { in: orderedIds } },
    select: { id: true },
  });
  const validIds = new Set(evidenceInCase.map((e) => e.id));
  const toUpdate = orderedIds.filter((id) => validIds.has(id));

  await prisma.$transaction(
    toUpdate.map((evidenceId, index) =>
      prisma.evidence.update({
        where: { id: evidenceId },
        data: { sortOrder: index },
      })
    )
  );

  await logAudit(userId, caseId, "evidence.reorder", "evidence", null, {
    orderedIds: toUpdate,
  });

  return Response.json({ ok: true });
}
