import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Lead, LeadSource } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError, parseBody, clientIp } from "@/lib/http";
import { audit } from "@/lib/audit";

const createSchema = z.object({
  name: z.string().min(1).max(150),
  phone: z.string().max(30).optional(),
  email: z.string().email().or(z.literal("")).optional(),
  company: z.string().max(150).optional(),
  serviceRequired: z.string().max(500).optional(),
  budget: z.number().nonnegative().optional(),
  currency: z.string().max(10).optional(),
  message: z.string().max(5000).optional(),
  campaign: z.string().max(100).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedTo: z.string().optional(),
  sourceId: z.string().optional(),
});

// GET /api/v1/leads : list/filter with search, filters, sorting, pagination (role-scoped)
export async function GET(req: Request) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    await connectDB();
    const p = new URL(req.url).searchParams;
    const page = Math.max(1, Number(p.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(p.get("limit") || 20)));
    const q = p.get("q") || "";
    const sortField = p.get("sort") || "createdAt";
    const dir = p.get("direction") === "asc" ? 1 : -1;
    const filter: Record<string, unknown> = { deletedAt: null };
    if (user.role === "AGENT") filter.assignedTo = user._id;
    if (p.get("status")) filter.status = p.get("status");
    if (p.get("sourceId")) filter.sourceId = p.get("sourceId");
    if (p.get("assignedTo")) filter.assignedTo = p.get("assignedTo");
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
      ];
    }
    const sortObj: Record<string, 1 | -1> = {};
    sortObj[sortField] = dir;
    const [items, total] = await Promise.all([
      Lead.find(filter).sort(sortObj).skip((page - 1) * limit).limit(limit).populate("assignedTo sourceId", "name email type").lean(),
      Lead.countDocuments(filter),
    ]);
    return ok({ items, total, page, limit });
  } catch (e) {
    return handleError(e);
  }
}

async function nextLeadNumber(): Promise<string> {
  const count = await Lead.countDocuments({});
  return "LF-" + new Date().getFullYear() + "-" + String(count + 1).padStart(6, "0");
}

// POST /api/v1/leads : create manually (requires phone or email)
export async function POST(req: Request) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    const body = await parseBody(req, createSchema);
    await connectDB();
    if (!body.phone && !body.email) return fail("At least one contact method (phone or email) is required", 422);
    const sourceId = body.sourceId || (await LeadSource.findOne({ type: "MANUAL", isActive: true }))?._id?.toString();
    if (!sourceId) return fail("No lead source configured. Run the seed script.", 500);
    const lead = await Lead.create({ ...body, sourceId, leadNumber: await nextLeadNumber() });
    await audit({ userId: user._id.toString(), action: "LEAD_CREATED", entityType: "lead", entityId: lead._id.toString(), ipAddress: clientIp(req) });
    return ok({ lead }, 201);
  } catch (e) {
    return handleError(e);
  }
}
