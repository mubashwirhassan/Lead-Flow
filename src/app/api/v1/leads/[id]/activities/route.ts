import { connectDB } from "@/lib/db";
import { Lead, LeadActivity } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError } from "@/lib/http";

// GET /api/v1/leads/:id/activities : activity timeline (all roles, scoped)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    await connectDB();
    const lead = await Lead.findOne({ _id: params.id, deletedAt: null });
    if (!lead) return fail("Lead not found", 404);
    if (user.role === "AGENT" && lead.assignedTo?.toString() !== user._id.toString()) {
      return fail("Lead not found", 404);
    }
    const activities = await LeadActivity.find({ leadId: params.id }).sort({ createdAt: -1 }).limit(200).populate("userId", "name").lean();
    return ok({ activities });
  } catch (e) {
    return handleError(e);
  }
}
