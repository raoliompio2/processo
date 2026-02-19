import { z } from "zod";

export const createFactSchema = z.object({
  caseId: z.string().min(1),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  evidenceIds: z.array(z.string()).optional().default([]),
});

export const updateFactSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  evidenceIds: z.array(z.string()).optional(),
});

export type CreateFactInput = z.infer<typeof createFactSchema>;
export type UpdateFactInput = z.infer<typeof updateFactSchema>;
