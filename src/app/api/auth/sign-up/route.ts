import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, createSession } from "@/lib/auth/session";
import { signUpSchema } from "@/lib/validations/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json(
      { error: "Já existe uma conta com este email" },
      { status: 409 }
    );
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name ?? null },
  });
  await createSession(user.id);
  return Response.json({ ok: true, userId: user.id });
}
