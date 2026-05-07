import { getDb, listReports } from "@/lib/db";
import { VisionEchoApp } from "@/components/vision-echo-app";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const [user, db, reports] = await Promise.all([getCurrentUser(), getDb(), listReports()]);

  if (!user) {
    redirect("/#access");
  }

  return <VisionEchoApp initialCategories={db.categories} initialReporters={db.reporters} initialReports={reports} />;
}
