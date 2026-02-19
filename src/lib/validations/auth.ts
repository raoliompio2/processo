import { z } from "zod";

const minPasswordLength = 8;

export const signUpSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(minPasswordLength, `Senha deve ter no mínimo ${minPasswordLength} caracteres`),
  name: z.string().max(200).optional(),
});

export const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
