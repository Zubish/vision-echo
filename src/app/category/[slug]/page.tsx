import { notFound } from "next/navigation";
import { getDb, listReports } from "@/lib/db";
import { VisionEchoApp } from "@/components/vision-echo-app";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [db, reports] = await Promise.all([getDb(), listReports({ category: slug })]);

  if (!db.categories.some((category) => category.slug === slug)) notFound();

  return <VisionEchoApp initialCategories={db.categories} initialReporters={db.reporters} initialReports={reports} initialCategory={slug} />;
}
