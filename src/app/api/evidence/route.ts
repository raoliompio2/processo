import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";
import { logAudit } from "@/lib/audit";
import { createEvidenceSchema } from "@/lib/validations/evidence";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createEvidenceSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { caseId, type, file_name, file_size, mime_type, captured_at, source, notes } =
    parsed.data;
  const { userId } = await requireCaseRole(caseId, "editor");

  const capturedAt =
    captured_at != null
      ? typeof captured_at === "string"
        ? new Date(captured_at)
        : captured_at
      : undefined;

  const evidence = await prisma.evidence.create({
    data: {
      caseId,
      type,
      fileName: file_name ?? undefined,
      fileSize: file_size ?? undefined,
      mimeType: mime_type ?? undefined,
      capturedAt: capturedAt ?? undefined,
      source: source ?? "whatsapp",
      notes: notes ?? undefined,
    },
  });

  if (type === "audio") {
    await prisma.evidenceJob.create({
      data: {
        evidenceId: evidence.id,
        jobType: "transcription",
        status: "queued",
      },
    });
  }
  if (type === "image") {
    await prisma.evidenceJob.create({
      data: {
        evidenceId: evidence.id,
        jobType: "ocr",
        status: "queued",
      },
    });
  }

  await logAudit(userId, caseId, "evidence.created", "evidence", evidence.id);
  return Response.json(evidence);
}
