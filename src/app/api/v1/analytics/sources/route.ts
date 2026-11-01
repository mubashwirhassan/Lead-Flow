import { connectDB } from "@/lib/db";
import { Lead } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, handleError } from "@/lib/http";

// GET /api/v1/analytics/sources : source + campaign performance (ADMIN/MANAGER)
export async function GET(req: Request) {
  try {
    await requireRole("ADMIN", "MANAGER");
    await connectDB();
    const p = new URL(req.url).searchParams;
    const from = p.get("from") ? new Date(p.get("from") as string) : new Date(Date.now() - 30 * 86400000);
    const to = p.get("to") ? new Date(p.get("to") as string) : new Date();
    const base = { deletedAt: null, createdAt: { $gte: from, $lte: to } };
    const bySource = await Lead.aggregate([
      { $match: base },
      { $group: { _id: "$sourceId", leads: { $sum: 1 }, won: { $sum: { $cond: [{ $eq: ["$status", "WON"] }, 1, 0] } } } },
      { $sort: { leads: -1 } },
    ]);
    const byCampaign = await Lead.aggregate([
      { $match: base },
      { $group: { _id: "$campaign", leads: { $sum: 1 }, won: { $sum: { $cond: [{ $eq: ["$status", "WON"] }, 1, 0] } } } },
      { $sort: { leads: -1 } },
    ]);
    return ok({ bySource, byCampaign });
  } catch (e) {
    return handleError(e);
  }
}
