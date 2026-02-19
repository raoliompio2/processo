import { NextRequest } from "next/server";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: evidenceId } = await params;
  const evidence = await prisma.evidence.findUnique({ where: { id: evidenceId } });
  if (!evidence) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  await requireCaseRole(evidence.caseId, "editor");

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file || !file.size) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const pathname = `cases/${evidence.caseId}/evidence/${evidenceId}/${file.name}`;
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type || undefined,
  });

  await prisma.evidence.update({
    where: { id: evidenceId },
    data: {
      blobKey: blob.pathname,
      blobUrl: blob.url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || null,
    },
  });

  return Response.json({
    url: blob.url,
    pathname: blob.pathname,
  });
}
