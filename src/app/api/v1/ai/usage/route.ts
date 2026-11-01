import { connectDB } from "@/lib/db";
import { AiUsage } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, handleError } from "@/lib/http";

// GET /api/v1/ai/usage : AI usage summary for the last 30 days (ADMIN only)
export async function GET() {
  try {
    await requireRole("ADMIN");
    await connectDB();
    const d30 = new Date(Date.now() - 30 * 86400000);
    const rows = await AiUsage.aggregate([
      { $match: { createdAt: { $gte: d30 } } },
      { $group: { _id: "$kind", count: { $sum: 1 }, promptTokens: { $sum: "$promptTokens" }, completionTokens: { $sum: "$completionTokens" }, estCostUsd: { $sum: "$estCostUsd" } } },
      { $sort: { count: -1 } },
    ]);
    const totals = await AiUsage.aggregate([
      { $match: { createdAt: { $gte: d30 } } },
      { $group: { _id: null, total: { $sum: 1 }, promptTokens: { $sum: "$promptTokens" }, completionTokens: { $sum: "$completionTokens" }, estCostUsd: { $sum: "$estCostUsd" } } },
    ]);
    return ok({ rows, totals: totals[0] || null });
  } catch (e) {
    return handleError(e);
  }
}
