import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { submitKyc } from "@/lib/db";
import { kycInputSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.status !== "active") return NextResponse.json({ error: "Account is not active" }, { status: 403 });
  if (user.reporterVerified) return NextResponse.json({ error: "Reporter already verified" }, { status: 409 });

  const parsed = kycInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid KYC details" }, { status: 400 });

  const submission = await submitKyc(user.id, parsed.data);
  return NextResponse.json({ submission }, { status: 201 });
}
