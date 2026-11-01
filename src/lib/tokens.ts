import crypto from "crypto";

/** Generate a URL-safe random token. Only the SHA-256 hash is ever stored. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Hash a token for storage. Same input always produces the same hash (verifiable). */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** API keys reuse the same hashing rule: raw value shown once, only the hash stored. */
export function generateApiKey(): string {
  return "lf_" + crypto.randomBytes(24).toString("hex");
}
