import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { ForbiddenError } from "@/lib/rbac";
import { UnauthorizedError } from "@/lib/auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Uniform error envelope so clients never see stack traces or secrets. */
export function handleError(e: unknown) {
  if (e instanceof ZodError) {
    return fail(e.issues.map((i) => i.path.join(".") + ": " + i.message).join("; "), 422);
  }
  if (e instanceof UnauthorizedError) return fail("Authentication required", e.status);
  if (e instanceof ForbiddenError) return fail(e.message, e.status);
  if (e instanceof Error && typeof (e as { status?: number }).status === "number") {
    return fail(e.message, (e as { status: number }).status);
  }
  console.error("[api] unhandled error:", e);
  return fail("Internal server error", 500);
}

export async function parseBody<S extends ZodSchema>(req: Request, schema: S) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new Error("Request body must be valid JSON");
  }
  return schema.parse(raw);
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}
