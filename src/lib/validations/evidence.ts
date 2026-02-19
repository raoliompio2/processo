import { z } from "zod";

export const evidenceTypeEnum = z.enum(["image", "audio", "text"]);

export const createEvidenceSchema = z.object({
  caseId: z.string().min(1),
  type: evidenceTypeEnum,
  file_name: z.string().optional(),
  file_size: z.number().int().nonnegative().optional(),
  mime_type: z.string().optional(),
  captured_at: z.string().datetime().optional().or(z.date().optional()),
  source: z.string().optional().default("whatsapp"),
  notes: z.string().optional(),
});

export const updateEvidenceSchema = z.object({
  notes: z.string().optional().nullable(),
  captured_at: z.string().datetime().optional().nullable().or(z.date().optional().nullable()),
  tagIds: z.array(z.string()).optional(),
});

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;
export type UpdateEvidenceInput = z.infer<typeof updateEvidenceSchema>;
