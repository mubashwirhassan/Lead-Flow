import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
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
    const { allowed, retryAfter } = rateLimit("reset:" + ip, 5, 15 * 60000);
    if (!allowed) return fail("Too many attempts. Retry in " + retryAfter + "s", 429);

    const body = await parseBody(req, bodySchema);
    await connectDB();
    const hashed = hashToken(body.token);
    const user = await User.findOne({ resetTokenHash: hashed, status: "ACTIVE" });
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      return fail("Invalid or expired reset link", 400);
    }
    user.passwordHash = await hashPassword(body.password);
    user.resetTokenHash = "";
    user.resetTokenExpiresAt = null;
    user.mustChangePassword = false;
    await user.save();
    await audit({
      userId: user._id.toString(),
      action: "PASSWORD_RESET",
      entityType: "user",
      entityId: user._id.toString(),
      ipAddress: ip,
    });
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
