import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const id = req.nextUrl.searchParams.get("id");
  if (!token || !id) {
    return Response.json({ error: "Missing token or id" }, { status: 400 });
  }
  const evidence = await prisma.evidence.findUnique({
    where: { id },
    include: { case: { select: { shareToken: true } } },
  });
  if (!evidence || evidence.case.shareToken !== token) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (!evidence.blobUrl) {
    return Response.json({ error: "File not available" }, { status: 404 });
  }
  return Response.redirect(evidence.blobUrl, 302);
}
