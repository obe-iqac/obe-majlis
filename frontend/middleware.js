// middleware.ts
import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("token")?.value;

  const path = url.pathname;

  // ✅ Public route (login page)
  if (path === "/") {
    return NextResponse.next();
  }

  // 🔒 Protected routes mapping
  const roleRoutes = {
    "/super_admin": "SUPER_ADMIN",
    "/college_admin": "COLLEGE_ADMIN",
    "/hod": "HOD",
    "/teacher": "TEACHER",
  };

  // Find matching route
  const matchedRoute = Object.keys(roleRoutes).find((route) =>
    path.startsWith(route),
  );

  // If route is protected
  if (matchedRoute) {
    if (!token) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    try {
      // 🔐 Decode token
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString(),
      );

      const requiredRole = roleRoutes[matchedRoute];
      console.log("Decoded token:", payload);
      // ❌ Role mismatch
      if (payload.role !== requiredRole) {
        url.pathname = "/";
        return NextResponse.redirect(url);
      }

      // ✅ Allowed
      return NextResponse.next();
    } catch (err) {
      console.error("Invalid token:", err);
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Apply to all protected routes
export const config = {
  matcher: [
    "/super_admin/:path*",
    "/college_admin/:path*",
    "/hod/:path*",
    "/teacher/:path*",
  ],
};
