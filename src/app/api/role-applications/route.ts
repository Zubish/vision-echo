import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMyRoleApplication, submitRoleApplication } from "@/lib/db";
import { roleApplicationSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ application: null });

  const application = await getMyRoleApplication(user.id);
  return NextResponse.json({ application });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const parsed = roleApplicationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Application needs more detail" }, { status: 400 });

  try {
    const application = await submitRoleApplication(user.id, parsed.data.note);
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not submit application" }, { status: 403 });
  }
}
