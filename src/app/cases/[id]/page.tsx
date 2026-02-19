import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { NavBar } from "@/components/navbar";
import { CaseHeader } from "@/components/case/CaseHeader";
import { CaseDetailClient } from "./CaseDetailClient";

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const userId = session.user.id;

  const member = await prisma.caseMember.findUnique({
    where: { caseId_userId: { caseId: id, userId } },
    include: { case: true },
  });
  if (!member) notFound();

  const canEdit =
    member.role === "owner" || member.role === "editor";
  const isOwner = member.role === "owner";

  return (
    <div className="flex min-h-screen flex-col">
      <div className="w-full px-6 py-6 md:px-8 lg:px-10">
        <NavBar />
        <CaseHeader
          caseData={{
            id: member.case.id,
            title: member.case.title,
            description: member.case.description,
            peopleInvolved: member.case.peopleInvolved,
            status: member.case.status,
            shareToken: member.case.shareToken,
          }}
          role={member.role}
          isOwner={isOwner}
        />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <CaseDetailClient
            caseId={id}
            canEdit={canEdit}
            isOwner={isOwner}
          />
        </div>
      </div>
    </div>
  );
}
