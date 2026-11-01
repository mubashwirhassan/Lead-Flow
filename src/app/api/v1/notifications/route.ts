import { connectDB } from "@/lib/db";
import { Notification } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, handleError } from "@/lib/http";

// GET /api/v1/notifications : my notifications, newest first
export async function GET(req: Request) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    await connectDB();
    const items = await Notification.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50).lean();
    const unread = await Notification.countDocuments({ userId: user._id, isRead: false });
    return ok({ items, unread });
  } catch (e) {
    return handleError(e);
  }
}

// PATCH /api/v1/notifications : mark all my notifications read
export async function PATCH(req: Request) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    await connectDB();
    await Notification.updateMany({ userId: user._id, isRead: false }, { $set: { isRead: true } });
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
