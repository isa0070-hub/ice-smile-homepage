import { NextResponse } from "next/server";

export function middleware(request) {
  const adminAuth = request.cookies.get("admin_auth")?.value;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminAuth || adminAuth !== adminPassword) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};