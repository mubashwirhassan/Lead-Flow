import { ok, handleError } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return ok({ user: null }, 200);
    return ok({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
