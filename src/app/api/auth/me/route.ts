import { NextResponse } from "next/server";
import { getCurrentUser, toPublicUser } from "@/lib/auth";
import { getDb, getFirstAdminId, getMyRoleApplication, listKycSubmissions, listRoleApplications, listUsers } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  const db = await getDb();
  const firstAdminId = await getFirstAdminId();

  if (!user) {
    return NextResponse.json({ user: null, users: [], kycSubmissions: [], roleApplications: [], myKyc: null, myRoleApplication: null, firstAdminId });
  }

  const publicUser = toPublicUser(user);
  const users = user.role === "admin" ? (await listUsers()).map(toPublicUser) : [];
  const kycSubmissions = user.role === "admin" ? await listKycSubmissions() : [];
  const roleApplications = user.role === "admin" ? await listRoleApplications() : [];
  const myKyc = db.kycSubmissions.find((submission) => submission.userId === user.id) ?? null;
  const myRoleApplication = await getMyRoleApplication(user.id);

  return NextResponse.json({ user: publicUser, users, kycSubmissions, roleApplications, myKyc, myRoleApplication, firstAdminId });
}
