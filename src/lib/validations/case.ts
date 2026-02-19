import { z } from "zod";

export const caseStatusEnum = z.enum(["draft", "active", "closed"]);

export const createCaseSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  people_involved: z.string().optional(),
  status: caseStatusEnum.optional().default("draft"),
});

export const updateCaseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  people_involved: z.string().optional().nullable(),
  status: caseStatusEnum.optional(),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
