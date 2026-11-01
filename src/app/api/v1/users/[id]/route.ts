import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError, parseBody, clientIp } from "@/lib/http";
import { audit } from "@/lib/audit";

const bodySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(["ADMIN", "MANAGER", "AGENT"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

// PATCH /api/v1/users/:id : change name / role / status (ADMIN ONLY)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole("ADMIN");
    const body = await parseBody(req, bodySchema);
    await connectDB();

    if (admin._id.toString() === params.id && (body.status === "DISABLED" || body.role)) {
      return fail("You cannot change your own role or deactivate your own account", 400);
    }

    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = body.name;
    if (body.role) updates.role = body.role;
    if (body.status) updates.status = body.status;
    if (Object.keys(updates).length === 0) return fail("No valid fields to update", 422);

    const updated = await User.findByIdAndUpdate(
      params.id,
      { $set: updates },
      { new: true },
    ).select("-passwordHash -resetTokenHash -resetTokenExpiresAt");
    if (!updated) return fail("User not found", 404);

    await audit({
      userId: admin._id.toString(),
      action: "USER_UPDATED",
      entityType: "user",
      entityId: params.id,
      ipAddress: clientIp(req),
      metadata: updates,
    });
    return ok({ user: updated });
  } catch (e) {
    return handleError(e);
  }
}
