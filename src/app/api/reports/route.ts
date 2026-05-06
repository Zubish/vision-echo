import { NextRequest, NextResponse } from "next/server";
import { createReport, getDb, listReports } from "@/lib/db";
import { reportInputSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const reports = await listReports({
    category: params.get("category") ?? undefined,
    status: params.get("status") ?? undefined,
    live: params.get("live") ?? undefined,
    q: params.get("q") ?? undefined,
    state: params.get("state") ?? undefined,
  });
  const db = await getDb();

  return NextResponse.json({
    reports,
    categories: db.categories,
    reporters: db.reporters,
    stats: {
      live: reports.filter((report) => report.live).length,
      verified: reports.filter((report) => report.status === "verified").length,
      inReview: reports.filter((report) => report.status === "in_review").length,
      states: new Set(reports.map((report) => report.state)).size,
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = reportInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report", details: parsed.error.flatten() }, { status: 400 });
  }

  const report = await createReport(parsed.data);
  return NextResponse.json({ report }, { status: 201 });
}
