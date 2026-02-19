import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/require";
import { logAudit } from "@/lib/audit";
import { createCaseSchema } from "@/lib/validations/case";

export async function GET() {
  const { userId } = await requireAuth();
  const members = await prisma.caseMember.findMany({
    where: { userId },
    include: { case: true },
    orderBy: { case: { updatedAt: "desc" } },
  });
  const cases = members.map((m) => ({ ...m.case, myRole: m.role }));
  return Response.json(cases);
}

export async function POST(req: NextRequest) {
  const { userId } = await requireAuth();
  const body = await req.json();
  const parsed = createCaseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { title, description, people_involved, status } = parsed.data;
  const c = await prisma.case.create({
    data: {
      title,
      description: description ?? undefined,
      peopleInvolved: people_involved ?? undefined,
      status: status ?? "draft",
      members: {
        create: { userId, role: "owner" },
      },
    },
  });
  await logAudit(userId, c.id, "case.created", "case", c.id);
  return Response.json(c);
}
