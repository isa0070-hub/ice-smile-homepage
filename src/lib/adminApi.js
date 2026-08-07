import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  isSameOriginRequest,
  verifyAdminSessionToken,
} from "@/lib/adminSession";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export function adminErrorResponse(message, status = 500) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: NO_STORE_HEADERS },
  );
}
export function adminSuccessResponse(payload = {}, status = 200) {
  return NextResponse.json(
    { success: true, ...payload },
    { status, headers: NO_STORE_HEADERS },
  );
}

export function requireAdminRequest(
  request,
  { requireSameOrigin = false } = {},
) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!verifyAdminSessionToken(session)) {
    return adminErrorResponse("관리자 인증이 필요합니다.", 401);
  }

  if (requireSameOrigin && !isSameOriginRequest(request)) {
    return adminErrorResponse("허용되지 않은 요청입니다.", 403);
  }

  return null;
}

export async function hasAdminServerSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  return verifyAdminSessionToken(session);
}
