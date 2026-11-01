import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Lead, LeadActivity } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError, parseBody, clientIp } from "@/lib/http";
import { audit } from "@/lib/audit";

const patchSchema = z.object({
  name: z.string().min(1).max(150).optional(),
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

async function getScopedLead(userId: string, role: string, id: string) {
  const lead = await Lead.findOne({ _id: id, deletedAt: null });
  if (!lead) return null;
  if (role === "AGENT" && lead.assignedTo?.toString() !== userId) return null;
  return lead;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    await connectDB();
    const lead = await getScopedLead(user._id.toString(), user.role, params.id);
    if (!lead) return fail("Lead not found", 404);
    await lead.populate("assignedTo sourceId", "name email role type");
    return ok({ lead });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    const body = await parseBody(req, patchSchema);
    await connectDB();
    const lead = await getScopedLead(user._id.toString(), user.role, params.id);
    if (!lead) return fail("Lead not found", 404);
    Object.assign(lead, body);
    await lead.save();
    await LeadActivity.create({ leadId: lead._id, userId: user._id, action: "UPDATED", description: "Lead details updated", metadata: body });
    return ok({ lead });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("ADMIN", "MANAGER");
    await connectDB();
    const lead = await Lead.findOne({ _id: params.id, deletedAt: null });
    if (!lead) return fail("Lead not found", 404);
    lead.deletedAt = new Date();
    await lead.save();
    await LeadActivity.create({ leadId: lead._id, userId: user._id, action: "SOFT_DELETED", description: "Lead soft-deleted" });
    await audit({ userId: user._id.toString(), action: "LEAD_DELETED", entityType: "lead", entityId: params.id, ipAddress: clientIp(req) });
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
