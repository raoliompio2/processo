import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";
import { logAudit } from "@/lib/audit";

function generateShareToken(): string {
  return randomBytes(24).toString("hex");
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await requireCaseRole(id, "owner");
  const c = await prisma.case.findUnique({ where: { id }, select: { shareToken: true } });
  if (!c) {
    return Response.json({ error: "Case not found" }, { status: 404 });
  }
  const shareToken = c.shareToken ?? generateShareToken();
  if (!c.shareToken) {
    await prisma.case.update({
      where: { id },
      data: { shareToken },
    });
    await logAudit(userId, id, "case.share_enabled", "case", id, {});
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  const publicUrl = `${baseUrl.replace(/\/$/, "")}/view/${shareToken}`;
  return Response.json({ shareToken, publicUrl });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await requireCaseRole(id, "owner");
  await prisma.case.update({
    where: { id },
    data: { shareToken: null },
  });
  await logAudit(userId, id, "case.share_disabled", "case", id, {});
  return Response.json({ ok: true });
}
