import { connectDB } from "@/lib/db";
import { ApiKey } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError } from "@/lib/http";
import { audit } from "@/lib/audit";

// DELETE /api/v1/api-keys/:id : revoke a key (ADMIN only)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("ADMIN");
    await connectDB();
    const key = await ApiKey.findById(params.id);
    if (!key) return fail("API key not found", 404);
    if (key.revokedAt) return fail("API key already revoked", 400);
    key.revokedAt = new Date();
    await key.save();
    await audit({ userId: user._id.toString(), action: "API_KEY_REVOKED", entityType: "api_key", entityId: params.id });
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
