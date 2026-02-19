import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";
import { logAudit } from "@/lib/audit";
import { inviteMemberSchema } from "@/lib/validations/member";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await requireCaseRole(id, "viewer");
  const members = await prisma.caseMember.findMany({
    where: { caseId: id },
    orderBy: { createdAt: "asc" },
  });
  const userIds = [...new Set(members.map((m) => m.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const withUser = members.map((m) => {
    const u = userMap.get(m.userId);
    const displayLabel = u?.name?.trim() || u?.email || m.userId;
    return {
      ...m,
      email: u?.email,
      displayLabel,
    };
  });
  return Response.json(withUser);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params;
  const { userId } = await requireCaseRole(caseId, "owner");
  const body = await req.json();
  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, role } = parsed.data;
  const invitedUser = await prisma.user.findUnique({ where: { email } });
  if (!invitedUser) {
    return Response.json(
      { error: "Usuário não encontrado com este email. Peça para a pessoa se cadastrar primeiro." },
      { status: 404 }
    );
  }
  const invitedUserId = invitedUser.id;
  const existing = await prisma.caseMember.findUnique({
    where: { caseId_userId: { caseId, userId: invitedUserId } },
  });
  if (existing) {
    return Response.json(
      { error: "Usuário já é membro deste caso" },
      { status: 409 }
    );
  }
  const member = await prisma.caseMember.create({
    data: { caseId, userId: invitedUserId, role },
  });
  await logAudit(userId, caseId, "member.invited", "member", member.id, {
    email,
    role,
    invitedUserId,
  });
  return Response.json(member);
}
