import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PAGES = ["/login", "/forgot-password", "/reset-password", "/accept-invite"];

// Edge middleware: coarse page-level guard. Every API route still re-checks the
// session and role on the server (defense in depth).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PAGES.some((p) => pathname.startsWith(p));
  const token = req.cookies.get("leadflow_session")?.value;

  let valid = false;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "");
      await jwtVerify(token, secret);
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (isPublic && valid && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (!isPublic && !valid) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
