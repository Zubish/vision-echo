import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();
  const reporters = db.users
    .filter((user) => user.role === "reporter" && user.reporterVerified)
    .map((user) => {
      const kyc = db.kycSubmissions.find((submission) => submission.userId === user.id && submission.status === "approved");
      return {
        id: user.id,
        name: user.name,
        initials: user.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        beat: kyc?.beat ?? "Civic reporting",
        base: kyc?.location ?? "Nigeria",
        bio: kyc?.experience ?? "Verified VisionEcho field reporter.",
        verifiedStories: db.reports.filter((report) => report.authorId === user.id && report.status === "verified").length,
        totalStories: db.reports.filter((report) => report.authorId === user.id).length,
        trustScore: 90,
        status: "verified" as const,
      };
    });
  return NextResponse.json({ reporters });
}
