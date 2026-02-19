import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";
import { logAudit } from "@/lib/audit";
import { updateCaseSchema } from "@/lib/validations/case";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { case: c } = await requireCaseRole(id, "viewer");
  const members = await prisma.caseMember.findMany({
    where: { caseId: id },
  });
  return Response.json({ ...c, members });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await requireCaseRole(id, "owner");
  const body = await req.json();
  const parsed = updateCaseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const updated = await prisma.case.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description,
      }),
      ...(parsed.data.people_involved !== undefined && {
        peopleInvolved: parsed.data.people_involved,
      }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
    },
  });
  await logAudit(userId, id, "case.updated", "case", id, {
    updated: Object.keys(parsed.data),
  });
  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await requireCaseRole(id, "owner");
  await prisma.case.delete({ where: { id } });
  await logAudit(userId, id, "case.deleted", "case", id);
  return Response.json({ ok: true });
}
