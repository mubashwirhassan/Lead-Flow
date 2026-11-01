import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Lead, LeadActivity } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError, parseBody, clientIp } from "@/lib/http";
import { audit } from "@/lib/audit";

const schema = z.object({ assignedTo: z.string().min(1) });

// POST /api/v1/leads/:id/assign : assign a lead (ADMIN + MANAGER)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("ADMIN", "MANAGER");
    const body = await parseBody(req, schema);
    await connectDB();
    const lead = await Lead.findOne({ _id: params.id, deletedAt: null });
    if (!lead) return fail("Lead not found", 404);
    lead.assignedTo = body.assignedTo as never;
    await lead.save();
    await LeadActivity.create({ leadId: lead._id, userId: user._id, action: "ASSIGNED", description: "Lead assigned", metadata: { to: body.assignedTo } });
    await audit({ userId: user._id.toString(), action: "LEAD_ASSIGNED", entityType: "lead", entityId: params.id, ipAddress: clientIp(req) });
    return ok({ lead });
  } catch (e) {
    return handleError(e);
  }
}
