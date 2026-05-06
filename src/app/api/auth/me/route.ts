import { NextResponse } from "next/server";
import { getCurrentUser, toPublicUser } from "@/lib/auth";
import { getDb, listKycSubmissions, listUsers } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  const db = await getDb();

  if (!user) {
    return NextResponse.json({ user: null, users: [], kycSubmissions: [], myKyc: null });
  }

  const publicUser = toPublicUser(user);
  const users = user.role === "admin" ? (await listUsers()).map(toPublicUser) : [];
  const kycSubmissions = user.role === "admin" ? await listKycSubmissions() : [];
  const myKyc = db.kycSubmissions.find((submission) => submission.userId === user.id) ?? null;

  return NextResponse.json({ user: publicUser, users, kycSubmissions, myKyc });
}
