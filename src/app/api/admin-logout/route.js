import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  LEGACY_ADMIN_SESSION_COOKIE,
  getExpiredAdminSessionCookieOptions,
  isSameOriginRequest,
} from "@/lib/adminSession";

export async function POST(request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { success: false },
      {
        status: 403,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  }

  const response = NextResponse.json(
    { success: true },
    {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    },
  );

  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    "",
    getExpiredAdminSessionCookieOptions(),
  );
  response.cookies.set(
    LEGACY_ADMIN_SESSION_COOKIE,
    "",
    getExpiredAdminSessionCookieOptions(),
  );

  return response;
}
