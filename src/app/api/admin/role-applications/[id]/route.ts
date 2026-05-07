import { NextRequest, NextResponse } from "next/server";
import { canAdmin, getCurrentUser } from "@/lib/auth";
import { reviewRoleApplication } from "@/lib/db";
import { roleApplicationReviewSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !canAdmin(currentUser)) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { id } = await context.params;
  const parsed = roleApplicationReviewSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid application decision" }, { status: 400 });

  try {
    const application = await reviewRoleApplication(currentUser.id, id, parsed.data.status, parsed.data.reviewerNote);
    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Application not found" }, { status: 403 });
  }
}
