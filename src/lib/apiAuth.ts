import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ApiKey } from "@/models";
import { hashToken } from "@/lib/tokens";
import { rateLimit } from "@/lib/rateLimit";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type SessionUser = {
  _id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "AGENT";
  status: string;
  mustChangePassword?: boolean;
};

/** Route-handler guard: requires an authenticated session user. */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Authentication required");
  return user as unknown as SessionUser;
}

/** External API authentication via a revocable API key (Authorization: Bearer lf_...). */
export async function authenticateApiKey(req: Request): Promise<{ keyId: string }> {
  const auth = req.headers.get("authorization") || "";
  const raw = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!raw) throw new HttpError(401, "Missing API key");
  const { allowed } = rateLimit("apikey:" + raw.slice(0, 12), 300, 60000);
  if (!allowed) throw new HttpError(429, "API key rate limit exceeded");
  await connectDB();
  const keyHash = hashToken(raw);
  const key = await ApiKey.findOne({ keyHash, revokedAt: null });
  if (!key) throw new HttpError(401, "Invalid or revoked API key");
  if (key.expiresAt && key.expiresAt < new Date()) throw new HttpError(401, "API key expired");
  key.lastUsedAt = new Date();
  await key.save();
  return { keyId: key._id.toString() };
}

/** Shared filter to hide soft-deleted docs. */
export function notDeleted(): Record<string, unknown> {
  return { deletedAt: null };
}
