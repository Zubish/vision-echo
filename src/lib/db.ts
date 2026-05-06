import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { seedDb } from "./seed";
import type { Comment, Report, ReviewDecision, VisionEchoDb } from "./types";

const dbPath = path.join(process.cwd(), "data", "visionecho-db.json");

let memoryDb: VisionEchoDb | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function ensureDb() {
  if (memoryDb) return memoryDb;

  try {
    const file = await readFile(dbPath, "utf8");
    memoryDb = JSON.parse(file) as VisionEchoDb;
  } catch {
    memoryDb = clone(seedDb);
    await persistDb(memoryDb);
  }

  return memoryDb;
}

async function persistDb(db: VisionEchoDb) {
  await mkdir(path.dirname(dbPath), { recursive: true });
  await writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
}

export async function getDb() {
  return clone(await ensureDb());
}

export async function saveDb(mutator: (db: VisionEchoDb) => void) {
  const db = await ensureDb();
  mutator(db);
  await persistDb(db);
  return clone(db);
}

export async function listReports(filters?: {
  category?: string;
  status?: string;
  live?: string;
  q?: string;
  state?: string;
}) {
  const db = await getDb();
  const q = filters?.q?.toLowerCase().trim();

  return db.reports
    .filter((report) => report.status !== "rejected" && report.status !== "archived")
    .filter((report) => !filters?.category || filters.category === "all" || report.categorySlug === filters.category)
    .filter((report) => !filters?.status || filters.status === "all" || report.status === filters.status)
    .filter((report) => filters?.live === undefined || filters.live === "all" || String(report.live) === filters.live)
    .filter((report) => !filters?.state || filters.state === "all" || report.state.toLowerCase() === filters.state.toLowerCase())
    .filter((report) => {
      if (!q) return true;
      return `${report.title} ${report.body} ${report.locationName} ${report.authorName}`.toLowerCase().includes(q);
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function getReport(idOrSlug: string) {
  const db = await getDb();
  return db.reports.find((report) => report.id === idOrSlug || report.slug === idOrSlug) ?? null;
}

export async function createReport(input: Omit<Report, "id" | "slug" | "comments" | "reviewTrail" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const report: Report = {
    ...input,
    id: `ve-${Date.now()}`,
    slug: slugify(input.title),
    comments: [],
    reviewTrail: [],
    createdAt: now,
    updatedAt: now,
  };

  await saveDb((db) => {
    db.reports.unshift(report);
  });

  return report;
}

export async function addComment(reportId: string, input: Pick<Comment, "name" | "text">) {
  const comment: Comment = {
    id: `c-${Date.now()}`,
    reportId,
    name: input.name,
    text: input.text,
    status: "visible",
    createdAt: new Date().toISOString(),
  };

  await saveDb((db) => {
    const report = db.reports.find((item) => item.id === reportId || item.slug === reportId);
    if (!report) throw new Error("Report not found");
    report.comments.push(comment);
    report.updatedAt = new Date().toISOString();
  });

  return comment;
}

export async function reviewReport(reportId: string, decision: ReviewDecision["decision"], reason?: string) {
  let updated: Report | null = null;
  const review: ReviewDecision = {
    id: `rd-${Date.now()}`,
    reportId,
    editorName: "Editor Desk",
    decision,
    reason,
    createdAt: new Date().toISOString(),
  };

  await saveDb((db) => {
    const report = db.reports.find((item) => item.id === reportId || item.slug === reportId);
    if (!report) throw new Error("Report not found");

    report.status = decision === "approved" ? "verified" : decision === "rejected" ? "rejected" : "needs_more_info";
    report.reviewTrail.push(review);
    report.evidence.push({
      id: `e-${Date.now()}`,
      label: decision === "approved" ? "Editor approved" : decision === "rejected" ? "Editor rejected" : "More info requested",
      type: "editor",
      confidence: decision === "approved" ? 90 : 20,
    });
    report.updatedAt = new Date().toISOString();
    updated = report;
  });

  return updated;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
