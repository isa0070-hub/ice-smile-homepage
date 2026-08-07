import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  isAdminSessionConfigured,
  isSameOriginRequest,
} from "@/lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LOGIN_BODY_SIZE = 2048;

function secureEqual(actual, expected) {
  if (typeof actual !== "string" || typeof expected !== "string") {
    return false;
  }

  const actualDigest = createHash("sha256").update(actual).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();

  return timingSafeEqual(actualDigest, expectedDigest);
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { success: false, message: "허용되지 않은 요청입니다." },
      { status: 403 },
    );
  }

  if (
    Number(request.headers.get("content-length") || 0) > MAX_LOGIN_BODY_SIZE
  ) {
    return NextResponse.json(
      { success: false, message: "요청 데이터가 너무 큽니다." },
      { status: 413 },
    );
  }

  let credentials;

  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const adminId = credentials?.adminId;
  const adminPassword = credentials?.adminPassword;

  if (
    secureEqual(adminId, process.env.ADMIN_ID) &&
    secureEqual(adminPassword, process.env.ADMIN_PASSWORD)
  ) {
    if (!isAdminSessionConfigured()) {
      console.error("ADMIN_SESSION_SECRET 환경변수 설정을 확인해주세요.");

      return NextResponse.json(
        { success: false, message: "관리자 로그인 설정을 확인해주세요." },
        { status: 500 },
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      createAdminSessionToken(),
      getAdminSessionCookieOptions(),
    );

    return response;
  }

  return NextResponse.json(
    { success: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." },
    { status: 401 },
  );
}
