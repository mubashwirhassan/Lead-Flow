import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Followup } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError, parseBody } from "@/lib/http";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  dueAt: z.string().min(10).optional(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
  assignedTo: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    const body = await parseBody(req, patchSchema);
    await connectDB();
    const f = await Followup.findById(params.id);
    if (!f) return fail("Follow-up not found", 404);
    if (user.role === "AGENT" && f.assignedTo?.toString() !== user._id.toString()) return fail("Follow-up not found", 404);
    if (body.title) f.title = body.title;
    if (body.description !== undefined) f.description = body.description;
    if (body.dueAt) f.dueAt = new Date(body.dueAt);
    if (body.status) {
      f.status = body.status as never;
      f.completedAt = body.status === "COMPLETED" ? new Date() : null;
    }
    if (body.assignedTo) f.assignedTo = body.assignedTo as never;
    await f.save();
    return ok({ followup: f });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    await connectDB();
    const f = await Followup.findById(params.id);
    if (!f) return fail("Follow-up not found", 404);
    if (user.role === "AGENT" && f.assignedTo?.toString() !== user._id.toString()) return fail("Follow-up not found", 404);
    await Followup.deleteOne({ _id: params.id });
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
