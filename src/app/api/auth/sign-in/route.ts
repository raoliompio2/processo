import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword, createSession } from "@/lib/auth/session";
import { signInSchema } from "@/lib/validations/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return Response.json(
      { error: "Email ou senha incorretos" },
      { status: 401 }
    );
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return Response.json(
      { error: "Email ou senha incorretos" },
      { status: 401 }
    );
  }
  await createSession(user.id);
  return Response.json({ ok: true, userId: user.id });
}
