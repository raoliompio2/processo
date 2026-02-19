-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('draft', 'active', 'closed');

-- CreateEnum
CREATE TYPE "CaseMemberRole" AS ENUM ('owner', 'editor', 'viewer');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('image', 'audio', 'text');

-- CreateEnum
CREATE TYPE "EvidenceJobType" AS ENUM ('transcription', 'ocr');

-- CreateEnum
CREATE TYPE "EvidenceJobStatus" AS ENUM ('queued', 'processing', 'done', 'error');

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "people_involved" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_members" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "CaseMemberRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "blob_key" TEXT,
    "blob_url" TEXT,
    "file_name" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "captured_at" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'whatsapp',
    "notes" TEXT,
    "transcript_text" TEXT,
    "ocr_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_jobs" (
    "id" TEXT NOT NULL,
    "evidence_id" TEXT NOT NULL,
    "job_type" "EvidenceJobType" NOT NULL,
    "status" "EvidenceJobStatus" NOT NULL DEFAULT 'queued',
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_tags" (
    "evidence_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "evidence_tags_pkey" PRIMARY KEY ("evidence_id","tag_id")
);

-- CreateTable
CREATE TABLE "facts" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_evidence" (
    "fact_id" TEXT NOT NULL,
    "evidence_id" TEXT NOT NULL,

    CONSTRAINT "fact_evidence_pkey" PRIMARY KEY ("fact_id","evidence_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "case_id" TEXT,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "case_members_case_id_user_id_idx" ON "case_members"("case_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "case_members_case_id_user_id_key" ON "case_members"("case_id", "user_id");

-- CreateIndex
CREATE INDEX "evidence_case_id_captured_at_idx" ON "evidence"("case_id", "captured_at");

-- CreateIndex
CREATE INDEX "evidence_case_id_created_at_idx" ON "evidence"("case_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "tags_case_id_name_key" ON "tags"("case_id", "name");

-- CreateIndex
CREATE INDEX "audit_logs_case_id_idx" ON "audit_logs"("case_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- AddForeignKey
ALTER TABLE "case_members" ADD CONSTRAINT "case_members_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_jobs" ADD CONSTRAINT "evidence_jobs_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_tags" ADD CONSTRAINT "evidence_tags_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_tags" ADD CONSTRAINT "evidence_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facts" ADD CONSTRAINT "facts_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_evidence" ADD CONSTRAINT "fact_evidence_fact_id_fkey" FOREIGN KEY ("fact_id") REFERENCES "facts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_evidence" ADD CONSTRAINT "fact_evidence_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;
