import { connectDB } from "@/lib/db";
import { User, Invitation } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError, clientIp } from "@/lib/http";
import { generateToken, hashToken } from "@/lib/tokens";
import { sendEmail, inviteEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { audit } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole("ADMIN");
    await connectDB();
    const inv = await Invitation.findById(params.id);
    if (!inv) return fail("Invitation not found", 404);
    if (inv.accepted || inv.revokedAt) return fail("This invitation is already accepted or revoked", 400);
    const user = await User.findById(inv.userId);
    if (!user) return fail("Invited user no longer exists", 404);

    const token = generateToken();
    inv.tokenHash = hashToken(token);
    inv.expiresAt = new Date(Date.now() + env.INVITE_TTL_HOURS * 3600000);
    await inv.save();

    const link = env.APP_URL + "/accept-invite?token=" + token;
    const mail = inviteEmail(user.name, link, env.INVITE_TTL_HOURS);
    const sent = await sendEmail(inv.email, mail.subject, mail.html);
    await audit({ userId: admin._id.toString(), action: "INVITE_RESENT", entityType: "invitation", entityId: inv._id.toString(), ipAddress: clientIp(req) });
    return ok({ success: true, inviteLink: sent ? null : link });
  } catch (e) {
    return handleError(e);
  }
}
