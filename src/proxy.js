import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "./lib/adminSession";

export function proxy(request) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!verifyAdminSessionToken(session)) {
    const response = NextResponse.redirect(new URL("/login", request.url));

    if (session) {
      response.cookies.set(ADMIN_SESSION_COOKIE, "", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
