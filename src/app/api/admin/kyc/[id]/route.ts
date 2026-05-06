import { NextRequest, NextResponse } from "next/server";
import { canAdmin, getCurrentUser } from "@/lib/auth";
import { reviewKyc } from "@/lib/db";
import { kycReviewSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const currentUser = await getCurrentUser();
  if (!canAdmin(currentUser)) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { id } = await context.params;
  const parsed = kycReviewSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid KYC decision" }, { status: 400 });

  try {
    const submission = await reviewKyc(id, parsed.data.status, parsed.data.reviewerNote);
    return NextResponse.json({ submission });
  } catch {
    return NextResponse.json({ error: "KYC not found" }, { status: 404 });
  }
}
