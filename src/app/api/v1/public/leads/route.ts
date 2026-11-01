import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Lead, LeadSource, ApiKey, LeadActivity } from "@/models";
import { ok, fail, handleError, parseBody, clientIp } from "@/lib/http";
import { rateLimit } from "@/lib/rateLimit";
import { hashToken } from "@/lib/tokens";

const publicSchema = z.object({
  name: z.string().min(2).max(150),
  phone: z.string().max(30).optional(),
  email: z.string().email().or(z.literal("")).optional(),
  company: z.string().max(150).optional(),
  service_required: z.string().max(500).optional(),
  budget: z.number().nonnegative().optional(),
  currency: z.string().max(10).optional(),
  message: z.string().max(5000).optional(),
  source: z.string().max(100).optional(),
  campaign: z.string().max(100).optional(),
  landing_page: z.string().url().max(500).optional(),
});

async function nextLeadNumber(): Promise<string> {
  const count = await Lead.countDocuments({});
  return "LF-" + new Date().getFullYear() + "-" + String(count + 1).padStart(6, "0");
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const { allowed, retryAfter } = rateLimit("public-leads:" + ip, 5, 60000);
    if (!allowed) return fail("Too many requests. Retry in " + retryAfter + "s", 429);

    const body = await parseBody(req, publicSchema);
    if (!body.phone && !body.email) return fail("At least one contact method (phone or email) is required", 422);

    // Simple bot protection: honeypot field must stay empty. Silently drop bots.
    if ((body as Record<string, unknown>).website_url) return ok({ success: true });

    await connectDB();

    // Idempotency: same client-supplied key returns the original lead
    const idemKey = req.headers.get("idempotency-key") || "";
    if (idemKey) {
      const existing = await LeadActivity.findOne({ action: "CREATED", "metadata.idemKey": idemKey }).sort({ createdAt: -1 }).lean();
      if (existing) {
        return ok({ success: true, duplicate: true, leadNumber: (existing.metadata as Record<string, unknown>).leadNumber });
      }
    }

    // Authentication: either an API key (Bearer lf_...) or origin allowlist for website forms
    const auth = req.headers.get("authorization") || "";
    let sourceType = "WEBSITE";
    let keyId: string | null = null;
    if (auth.startsWith("Bearer ")) {
      const raw = auth.slice(7).trim();
      const key = await ApiKey.findOne({ keyHash: hashToken(raw), revokedAt: null });
      if (!key) return fail("Invalid or revoked API key", 401);
      if (key.expiresAt && key.expiresAt < new Date()) return fail("API key expired", 401);
      key.lastUsedAt = new Date();
      await key.save();
      keyId = key._id.toString();
      sourceType = "API";
    } else {
      const origin = req.headers.get("origin") || "";
      const websiteSource = await LeadSource.findOne({ type: "WEBSITE", isActive: true });
      const allowedOrigins = websiteSource?.allowedOrigins || [];
      const originAllowed = allowedOrigins.length === 0 || allowedOrigins.includes(origin);
      if (!originAllowed) return fail("Origin not allowed", 403);
    }

    const source = await LeadSource.findOne({ type: sourceType, isActive: true });
    if (!source) return fail("Lead source not configured", 500);

    // Duplicate warning support (never auto-merge; flag only)
    const dupeOr: Record<string, string>[] = [];
    if (body.phone) dupeOr.push({ phone: body.phone });
    if (body.email) dupeOr.push({ email: body.email });
    const dupe = dupeOr.length > 0 ? await Lead.findOne({ deletedAt: null, $or: dupeOr }).lean() : null;

    const lead = await Lead.create({
      leadNumber: await nextLeadNumber(),
      name: body.name,
      phone: body.phone || "",
      email: body.email || "",
      company: body.company || "",
      serviceRequired: body.service_required || "",
      budget: body.budget ?? null,
      currency: body.currency || "BDT",
      message: body.message || "",
      sourceId: source._id,
      campaign: body.campaign || "",
      status: "NEW",
      priority: "MEDIUM",
      assignedTo: null,
      possibleDuplicateOf: dupe?._id?.toString() || null,
    });

    await LeadActivity.create({
      leadId: lead._id,
      userId: null,
      action: "CREATED",
      description: "Lead received via " + sourceType,
      metadata: { idemKey: idemKey || undefined, leadNumber: lead.leadNumber, sourceType, keyId },
    });

    return ok({ success: true, leadNumber: lead.leadNumber }, 201);
  } catch (e) {
    return handleError(e);
  }
}

// CORS preflight for browser form posts
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key, Authorization",
    },
  });
}
