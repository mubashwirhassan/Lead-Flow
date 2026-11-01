import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Followup } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, handleError, parseBody } from "@/lib/http";

const createSchema = z.object({
  leadId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueAt: z.string().min(10),
  assignedTo: z.string().optional(),
});

// GET /api/v1/followups : list follow-ups (role-scoped)
export async function GET(req: Request) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    await connectDB();
    const p = new URL(req.url).searchParams;
    const filter: Record<string, unknown> = {};
    if (user.role === "AGENT") filter.assignedTo = user._id;
    if (p.get("status")) filter.status = p.get("status");
    if (p.get("leadId")) filter.leadId = p.get("leadId");
    if (p.get("dueBefore")) filter.dueAt = { $lte: new Date(p.get("dueBefore") as string) };
    const items = await Followup.find(filter).sort({ dueAt: 1 }).limit(200).populate("leadId assignedTo", "name email leadNumber title").lean();
    return ok({ items });
  } catch (e) {
    return handleError(e);
  }
}

// POST /api/v1/followups : create a follow-up task
export async function POST(req: Request) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    const body = await parseBody(req, createSchema);
    await connectDB();
    const followup = await Followup.create({
      leadId: body.leadId,
      title: body.title,
      description: body.description || "",
      dueAt: new Date(body.dueAt),
      assignedTo: body.assignedTo || user._id,
    });
    return ok({ followup }, 201);
  } catch (e) {
    return handleError(e);
  }
}
