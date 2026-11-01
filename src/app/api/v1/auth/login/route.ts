import { z } from "zod";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { verifyPassword, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { ok, fail, handleError, parseBody, clientIp } from "@/lib/http";
import { rateLimit } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Dummy bcrypt hash so unknown emails still pay the compare cost (timing safety).
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.WT8FiFz1CZbBJCJiJXJQ4u0ZJ0mF9Ku";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const { allowed, retryAfter } = rateLimit("login:" + ip, 10, 10 * 60000);
    if (!allowed) return fail("Too many attempts. Retry in " + retryAfter + "s", 429);

    const body = await parseBody(req, bodySchema);
    await connectDB();
    const user = await User.findOne({ email: body.email.toLowerCase() });
    const valid = await verifyPassword(body.password, user?.passwordHash || DUMMY_HASH);
    if (!user || !valid || user.status !== "ACTIVE") {
      await audit({ action: "LOGIN_FAILED", entityType: "user", ipAddress: ip, metadata: {} });
      return fail("Invalid email or password", 401);
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = await createSessionToken(user._id.toString());
    const jar = cookies();
    jar.set(SESSION_COOKIE, token, sessionCookieOptions());
    await audit({ userId: user._id.toString(), action: "LOGIN", entityType: "user", entityId: user._id.toString(), ipAddress: ip });
    return ok({ id: user._id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword });
  } catch (e) {
    return handleError(e);
  }
}
