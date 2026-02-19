import { prisma } from "@/lib/db/prisma";

export type AuditTargetType =
  | "case"
  | "evidence"
  | "member"
  | "fact"
  | "tag"
  | "job";

export async function logAudit(
  actorUserId: string,
  caseId: string | null,
  action: string,
  targetType: AuditTargetType,
  targetId?: string | null,
  metadata?: Record<string, unknown> | null
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      caseId,
      action,
      targetType,
      targetId: targetId ?? undefined,
      metadata: metadata ? (metadata as object) : undefined,
    },
  });
}
