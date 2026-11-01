import { connectDB } from "@/lib/db";
import { Lead, Followup } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, handleError } from "@/lib/http";

// GET /api/v1/analytics/agents : agent performance (ADMIN/MANAGER)
export async function GET(req: Request) {
  try {
    await requireRole("ADMIN", "MANAGER");
    await connectDB();
    const p = new URL(req.url).searchParams;
    const from = p.get("from") ? new Date(p.get("from") as string) : new Date(Date.now() - 30 * 86400000);
    const to = p.get("to") ? new Date(p.get("to") as string) : new Date();
    const base = { deletedAt: null, createdAt: { $gte: from, $lte: to } };
    const leads = await Lead.aggregate([
      { $match: { ...base, assignedTo: { $ne: null } } },
      { $group: { _id: "$assignedTo", leads: { $sum: 1 }, won: { $sum: { $cond: [{ $eq: ["$status", "WON"] }, 1, 0] } }, lost: { $sum: { $cond: [{ $eq: ["$status", "LOST"] }, 1, 0] } } } } },
      { $sort: { leads: -1 } },
    ]);
    const followups = await Followup.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: "$assignedTo", total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } } } } },
    ]);
    return ok({ leads, followups });
  } catch (e) {
    return handleError(e);
  }
}
