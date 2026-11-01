import { connectDB } from "@/lib/db";
import { Lead, Followup } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, handleError } from "@/lib/http";

// GET /api/v1/analytics/overview : dashboard metrics, role-scoped, date-filterable
export async function GET(req: Request) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    await connectDB();
    const p = new URL(req.url).searchParams;
    const from = p.get("from") ? new Date(p.get("from") as string) : new Date(Date.now() - 30 * 86400000);
    const to = p.get("to") ? new Date(p.get("to") as string) : new Date();
    const scope = user.role === "AGENT" ? { assignedTo: user._id } : {};
    const base = { deletedAt: null, createdAt: { $gte: from, $lte: to }, ...scope };

    const counts = await Lead.aggregate([
      { $match: base },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const byStatus: Record<string, number> = {};
    for (const c of counts) byStatus[c._id] = c.count;

    const trend = await Lead.aggregate([
      { $match: base },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 }, won: { $sum: { $cond: [{ $eq: ["$status", "WON"] }, 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]);

    const sources = await Lead.aggregate([
      { $match: base },
      { $group: { _id: "$sourceId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const pending = await Followup.countDocuments({ status: "PENDING", dueAt: { $lte: new Date() } });
    const overdue = await Followup.countDocuments({ status: "PENDING", dueAt: { $lt: new Date() } });
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    const won = byStatus.WON || 0;

    return ok({
      byStatus,
      total,
      won,
      lost: byStatus.LOST || 0,
      conversionRate: total > 0 ? Number(((won / total) * 100).toFixed(1)) : 0,
      trend,
      sources,
      pendingFollowups: pending,
      overdueFollowups: overdue,
    });
  } catch (e) {
    return handleError(e);
  }
}
