import { NextResponse } from "next/server";
import { verifyAdminSessionToken } from "./src/lib/adminSession";

export async function middleware(request) {
  const adminAuth = request.cookies.get("admin_auth")?.value;

  if (!(await verifyAdminSessionToken(adminAuth))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
