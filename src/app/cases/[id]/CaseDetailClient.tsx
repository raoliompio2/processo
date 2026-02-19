"use client";

import { useState } from "react";
import { EvidenceUploader } from "@/components/case/EvidenceUploader";
import { Timeline } from "@/components/case/Timeline";
import { FactsPanel } from "@/components/case/FactsPanel";
import { MembersPanel } from "@/components/case/MembersPanel";
import { TagsPanel } from "@/components/case/TagsPanel";
import { ExportPanel } from "@/components/case/ExportPanel";

type Props = {
  caseId: string;
  canEdit: boolean;
  isOwner: boolean;
};

export function CaseDetailClient({ caseId, canEdit, isOwner }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <div className="lg:col-span-2 space-y-6">
        {canEdit && (
          <div>
            <h2 className="mb-2 font-medium">Upload</h2>
            <EvidenceUploader
              caseId={caseId}
              onUploaded={() => setRefreshKey((k) => k + 1)}
            />
          </div>
        )}
        <div>
          <h2 className="mb-2 font-medium">Timeline</h2>
          <Timeline
            caseId={caseId}
            canEdit={canEdit}
            refreshKey={refreshKey}
          />
        </div>
      </div>
      <div className="space-y-6 rounded-lg border p-4">
        <MembersPanel caseId={caseId} isOwner={isOwner} />
        <TagsPanel
          caseId={caseId}
          canEdit={canEdit}
          refreshKey={refreshKey}
          onTagsChange={() => setRefreshKey((k) => k + 1)}
        />
        <FactsPanel caseId={caseId} canEdit={canEdit} refreshKey={refreshKey} />
        <ExportPanel caseId={caseId} />
      </div>
    </>
  );
}
