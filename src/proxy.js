import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  LEGACY_ADMIN_SESSION_COOKIE,
  getExpiredAdminSessionCookieOptions,
  verifyAdminSessionToken,
} from "./lib/adminSession";

export function proxy(request) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!verifyAdminSessionToken(session)) {
    const response = NextResponse.redirect(new URL("/login", request.url));

    if (session) {
      response.cookies.set(
        ADMIN_SESSION_COOKIE,
        "",
        getExpiredAdminSessionCookieOptions(),
      );
    }

    if (request.cookies.has(LEGACY_ADMIN_SESSION_COOKIE)) {
      response.cookies.set(
        LEGACY_ADMIN_SESSION_COOKIE,
        "",
        getExpiredAdminSessionCookieOptions(),
      );
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
