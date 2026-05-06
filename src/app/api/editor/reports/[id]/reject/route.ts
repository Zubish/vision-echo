import { NextRequest, NextResponse } from "next/server";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { reviewReport } from "@/lib/db";
import { reviewInputSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!canEdit(user)) return NextResponse.json({ error: "Editor access required" }, { status: 403 });

  const { id } = await context.params;
  const parsed = reviewInputSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review decision" }, { status: 400 });
  }

  try {
    const report = await reviewReport(id, "rejected", parsed.data.reason);
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
}
