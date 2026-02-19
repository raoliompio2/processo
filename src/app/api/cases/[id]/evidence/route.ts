import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params;
  await requireCaseRole(caseId, "viewer");

  const type = req.nextUrl.searchParams.get("type");
  const tagId = req.nextUrl.searchParams.get("tagId");
  const onlyPendingJobs = req.nextUrl.searchParams.get("onlyPendingJobs") === "true";

  const where: {
    caseId: string;
    type?: "image" | "audio" | "text";
    tags?: { some: { tagId: string } };
    jobs?: { some: { status: { in: ("queued" | "processing")[] } } };
  } = { caseId };

  if (type && (type === "image" || type === "audio" || type === "text")) {
    where.type = type;
  }
  if (tagId) {
    where.tags = { some: { tagId } };
  }
  if (onlyPendingJobs) {
    where.jobs = { some: { status: { in: ["queued", "processing"] } } };
  }

  const evidence = await prisma.evidence.findMany({
    where,
    include: { jobs: true, tags: { include: { tag: true } } },
    orderBy: [{ capturedAt: "asc" }, { createdAt: "asc" }],
  });
  return Response.json(evidence);
}
