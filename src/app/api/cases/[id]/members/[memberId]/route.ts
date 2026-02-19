import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";
import { logAudit } from "@/lib/audit";
import { updateMemberRoleSchema } from "@/lib/validations/member";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id: caseId, memberId } = await params;
  const { userId } = await requireCaseRole(caseId, "owner");
  const member = await prisma.caseMember.findFirst({
    where: { id: memberId, caseId },
  });
  if (!member) {
    return Response.json({ error: "Membro não encontrado" }, { status: 404 });
  }
  const body = await req.json();
  const parsed = updateMemberRoleSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const updated = await prisma.caseMember.update({
    where: { id: memberId },
    data: { role: parsed.data.role },
  });
  await logAudit(userId, caseId, "member.role_changed", "member", memberId, {
    role: parsed.data.role,
  });
  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id: caseId, memberId } = await params;
  const { userId } = await requireCaseRole(caseId, "owner");
  const member = await prisma.caseMember.findFirst({
    where: { id: memberId, caseId },
  });
  if (!member) {
    return Response.json({ error: "Membro não encontrado" }, { status: 404 });
  }
  await prisma.caseMember.delete({ where: { id: memberId } });
  await logAudit(userId, caseId, "member.removed", "member", memberId);
  return Response.json({ ok: true });
}
