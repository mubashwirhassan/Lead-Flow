import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User, Invitation } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError, parseBody, clientIp } from "@/lib/http";
import { generateToken, hashToken } from "@/lib/tokens";
import { sendEmail, inviteEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { audit } from "@/lib/audit";

const bodySchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(["ADMIN", "MANAGER", "AGENT"]),
});

export async function POST(req: Request) {
  try {
    const admin = await requireRole("ADMIN");
    const body = await parseBody(req, bodySchema);
    await connectDB();
    const email = body.email.toLowerCase();
    if (await User.findOne({ email })) {
      return fail("A user with this email already exists", 409);
    }
    if (await Invitation.findOne({ email, accepted: false, revokedAt: null })) {
      return fail("A pending invitation already exists for this email", 409);
    }

    const token = generateToken();
    const user = await User.create({
      name: body.name,
      email,
      role: body.role,
      status: "INVITED",
      passwordHash: "",
      invitedBy: admin._id,
    });
    const inv = await Invitation.create({
      userId: user._id,
      email,
      role: body.role,
      tokenHash: hashToken(token),
      invitedBy: admin._id,
      expiresAt: new Date(Date.now() + env.INVITE_TTL_HOURS * 3600000),
    });

    const link = env.APP_URL + "/accept-invite?token=" + token;
    const mail = inviteEmail(body.name, link, env.INVITE_TTL_HOURS);
    const sent = await sendEmail(email, mail.subject, mail.html);
    await audit({
      userId: admin._id.toString(),
      action: "INVITE_CREATED",
      entityType: "user",
      entityId: user._id.toString(),
      ipAddress: clientIp(req),
      metadata: { email, role: body.role, emailSent: sent },
    });

    // If email is not configured, the admin can copy the invite link and share it manually.
    return ok({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
      invitation: { id: inv._id, email, expiresAt: inv.expiresAt },
      inviteLink: sent ? null : link,
    });
  } catch (e) {
    return handleError(e);
  }
}
