import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";
import { createTagSchema } from "@/lib/validations/tag";

export async function GET(req: NextRequest) {
  const caseId = req.nextUrl.searchParams.get("caseId");
  if (!caseId) {
    return Response.json({ error: "caseId required" }, { status: 400 });
  }
  await requireCaseRole(caseId, "viewer");
  const tags = await prisma.tag.findMany({
    where: { caseId },
    orderBy: { name: "asc" },
  });
  return Response.json(tags);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createTagSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { caseId, name } = parsed.data;
  await requireCaseRole(caseId, "editor");
  const tag = await prisma.tag.create({
    data: { caseId, name },
  });
  return Response.json(tag);
}
