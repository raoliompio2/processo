import { z } from "zod";

export const evidenceJobStatusEnum = z.enum([
  "queued",
  "processing",
  "done",
  "error",
]);

export const updateJobSchema = z.object({
  status: evidenceJobStatusEnum,
  error_message: z.string().optional().nullable(),
  transcript_text: z.string().optional().nullable(),
});

export type UpdateJobInput = z.infer<typeof updateJobSchema>;
