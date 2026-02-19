import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) {
    return Response.json({ error: "Tag não encontrada" }, { status: 404 });
  }
  await requireCaseRole(tag.caseId, "editor");
  await prisma.tag.delete({ where: { id } });
  return Response.json({ ok: true });
}
