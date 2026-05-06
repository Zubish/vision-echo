import { NextRequest, NextResponse } from "next/server";
import { canAdmin, getCurrentUser, toPublicUser } from "@/lib/auth";
import { updateUserRole } from "@/lib/db";
import { roleUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const currentUser = await getCurrentUser();
  if (!canAdmin(currentUser)) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { id } = await context.params;
  const parsed = roleUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  try {
    const user = await updateUserRole(id, parsed.data.role);
    return NextResponse.json({ user: user ? toPublicUser(user) : null });
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}
