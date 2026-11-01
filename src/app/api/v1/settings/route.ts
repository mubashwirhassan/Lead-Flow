import { z } from "zod";
import { connectDB } from "@/lib/db";
import { CompanySettings } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, handleError, parseBody, clientIp } from "@/lib/http";
import { audit } from "@/lib/audit";

const schema = z.object({
  companyName: z.string().min(1).max(150).optional(),
  logoUrl: z.string().max(500).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  timezone: z.string().max(60).optional(),
  currency: z.string().max(10).optional(),
  aiEnabled: z.boolean().optional(),
  knowledgeBase: z.string().max(20000).optional(),
  allowedOrigins: z.array(z.string().max(300)).optional(),
});

export async function GET() {
  try {
    await requireRole("ADMIN", "MANAGER", "AGENT");
    await connectDB();
    let settings = await CompanySettings.findOne();
    if (!settings) settings = await CompanySettings.create({});
    return ok({ settings });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireRole("ADMIN");
    const body = await parseBody(req, schema);
    await connectDB();
    let settings = await CompanySettings.findOne();
    if (!settings) settings = await CompanySettings.create({});
    Object.assign(settings, body);
    await settings.save();
    await audit({ userId: user._id.toString(), action: "SETTINGS_UPDATED", entityType: "settings", ipAddress: clientIp(req), metadata: { fields: Object.keys(body) } });
    return ok({ settings });
  } catch (e) {
    return handleError(e);
  }
}
