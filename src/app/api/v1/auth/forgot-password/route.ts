import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { ok, fail, handleError, parseBody, clientIp } from "@/lib/http";
import { rateLimit } from "@/lib/rateLimit";
import { generateToken, hashToken } from "@/lib/tokens";
import { sendEmail, resetEmail } from "@/lib/email";
import { env } from "@/lib/env";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const { allowed, retryAfter } = rateLimit("forgot:" + ip, 5, 15 * 60000);
    if (!allowed) return fail("Too many attempts. Retry in " + retryAfter + "s", 429);

    const body = await parseBody(req, bodySchema);
    await connectDB();
    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (user && user.status === "ACTIVE") {
      const token = generateToken();
      user.resetTokenHash = hashToken(token);
      user.resetTokenExpiresAt = new Date(Date.now() + 60 * 60000); // 1 hour
      await user.save();
      const link = env.APP_URL + "/reset-password?token=" + token;
      const mail = resetEmail(user.name, link);
      const sent = await sendEmail(user.email, mail.subject, mail.html);
      if (!sent) console.log("[reset-link] " + link);
    }
    // Same response either way: never reveal whether the email exists.
    return ok({ message: "If that email exists, a password reset link has been sent." });
  } catch (e) {
    return handleError(e);
  }
}
