import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models";

/** Fire-and-forget audit trail. Never throws into the request path. */
export async function audit(entry: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await connectDB();
    await AuditLog.create({
      userId: entry.userId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      ipAddress: entry.ipAddress ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (e) {
    console.error("[audit] failed to write log:", e);
  }
}
