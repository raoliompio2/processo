import { NextRequest } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";
import { logAudit } from "@/lib/audit";
import { updateEvidenceSchema } from "@/lib/validations/evidence";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const evidence = await prisma.evidence.findUnique({
    where: { id },
    include: { jobs: true, tags: { include: { tag: true } } },
  });
  if (!evidence) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  await requireCaseRole(evidence.caseId, "viewer");
  return Response.json(evidence);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const evidence = await prisma.evidence.findUnique({ where: { id } });
  if (!evidence) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const { userId } = await requireCaseRole(evidence.caseId, "editor");
  const body = await req.json();
  const parsed = updateEvidenceSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updateData: Parameters<typeof prisma.evidence.update>[0]["data"] = {};
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  if (parsed.data.captured_at !== undefined) {
    updateData.capturedAt =
      parsed.data.captured_at == null
        ? null
        : typeof parsed.data.captured_at === "string"
          ? new Date(parsed.data.captured_at)
          : parsed.data.captured_at;
  }
  if (parsed.data.tagIds !== undefined) {
    await prisma.evidenceTag.deleteMany({ where: { evidenceId: id } });
    if (parsed.data.tagIds.length > 0) {
      await prisma.evidenceTag.createMany({
        data: parsed.data.tagIds.map((tagId) => ({
          evidenceId: id,
          tagId,
        })),
        skipDuplicates: true,
      });
    }
  }

  const updated = await prisma.evidence.update({
    where: { id },
    data: updateData,
    include: { jobs: true, tags: { include: { tag: true } } },
  });
  await logAudit(userId, evidence.caseId, "evidence.updated", "evidence", id);
  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const evidence = await prisma.evidence.findUnique({ where: { id } });
  if (!evidence) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const { userId } = await requireCaseRole(evidence.caseId, "editor");
  if (evidence.blobUrl) {
    try {
      await del(evidence.blobUrl);
    } catch {
      // ignore blob delete errors
    }
  }
  await prisma.evidence.delete({ where: { id } });
  await logAudit(userId, evidence.caseId, "evidence.deleted", "evidence", id);
  return Response.json({ ok: true });
}
