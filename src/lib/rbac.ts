import { getCurrentUser } from "@/lib/auth";

export class ForbiddenError extends Error {
  status = 403;
  constructor(msg = "You do not have permission to do this") {
    super(msg);
  }
}

export async function requireRole(...roles: Array<"ADMIN" | "MANAGER" | "AGENT">) {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("Not authenticated");
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}

/** Role-aware lead scoping: agents only see leads assigned to them. */
export function leadScopeFilter(user: { _id: unknown; role: string }): Record<string, unknown> {
  if (user.role === "AGENT") return { assignedTo: user._id, deletedAt: null };
  return { deletedAt: null };
}

export function can(user: { role: string }, action: string): boolean {
  const matrix: Record<string, string[]> = {
    "users:manage": ["ADMIN"],
    "invitations:manage": ["ADMIN"],
    "settings:manage": ["ADMIN"],
    "integrations:manage": ["ADMIN"],
    "leads:assign": ["ADMIN", "MANAGER"],
    "leads:viewAll": ["ADMIN", "MANAGER"],
    "leads:delete": ["ADMIN", "MANAGER"],
    "leads:create": ["ADMIN", "MANAGER", "AGENT"],
    "leads:update": ["ADMIN", "MANAGER", "AGENT"],
    "notes:add": ["ADMIN", "MANAGER", "AGENT"],
    "followups:manage": ["ADMIN", "MANAGER", "AGENT"],
    "analytics:view": ["ADMIN", "MANAGER"],
    "analytics:viewOwn": ["ADMIN", "MANAGER", "AGENT"],
    "ai:use": ["ADMIN", "MANAGER", "AGENT"],
    "ai:usage": ["ADMIN"],
    "audit:view": ["ADMIN"],
  };
  return (matrix[action] ?? []).includes(user.role);
}
