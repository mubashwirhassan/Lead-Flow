import { connectDB } from "@/lib/db";
import { Invitation } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError } from "@/lib/http";
import { audit } from "@/lib/audit";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole("ADMIN");
    await connectDB();
    const inv = await Invitation.findById(params.id);
    if (!inv) return fail("Invitation not found", 404);
    if (inv.accepted) return fail("This invitation was already accepted", 400);
    inv.revokedAt = new Date();
    await inv.save();
    await audit({ userId: admin._id.toString(), action: "INVITE_REVOKED", entityType: "invitation", entityId: inv._id.toString() });
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
