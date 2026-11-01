import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ApiKey } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, handleError, parseBody, clientIp } from "@/lib/http";
import { generateApiKey, hashToken } from "@/lib/tokens";
import { audit } from "@/lib/audit";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.string().min(10).optional(),
});

// GET /api/v1/api-keys : list keys (hashes never returned)
export async function GET() {
  try {
    await requireRole("ADMIN");
    await connectDB();
    const keys = await ApiKey.find().select("-keyHash").sort({ createdAt: -1 }).lean();
    return ok({ keys });
  } catch (e) {
    return handleError(e);
  }
}

// POST /api/v1/api-keys : create a key; raw value shown once, only hash stored
export async function POST(req: Request) {
  try {
    const user = await requireRole("ADMIN");
    const body = await parseBody(req, createSchema);
    await connectDB();
    const raw = generateApiKey();
    const key = await ApiKey.create({
      name: body.name,
      keyHash: hashToken(raw),
      prefix: raw.slice(0, 8),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    });
    await audit({ userId: user._id.toString(), action: "API_KEY_CREATED", entityType: "api_key", entityId: key._id.toString(), ipAddress: clientIp(req) });
    return ok({ id: key._id, name: key.name, prefix: key.prefix, expiresAt: key.expiresAt, apiKey: raw, notice: "Save this key now - it will not be shown again" }, 201);
  } catch (e) {
    return handleError(e);
  }
}
