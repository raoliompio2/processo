import { z } from "zod";

export const caseMemberRoleEnum = z.enum(["owner", "editor", "viewer"]);

export const inviteMemberSchema = z.object({
  email: z.string().email("Email inválido"),
  role: caseMemberRoleEnum.default("viewer"),
});

export const updateMemberRoleSchema = z.object({
  role: caseMemberRoleEnum,
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
