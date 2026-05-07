import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { categories, seedDb } from "./seed";
import type {
  Comment,
  KycStatus,
  KycSubmission,
  MediaAsset,
  EvidenceItem,
  Report,
  ReviewDecision,
  User,
  UserRole,
  VisionEchoDb,
} from "./types";

const dbPath = path.join(process.cwd(), "data", "visionecho-db.json");
const isServerlessRuntime = Boolean(process.env.VERCEL);

let memoryDb: VisionEchoDb | null = null;
let postgresSchemaReady = false;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  return neon(databaseUrl);
}

function requireSql() {
  const sql = getSql();
  if (!sql) {
    throw new Error("DATABASE_URL is required for persistent production storage.");
  }
  return sql;
}

function createId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

function asJsonArray<T>(value: unknown): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") return JSON.parse(value) as T[];
  return value as T[];
}

function toUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    role: row.role as UserRole,
    status: row.status as User["status"],
    kycStatus: row.kyc_status as KycStatus,
    reporterVerified: Boolean(row.reporter_verified),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function toKyc(row: Record<string, unknown>): KycSubmission {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    fullName: String(row.full_name),
    phone: String(row.phone),
    location: String(row.location),
    beat: String(row.beat),
    experience: String(row.experience),
    idType: String(row.id_type),
    idNumber: String(row.id_number),
    status: row.status as KycStatus,
    reviewerNote: row.reviewer_note ? String(row.reviewer_note) : undefined,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function toReport(row: Record<string, unknown>): Report {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    body: String(row.body),
    categorySlug: String(row.category_slug),
    locationName: String(row.location_name),
    state: String(row.state),
    latitude: row.latitude === null || row.latitude === undefined ? undefined : Number(row.latitude),
    longitude: row.longitude === null || row.longitude === undefined ? undefined : Number(row.longitude),
    sourceType: row.source_type as Report["sourceType"],
    authorId: row.author_id ? String(row.author_id) : undefined,
    authorName: String(row.author_name),
    reporterId: row.reporter_id ? String(row.reporter_id) : undefined,
    status: row.status as Report["status"],
    live: Boolean(row.live),
    priority: row.priority as Report["priority"],
    media: asJsonArray<MediaAsset>(row.media),
    evidence: asJsonArray<EvidenceItem>(row.evidence),
    comments: asJsonArray<Comment>(row.comments),
    reviewTrail: asJsonArray<ReviewDecision>(row.review_trail),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

async function ensurePostgresSchema() {
  if (postgresSchemaReady) return;
  const sql = requireSql();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      role text NOT NULL DEFAULT 'user',
      status text NOT NULL DEFAULT 'active',
      kyc_status text NOT NULL DEFAULT 'not_started',
      reporter_verified boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name text`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name text`;
  await sql`UPDATE users SET name = COALESCE(name, full_name, email, 'VisionEcho user') WHERE name IS NULL`;
  await sql`UPDATE users SET full_name = COALESCE(full_name, name, email, 'VisionEcho user') WHERE full_name IS NULL`;
  await sql`ALTER TABLE users ALTER COLUMN full_name DROP NOT NULL`;
  await sql`ALTER TABLE users ALTER COLUMN name SET NOT NULL`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'not_started'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reporter_verified boolean NOT NULL DEFAULT false`;
  await sql`
    UPDATE users
    SET role = 'admin', updated_at = now()
    WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)
      AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin')
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS kyc_submissions (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      full_name text NOT NULL,
      phone text NOT NULL,
      location text NOT NULL,
      beat text NOT NULL,
      experience text NOT NULL,
      id_type text NOT NULL,
      id_number text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      reviewer_note text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reports (
      id text PRIMARY KEY,
      title text NOT NULL,
      slug text NOT NULL UNIQUE,
      body text NOT NULL,
      category_slug text NOT NULL,
      location_name text NOT NULL,
      state text NOT NULL,
      latitude double precision,
      longitude double precision,
      source_type text NOT NULL,
      author_id text REFERENCES users(id) ON DELETE SET NULL,
      author_name text NOT NULL,
      reporter_id text REFERENCES users(id) ON DELETE SET NULL,
      status text NOT NULL DEFAULT 'in_review',
      live boolean NOT NULL DEFAULT true,
      priority text NOT NULL DEFAULT 'normal',
      media jsonb NOT NULL DEFAULT '[]'::jsonb,
      evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
      comments jsonb NOT NULL DEFAULT '[]'::jsonb,
      review_trail jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status)`;
  await sql`CREATE INDEX IF NOT EXISTS reports_category_idx ON reports(category_slug)`;
  await sql`CREATE INDEX IF NOT EXISTS reports_created_idx ON reports(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS kyc_user_idx ON kyc_submissions(user_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (lower(email))`;
  postgresSchemaReady = true;
}

async function ensureLocalDb() {
  if (memoryDb) return memoryDb;

  try {
    const file = await readFile(dbPath, "utf8");
    memoryDb = JSON.parse(file) as VisionEchoDb;
    memoryDb.users ??= [];
    memoryDb.kycSubmissions ??= [];
    memoryDb.reporters ??= [];
    memoryDb.reports ??= [];
  } catch {
    memoryDb = clone(seedDb);
    await persistLocalDb(memoryDb);
  }

  return memoryDb;
}

async function persistLocalDb(db: VisionEchoDb) {
  await mkdir(path.dirname(dbPath), { recursive: true });
  await writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
}

async function saveLocalDb(mutator: (db: VisionEchoDb) => void) {
  const db = await ensureLocalDb();
  mutator(db);
  await persistLocalDb(db);
  return clone(db);
}

function shouldUsePostgres() {
  return Boolean(process.env.DATABASE_URL);
}

async function listPostgresUsers() {
  await ensurePostgresSchema();
  const sql = requireSql();
  const rows = await sql`SELECT * FROM users ORDER BY created_at DESC`;
  return rows.map(toUser);
}

async function listPostgresKyc() {
  await ensurePostgresSchema();
  const sql = requireSql();
  const rows = await sql`SELECT * FROM kyc_submissions ORDER BY created_at DESC`;
  return rows.map(toKyc);
}

async function listPostgresReports() {
  await ensurePostgresSchema();
  const sql = requireSql();
  const rows = await sql`SELECT * FROM reports ORDER BY created_at DESC`;
  return rows.map(toReport);
}

async function listReporterProfiles(users: User[], kycSubmissions: KycSubmission[], reports: Report[]) {
  return users
    .filter((user) => user.role === "reporter" && user.reporterVerified)
    .map((user) => {
      const kyc = kycSubmissions.find((submission) => submission.userId === user.id && submission.status === "approved");
      const authoredReports = reports.filter((report) => report.authorId === user.id);
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
        verifiedStories: authoredReports.filter((report) => report.status === "verified").length,
        totalStories: authoredReports.length,
        trustScore: 90,
        status: "verified" as const,
      };
    });
}

export async function getDb() {
  if (!shouldUsePostgres()) {
    if (isServerlessRuntime) requireSql();
    return clone(await ensureLocalDb());
  }

  const [users, kycSubmissions, reports] = await Promise.all([listPostgresUsers(), listPostgresKyc(), listPostgresReports()]);
  const reporters = await listReporterProfiles(users, kycSubmissions, reports);
  return { categories, reporters, reports, users, kycSubmissions };
}

export async function saveDb(mutator: (db: VisionEchoDb) => void) {
  if (shouldUsePostgres() || isServerlessRuntime) {
    throw new Error("saveDb is only available for local JSON development storage.");
  }

  return saveLocalDb(mutator);
}

export async function listReports(filters?: {
  category?: string;
  status?: string;
  live?: string;
  q?: string;
  state?: string;
}) {
  const reports = shouldUsePostgres() ? await listPostgresReports() : (await getDb()).reports;
  const q = filters?.q?.toLowerCase().trim();

  return reports
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

export async function getUserById(userId: string) {
  if (shouldUsePostgres()) {
    await ensurePostgresSchema();
    const sql = requireSql();
    const rows = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
    return rows[0] ? toUser(rows[0]) : null;
  }

  const db = await getDb();
  return db.users.find((user) => user.id === userId) ?? null;
}

export async function getUserByEmail(email: string) {
  if (shouldUsePostgres()) {
    await ensurePostgresSchema();
    const sql = requireSql();
    const rows = await sql`SELECT * FROM users WHERE lower(email) = lower(${email}) LIMIT 1`;
    return rows[0] ? toUser(rows[0]) : null;
  }

  const db = await getDb();
  return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function createUser(input: Pick<User, "name" | "email" | "passwordHash">) {
  if (shouldUsePostgres()) {
    await ensurePostgresSchema();
    const sql = requireSql();
    const existing = await sql`SELECT id FROM users WHERE lower(email) = lower(${input.email}) LIMIT 1`;
    if (existing.length > 0) throw new Error("Email already registered");

    const userCount = await sql`SELECT count(*)::int AS count FROM users`;
    const role: UserRole = Number(userCount[0]?.count ?? 0) === 0 ? "admin" : "user";
    const rows = await sql`
      INSERT INTO users (id, full_name, name, email, password_hash, role, status, kyc_status, reporter_verified)
      VALUES (${createId("user")}, ${input.name}, ${input.name}, ${input.email.toLowerCase()}, ${input.passwordHash}, ${role}, 'active', 'not_started', false)
      RETURNING *
    `;
    return toUser(rows[0]);
  }

  let created: User | null = null;
  await saveLocalDb((db) => {
    if (db.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error("Email already registered");
    }

    const now = new Date().toISOString();
    const isFirstUser = db.users.length === 0;
    created = {
      id: createId("user"),
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: isFirstUser ? "admin" : "user",
      status: "active",
      kycStatus: "not_started",
      reporterVerified: false,
      createdAt: now,
      updatedAt: now,
    };
    db.users.push(created);
  });
  if (!created) throw new Error("User could not be created");
  return created as User;
}

export async function listUsers() {
  if (shouldUsePostgres()) return listPostgresUsers();

  const db = await getDb();
  return db.users.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function updateUserRole(userId: string, role: UserRole) {
  if (shouldUsePostgres()) {
    await ensurePostgresSchema();
    const sql = requireSql();
    const rows = await sql`
      UPDATE users
      SET role = ${role},
          reporter_verified = CASE WHEN ${role} = 'reporter' AND kyc_status = 'approved' THEN true ELSE false END,
          updated_at = now()
      WHERE id = ${userId}
      RETURNING *
    `;
    if (!rows[0]) throw new Error("User not found");
    return toUser(rows[0]);
  }

  let updated: User | null = null;
  await saveLocalDb((db) => {
    const user = db.users.find((item) => item.id === userId);
    if (!user) throw new Error("User not found");
    user.role = role;
    user.updatedAt = new Date().toISOString();
    if (role === "reporter" && user.kycStatus !== "approved") {
      user.reporterVerified = false;
    }
    updated = user;
  });
  return updated;
}

export async function submitKyc(userId: string, input: Omit<KycSubmission, "id" | "userId" | "status" | "createdAt" | "updatedAt">) {
  if (shouldUsePostgres()) {
    await ensurePostgresSchema();
    const sql = requireSql();
    const userRows = await sql`SELECT id FROM users WHERE id = ${userId} LIMIT 1`;
    if (!userRows[0]) throw new Error("User not found");
    await sql`DELETE FROM kyc_submissions WHERE user_id = ${userId} AND status = 'pending'`;
    const rows = await sql`
      INSERT INTO kyc_submissions (id, user_id, full_name, phone, location, beat, experience, id_type, id_number, status)
      VALUES (${createId("kyc")}, ${userId}, ${input.fullName}, ${input.phone}, ${input.location}, ${input.beat}, ${input.experience}, ${input.idType}, ${input.idNumber}, 'pending')
      RETURNING *
    `;
    await sql`UPDATE users SET kyc_status = 'pending', updated_at = now() WHERE id = ${userId}`;
    return toKyc(rows[0]);
  }

  let submission: KycSubmission | null = null;
  await saveLocalDb((db) => {
    const now = new Date().toISOString();
    const user = db.users.find((item) => item.id === userId);
    if (!user) throw new Error("User not found");

    submission = {
      ...input,
      id: createId("kyc"),
      userId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    db.kycSubmissions = db.kycSubmissions.filter((item) => item.userId !== userId || item.status !== "pending");
    db.kycSubmissions.unshift(submission);
    user.kycStatus = "pending";
    user.updatedAt = now;
  });
  return submission;
}

export async function reviewKyc(submissionId: string, status: Extract<KycStatus, "approved" | "rejected">, reviewerNote?: string) {
  if (shouldUsePostgres()) {
    await ensurePostgresSchema();
    const sql = requireSql();
    const rows = await sql`
      UPDATE kyc_submissions
      SET status = ${status}, reviewer_note = ${reviewerNote ?? null}, updated_at = now()
      WHERE id = ${submissionId}
      RETURNING *
    `;
    const submission = rows[0] ? toKyc(rows[0]) : null;
    if (!submission) throw new Error("KYC not found");
    await sql`
      UPDATE users
      SET kyc_status = ${status},
          reporter_verified = ${status === "approved"},
          role = CASE WHEN ${status} = 'approved' THEN 'reporter' ELSE role END,
          updated_at = now()
      WHERE id = ${submission.userId}
    `;
    return submission;
  }

  let updated: KycSubmission | null = null;
  await saveLocalDb((db) => {
    const submission = db.kycSubmissions.find((item) => item.id === submissionId);
    if (!submission) throw new Error("KYC not found");
    const user = db.users.find((item) => item.id === submission.userId);
    if (!user) throw new Error("User not found");

    submission.status = status;
    submission.reviewerNote = reviewerNote;
    submission.updatedAt = new Date().toISOString();
    user.kycStatus = status;
    user.reporterVerified = status === "approved";
    if (status === "approved") user.role = "reporter";
    user.updatedAt = submission.updatedAt;
    updated = submission;
  });
  return updated;
}

export async function listKycSubmissions() {
  if (shouldUsePostgres()) return listPostgresKyc();

  const db = await getDb();
  return db.kycSubmissions.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function getReport(idOrSlug: string) {
  if (shouldUsePostgres()) {
    await ensurePostgresSchema();
    const sql = requireSql();
    const rows = await sql`SELECT * FROM reports WHERE id = ${idOrSlug} OR slug = ${idOrSlug} LIMIT 1`;
    return rows[0] ? toReport(rows[0]) : null;
  }

  const db = await getDb();
  return db.reports.find((report) => report.id === idOrSlug || report.slug === idOrSlug) ?? null;
}

export async function createReport(input: Omit<Report, "id" | "slug" | "comments" | "reviewTrail" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const report: Report = {
    ...input,
    id: createId("ve"),
    slug: `${slugify(input.title)}-${Date.now().toString(36)}`,
    comments: [],
    reviewTrail: [],
    createdAt: now,
    updatedAt: now,
  };

  if (shouldUsePostgres()) {
    await ensurePostgresSchema();
    const sql = requireSql();
    const rows = await sql`
      INSERT INTO reports (
        id, title, slug, body, category_slug, location_name, state, latitude, longitude, source_type,
        author_id, author_name, reporter_id, status, live, priority, media, evidence, comments, review_trail
      )
      VALUES (
        ${report.id}, ${report.title}, ${report.slug}, ${report.body}, ${report.categorySlug}, ${report.locationName}, ${report.state},
        ${report.latitude ?? null}, ${report.longitude ?? null}, ${report.sourceType}, ${report.authorId ?? null}, ${report.authorName},
        ${report.reporterId ?? null}, ${report.status}, ${report.live}, ${report.priority}, ${JSON.stringify(report.media)}::jsonb,
        ${JSON.stringify(report.evidence)}::jsonb, '[]'::jsonb, '[]'::jsonb
      )
      RETURNING *
    `;
    return toReport(rows[0]);
  }

  await saveLocalDb((db) => {
    db.reports.unshift(report);
  });

  return report;
}

export async function addComment(reportId: string, input: Pick<Comment, "name" | "text">) {
  const comment: Comment = {
    id: createId("c"),
    reportId,
    name: input.name,
    text: input.text,
    status: "visible",
    createdAt: new Date().toISOString(),
  };

  if (shouldUsePostgres()) {
    const report = await getReport(reportId);
    if (!report) throw new Error("Report not found");
    const comments = [...report.comments, comment];
    const sql = requireSql();
    await sql`
      UPDATE reports
      SET comments = ${JSON.stringify(comments)}::jsonb, updated_at = now()
      WHERE id = ${report.id}
    `;
    return comment;
  }

  await saveLocalDb((db) => {
    const report = db.reports.find((item) => item.id === reportId || item.slug === reportId);
    if (!report) throw new Error("Report not found");
    report.comments.push(comment);
    report.updatedAt = new Date().toISOString();
  });

  return comment;
}

export async function reviewReport(reportId: string, decision: ReviewDecision["decision"], reason?: string) {
  const report = await getReport(reportId);
  if (!report) throw new Error("Report not found");

  const review: ReviewDecision = {
    id: createId("rd"),
    reportId: report.id,
    editorName: "Editor Desk",
    decision,
    reason,
    createdAt: new Date().toISOString(),
  };

  const evidence = [
    ...report.evidence,
    {
      id: createId("e"),
      label: decision === "approved" ? "Editor approved" : decision === "rejected" ? "Editor rejected" : "More info requested",
      type: "editor" as const,
      confidence: decision === "approved" ? 90 : 20,
    },
  ];
  const reviewTrail = [...report.reviewTrail, review];
  const status = decision === "approved" ? "verified" : decision === "rejected" ? "rejected" : "needs_more_info";

  if (shouldUsePostgres()) {
    const sql = requireSql();
    const rows = await sql`
      UPDATE reports
      SET status = ${status}, evidence = ${JSON.stringify(evidence)}::jsonb, review_trail = ${JSON.stringify(reviewTrail)}::jsonb, updated_at = now()
      WHERE id = ${report.id}
      RETURNING *
    `;
    return toReport(rows[0]);
  }

  let updated: Report | null = null;
  await saveLocalDb((db) => {
    const item = db.reports.find((entry) => entry.id === report.id);
    if (!item) throw new Error("Report not found");
    item.status = status;
    item.reviewTrail = reviewTrail;
    item.evidence = evidence;
    item.updatedAt = new Date().toISOString();
    updated = item;
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
