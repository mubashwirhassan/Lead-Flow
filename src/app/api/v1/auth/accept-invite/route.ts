import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Invitation, User, Agent } from "@/models";
import { hashPassword } from "@/lib/auth";
import { ok, fail, handleError, parseBody, clientIp } from "@/lib/http";
import { rateLimit } from "@/lib/rateLimit";
import { hashToken } from "@/lib/tokens";
import { audit } from "@/lib/audit";

const bodySchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const { allowed, retryAfter } = rateLimit("invite:" + ip, 10, 15 * 60000);
    if (!allowed) return fail("Too many attempts. Retry in " + retryAfter + "s", 429);

    const body = await parseBody(req, bodySchema);
    await connectDB();
    const inv = await Invitation.findOne({ tokenHash: hashToken(body.token) });
    if (!inv || inv.accepted || inv.revokedAt || inv.expiresAt < new Date()) {
      return fail("This invitation is invalid, expired, or already used", 400);
    }
    const user = await User.findById(inv.userId);
    if (!user || user.status !== "INVITED") {
      return fail("This invitation is no longer valid", 400);
    }
    user.passwordHash = await hashPassword(body.password);
    user.status = "ACTIVE";
    user.mustChangePassword = false;
    await user.save();
    inv.accepted = true;
    inv.acceptedAt = new Date();
    await inv.save();
    // Agent profile is created when an AGENT or MANAGER accepts the invite
    // (agents are created only via the invite flow)
    if (user.role === "AGENT" || user.role === "MANAGER") {
      await Agent.create({ userId: user._id, department: "", designation: "" });
    }
    await audit({ userId: user._id.toString(), action: "INVITE_ACCEPTED", entityType: "invitation", entityId: inv._id.toString(), ipAddress: ip });
    return ok({ success: true, email: user.email });
  } catch (e) {
    return handleError(e);
  }
}
