import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Agent } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError, parseBody } from "@/lib/http";

const bodySchema = z.object({
  department: z.string().max(100).optional(),
  designation: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

// PATCH /api/v1/agents/:id : edit agent profile (agents created only via invite flow)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const body = await parseBody(req, bodySchema);
    await connectDB();
    const updates: Record<string, unknown> = {};
    if (body.department !== undefined) updates.department = body.department;
    if (body.designation !== undefined) updates.designation = body.designation;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (Object.keys(updates).length === 0) return fail("No valid fields to update", 422);
    const updated = await Agent.findByIdAndUpdate(params.id, { $set: updates }, { new: true });
    if (!updated) return fail("Agent not found", 404);
    return ok({ agent: updated });
  } catch (e) {
    return handleError(e);
  }
}
