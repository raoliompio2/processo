"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditCaseDialog } from "./EditCaseDialog";
import { ShareCaseDialog } from "./ShareCaseDialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type CaseData = {
  id: string;
  title: string;
  description: string | null;
  peopleInvolved: string | null;
  status: string;
  shareToken?: string | null;
};

type Props = {
  caseData: CaseData;
  role: string;
  isOwner: boolean;
};

export function CaseHeader({ caseData, role, isOwner }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/cases/${caseData.id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteConfirm(false);
        router.push("/cases");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <Link
          href="/cases"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Voltar aos casos
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{caseData.title}</h1>
        {caseData.description && (
          <p className="mt-1 text-muted-foreground">{caseData.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Pessoas envolvidas: {caseData.peopleInvolved ?? "—"} · Status:{" "}
          {caseData.status} · Sua função: {role}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <ShareCaseDialog
          caseId={caseData.id}
          shareToken={caseData.shareToken}
          onShareChange={() => router.refresh()}
        />
        <EditCaseDialog
          caseData={caseData}
          isOwner={isOwner}
          onUpdated={() => router.refresh()}
        />
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
          >
            Excluir caso
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Excluir caso"
        description="Excluir este caso? Todas as evidências e dados serão removidos."
        confirmLabel="Excluir"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
