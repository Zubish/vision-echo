import { NextRequest, NextResponse } from "next/server";
import { createSession, hashPassword, toPublicUser } from "@/lib/auth";
import { createUser } from "@/lib/db";
import { signupSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const parsed = signupSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid signup details" }, { status: 400 });

  try {
    const user = await createUser({
      name: parsed.data.name.trim(),
      email: parsed.data.email.trim(),
      passwordHash: hashPassword(parsed.data.password),
    });
    await createSession(user.id);
    return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Signup failed" }, { status: 409 });
  }
}
