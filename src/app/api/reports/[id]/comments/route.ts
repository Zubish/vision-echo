import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addComment, getReport } from "@/lib/db";
import { commentInputSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const report = await getReport(id);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ comments: report.comments });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { id } = await context.params;
  const parsed = commentInputSchema.safeParse({ ...(await request.json()), name: user.name });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid comment", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const comment = await addComment(id, parsed.data);
    return NextResponse.json({ comment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
}
