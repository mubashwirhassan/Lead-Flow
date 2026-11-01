import { connectDB } from "@/lib/db";
import { Agent } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, handleError } from "@/lib/http";

// GET /api/v1/agents : list agents with their user info (ADMIN + MANAGER)
export async function GET() {
  try {
    await requireRole("ADMIN", "MANAGER");
    await connectDB();
    const agents = await Agent.find({ isActive: true }).populate("userId", "name email role status").lean();
    return ok({ agents });
  } catch (e) {
    return handleError(e);
  }
}
