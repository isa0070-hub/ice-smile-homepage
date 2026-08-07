import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  isSameOriginRequest,
} from "@/lib/adminSession";

export async function POST(request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
