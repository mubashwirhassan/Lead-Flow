import { cookies } from "next/headers";
import { ok } from "@/lib/http";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const jar = cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return ok({ success: true });
}
