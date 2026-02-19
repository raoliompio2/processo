import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { Case, CaseMember } from "@prisma/client";

const ROLE_ORDER = { viewer: 0, editor: 1, owner: 2 } as const;
type MinRole = "viewer" | "editor" | "owner";

export async function requireAuth(): Promise<{ userId: string }> {
  const session = await getSession();
  if (!session) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return { userId: session.user.id };
}

export async function requireCaseRole(
  caseId: string,
  minRole: MinRole
): Promise<{
  userId: string;
  member: CaseMember;
  case: Case;
}> {
  const { userId } = await requireAuth();

  const member = await prisma.caseMember.findUnique({
    where: { caseId_userId: { caseId, userId } },
    include: { case: true },
  });

  if (!member) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const minLevel = ROLE_ORDER[minRole];
  const userLevel = ROLE_ORDER[member.role as MinRole];
  if (userLevel < minLevel) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return {
    userId,
    member,
    case: member.case,
  };
}
