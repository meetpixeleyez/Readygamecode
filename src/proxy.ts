import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken, verifyRefreshToken, createAccessToken, type JwtPayload } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Exclude static assets and api routes (api routes can be protected individually)
  if (path.startsWith("/_next") || path.startsWith("/assets") || path.includes(".")) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get("rgc_access")?.value;
  let payload: JwtPayload | null = null;

  if (token) {
    payload = await verifyAccessToken(token);
  }

  let newAccessToken: string | null = null;
  // Fallback to refresh token if access token is missing or expired
  if (!payload) {
    const refreshToken = request.cookies.get("rgc_refresh")?.value;
    if (refreshToken) {
      payload = await verifyRefreshToken(refreshToken);
      if (payload) {
        newAccessToken = await createAccessToken(payload);
      }
    }
  }

  const role = payload?.role ? String(payload.role).toLowerCase() : null;
  const isAdmin = role === "admin";

  const createResponse = (res: NextResponse) => {
    if (newAccessToken) {
      res.cookies.set("rgc_access", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }
    return res;
  };

  // --- Admin Route Protection ---
  const isAdminRoute = path.startsWith("/admin") && !path.startsWith("/admin/login");
  const isAdminApiRoute = path.startsWith("/api/admin") && !path.startsWith("/api/admin/login");

  if (isAdminRoute || isAdminApiRoute) {
    if (!payload || !isAdmin) {
      // Not an admin
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: payload ? 403 : 401 });
      }
      return createResponse(NextResponse.redirect(new URL(payload ? "/" : "/admin/login", request.url)));
    }
  }

  // --- Consumer Route Protection (Block Admins) ---
  const consumerRoutes = [
    "/cart", "/checkout", "/dashboard", "/seller",
    "/api/cart", "/api/checkout", "/api/refunds"
  ];
  const isConsumerRoute = consumerRoutes.some(route => path.startsWith(route));

  if (isConsumerRoute && isAdmin) {
    // Admins are not allowed in consumer routes
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden: Admins cannot access consumer endpoints" }, { status: 403 });
    }
    return createResponse(NextResponse.redirect(new URL("/admin", request.url)));
  }

  return createResponse(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

