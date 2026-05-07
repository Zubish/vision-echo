import { NextRequest, NextResponse } from "next/server";
import { createSession, toPublicUser, verifyPassword } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid login details" }, { status: 400 });

  const user = await getUserByEmail(parsed.data.email);
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  if (user.status !== "active") {
    return NextResponse.json({ error: "Account is not active" }, { status: 403 });
  }

  await createSession(user.id);
  return NextResponse.json({ user: toPublicUser(user) });
}
