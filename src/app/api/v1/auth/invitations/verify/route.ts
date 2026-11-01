import { connectDB } from "@/lib/db";
import { Invitation } from "@/models";
import { hashToken } from "@/lib/tokens";
import { ok, handleError } from "@/lib/http";

// GET /auth/invitations/verify?token=... : checks an invite link is still valid.
export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get("token") || "";
    await connectDB();
    const inv = await Invitation.findOne({ tokenHash: hashToken(token) });
    const valid =
      !!inv &&
      !inv.accepted &&
      !inv.revokedAt &&
      inv.expiresAt > new Date();
    return ok({ valid, email: valid ? inv.email : null, role: valid ? inv.role : null });
  } catch (e) {
    return handleError(e);
  }
}
