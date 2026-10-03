import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig, { authDestination } from "@/lib/auth.config";

export default NextAuth(authConfig).auth((request) => {
  const user = request.auth?.user;
  if (!user?.id) return NextResponse.redirect(new URL("/signin", request.url));
  const pathname = request.nextUrl.pathname;
  const requiredRole = pathname === "/dashboard" || pathname.startsWith("/dashboard/")
    ? "organizer" : pathname === "/admin" || pathname.startsWith("/admin/")
      ? "platform_admin" : "attendee";
  if (user.role !== requiredRole) {
    return NextResponse.redirect(new URL(authDestination(user.role), request.url));
  }
});

export const config = { matcher: ["/dashboard/:path*", "/tickets/:path*", "/settings/:path*", "/admin/:path*"] };
