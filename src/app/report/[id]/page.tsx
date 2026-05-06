import { notFound } from "next/navigation";
import { getDb, getReport } from "@/lib/db";
import { VisionEchoApp } from "@/components/vision-echo-app";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  const [db, report] = await Promise.all([getDb(), getReport(id)]);

  if (!report) notFound();

  return <VisionEchoApp initialCategories={db.categories} initialReporters={db.reporters} initialReports={[report]} />;
}
