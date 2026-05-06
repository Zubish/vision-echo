import { getDb, listReports } from "@/lib/db";
import { VisionEchoApp } from "@/components/vision-echo-app";

export default async function DashboardPage() {
  const [db, reports] = await Promise.all([getDb(), listReports()]);

  return <VisionEchoApp initialCategories={db.categories} initialReporters={db.reporters} initialReports={reports} />;
}
