import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Lead, LeadNote, LeadActivity } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError, parseBody } from "@/lib/http";

const schema = z.object({ note: z.string().min(1).max(2000) });

// POST /api/v1/leads/:id/notes : add a note (all roles, scoped)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    const body = await parseBody(req, schema);
    await connectDB();
    const lead = await Lead.findOne({ _id: params.id, deletedAt: null });
    if (!lead) return fail("Lead not found", 404);
    if (user.role === "AGENT" && lead.assignedTo?.toString() !== user._id.toString()) {
      return fail("Lead not found", 404);
    }
    const note = await LeadNote.create({ leadId: lead._id, userId: user._id, note: body.note });
    await LeadActivity.create({ leadId: lead._id, userId: user._id, action: "NOTE_ADDED", description: body.note.slice(0, 120) });
    return ok({ note }, 201);
  } catch (e) {
    return handleError(e);
  }
}
