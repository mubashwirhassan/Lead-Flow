import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env, isProd } from "@/lib/env";
import { connectDB } from "@/lib/db";
import { User } from "@/models";

export const SESSION_COOKIE = "leadflow_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h inactivity window

const secret = new TextEncoder().encode(env.AUTH_SECRET);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false; // invited users have no password yet
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL_SECONDS + "s")
    .sign(secret);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Current user for server components / route handlers via next/headers cookies. */
export async function getCurrentUser() {
  const jar = cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = await verifySessionToken(token);
  if (!userId) return null;
  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user || user.status !== "ACTIVE") return null;
  return user;
}

export type Role = "ADMIN" | "MANAGER" | "AGENT";

export class UnauthorizedError extends Error {
  status = 401;
}
