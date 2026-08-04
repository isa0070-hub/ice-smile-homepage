import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/adminSession";

export async function POST(request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("admin_auth", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
