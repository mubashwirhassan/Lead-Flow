import { connectDB } from "@/lib/db";
import { User, Agent } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, handleError } from "@/lib/http";

// GET /api/v1/users : list users (ADMIN ONLY, enforced on server)
export async function GET() {
  try {
    await requireRole("ADMIN");
    await connectDB();
    const users = await User.find().sort({ createdAt: -1 }).select("-passwordHash -resetTokenHash -resetTokenExpiresAt").lean();
    const agents = await Agent.find().lean();
    return ok({ users, agents });
  } catch (e) {
    return handleError(e);
  }
}
