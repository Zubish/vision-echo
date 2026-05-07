import { NextRequest, NextResponse } from "next/server";
import { canAdmin, getCurrentUser, toPublicUser } from "@/lib/auth";
import { updateUserStatus } from "@/lib/db";
import { statusUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !canAdmin(currentUser)) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { id } = await context.params;
  const parsed = statusUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  try {
    const user = await updateUserStatus(currentUser.id, id, parsed.data.status);
    return NextResponse.json({ user: user ? toPublicUser(user) : null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update account" }, { status: 403 });
  }
}
