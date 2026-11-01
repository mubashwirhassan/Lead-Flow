import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Lead, LeadActivity } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError, parseBody } from "@/lib/http";

const schema = z.object({
  status: z.enum(["NEW", "CONTACTED", "INTERESTED", "FOLLOW_UP", "WON", "LOST"]),
});

// PATCH /api/v1/leads/:id/status : change lead status (all roles, scoped)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    const body = await parseBody(req, schema);
    await connectDB();
    const lead = await Lead.findOne({ _id: params.id, deletedAt: null });
    if (!lead) return fail("Lead not found", 404);
    if (user.role === "AGENT" && lead.assignedTo?.toString() !== user._id.toString()) {
      return fail("Lead not found", 404);
    }
    const previous = lead.status;
    lead.status = body.status as never;
    await lead.save();
    await LeadActivity.create({
      leadId: lead._id,
      userId: user._id,
      action: "STATUS_CHANGED",
      description: "Status changed from " + previous + " to " + body.status,
      metadata: { from: previous, to: body.status },
    });
    return ok({ lead });
  } catch (e) {
    return handleError(e);
  }
}
