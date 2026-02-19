import { z } from "zod";

export const createTagSchema = z.object({
  caseId: z.string().min(1),
  name: z.string().min(1, "Nome da tag é obrigatório"),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
