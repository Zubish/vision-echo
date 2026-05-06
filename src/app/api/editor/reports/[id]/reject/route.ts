import { NextRequest, NextResponse } from "next/server";
import { reviewReport } from "@/lib/db";
import { reviewInputSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
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
