import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { PublicUser, User } from "./types";
import { getUserById } from "./db";

const COOKIE_NAME = "visionecho_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const sessionSecret = process.env.AUTH_SECRET ?? "visionecho-dev-secret-change-before-production";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export async function createSession(userId: string) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${expiresAt}.${randomBytes(8).toString("hex")}`;
  const signature = createHmac("sha256", sessionSecret).update(payload).digest("hex");
  const token = `${payload}.${signature}`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userId, expiresAt, nonce, signature] = parts;
  const payload = `${userId}.${expiresAt}.${nonce}`;
  const expected = createHmac("sha256", sessionSecret).update(payload).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length || !timingSafeEqual(expectedBuffer, signatureBuffer)) return null;
  if (Number(expiresAt) < Date.now()) return null;

  const user = await getUserById(userId);
  if (user?.status !== "active") return null;
  return user;
}

export function canEdit(user: PublicUser | User | null) {
  return user?.status === "active" && (user.role === "editor" || user.role === "admin");
}

export function canAdmin(user: PublicUser | User | null) {
  return user?.status === "active" && user.role === "admin";
}
