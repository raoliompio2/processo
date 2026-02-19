import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const evidence = await prisma.evidence.findUnique({ where: { id } });
  if (!evidence) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  await requireCaseRole(evidence.caseId, "viewer");

  if (!evidence.blobUrl) {
    return Response.json({ error: "File not uploaded yet" }, { status: 404 });
  }

  const download = req.nextUrl.searchParams.get("download") === "1";
  if (download) {
    return Response.redirect(evidence.blobUrl, 302);
  }
  return Response.redirect(evidence.blobUrl, 302);
}
