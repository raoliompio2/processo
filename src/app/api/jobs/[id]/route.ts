import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";
import { logAudit } from "@/lib/audit";
import { updateJobSchema } from "@/lib/validations/job";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const job = await prisma.evidenceJob.findUnique({
    where: { id: jobId },
    include: { evidence: true },
  });
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }
  const { userId } = await requireCaseRole(job.evidence.caseId, "editor");

  const body = await req.json();
  const parsed = updateJobSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updateData: Parameters<typeof prisma.evidenceJob.update>[0]["data"] = {
    status: parsed.data.status,
    ...(parsed.data.error_message !== undefined && {
      errorMessage: parsed.data.error_message,
    }),
  };
  if (parsed.data.status === "done" || parsed.data.status === "error") {
    updateData.finishedAt = new Date();
  }
  if (parsed.data.status === "processing") {
    updateData.startedAt = new Date();
  }

  const updated = await prisma.evidenceJob.update({
    where: { id: jobId },
    data: updateData,
  });

  if (parsed.data.transcript_text !== undefined && job.jobType === "transcription") {
    await prisma.evidence.update({
      where: { id: job.evidenceId },
      data: { transcriptText: parsed.data.transcript_text },
    });
    await logAudit(
      userId,
      job.evidence.caseId,
      "evidence.transcript_updated",
      "job",
      jobId,
      { evidenceId: job.evidenceId }
    );
  }

  return Response.json(updated);
}
