import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  clearAdminLoginRateLimits,
  consumeAdminLoginRateLimits,
} from "@/lib/adminRateLimit";
import {
  ADMIN_SESSION_COOKIE,
  LEGACY_ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getExpiredAdminSessionCookieOptions,
  getAdminSessionCookieOptions,
  isAdminSessionConfigured,
  isSameOriginRequest,
} from "@/lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LOGIN_BODY_SIZE = 2048;
const MAX_ADMIN_ID_LENGTH = 128;
const MAX_ADMIN_PASSWORD_LENGTH = 512;
const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

function jsonResponse(payload, status, headers = {}) {
  return NextResponse.json(payload, {
    status,
    headers: { ...NO_STORE_HEADERS, ...headers },
  });
}

function secureEqual(actual, expected) {
  if (typeof actual !== "string" || typeof expected !== "string") {
    return false;
  }

  const actualDigest = createHash("sha256").update(actual).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();

  return timingSafeEqual(actualDigest, expectedDigest);
}

async function readLimitedJson(request) {
  if (!request.body) {
    return { error: true };
  }

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > MAX_LOGIN_BODY_SIZE) {
        await reader.cancel();
        return { tooLarge: true };
      }

      chunks.push(value);
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const text = new TextDecoder("utf-8", { fatal: true }).decode(combined);
    return { value: JSON.parse(text) };
  } catch {
    return { error: true };
  }
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) {
    return jsonResponse(
      { success: false, message: "허용되지 않은 요청입니다." },
      403,
    );
  }

  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();

  if (contentType !== "application/json") {
    return jsonResponse(
      { success: false, message: "JSON 형식의 요청만 허용됩니다." },
      415,
    );
  }

  if (
    Number(request.headers.get("content-length") || 0) > MAX_LOGIN_BODY_SIZE
  ) {
    return jsonResponse(
      { success: false, message: "요청 데이터가 너무 큽니다." },
      413,
    );
  }

  const parsedBody = await readLimitedJson(request);

  if (parsedBody.tooLarge) {
    return jsonResponse(
      { success: false, message: "요청 데이터가 너무 큽니다." },
      413,
    );
  }

  if (parsedBody.error) {
    return jsonResponse(
      { success: false, message: "잘못된 요청입니다." },
      400,
    );
  }

  const credentials = parsedBody.value;
  const adminId = credentials?.adminId;
  const adminPassword = credentials?.adminPassword;

  if (
    !credentials ||
    typeof credentials !== "object" ||
    Array.isArray(credentials) ||
    typeof adminId !== "string" ||
    adminId.length === 0 ||
    adminId.length > MAX_ADMIN_ID_LENGTH ||
    typeof adminPassword !== "string" ||
    adminPassword.length === 0 ||
    adminPassword.length > MAX_ADMIN_PASSWORD_LENGTH
  ) {
    return jsonResponse(
      { success: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." },
      401,
    );
  }

  if (
    !isAdminSessionConfigured() ||
    typeof process.env.ADMIN_ID !== "string" ||
    process.env.ADMIN_ID.length === 0 ||
    typeof process.env.ADMIN_PASSWORD !== "string" ||
    process.env.ADMIN_PASSWORD.length === 0
  ) {
    console.error("관리자 로그인 환경변수 설정을 확인해주세요.");

    return jsonResponse(
      { success: false, message: "관리자 로그인 설정을 확인해주세요." },
      500,
    );
  }

  let rateLimit;

  try {
    rateLimit = await consumeAdminLoginRateLimits(request);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "로그인 제한 오류");

    return jsonResponse(
      { success: false, message: "관리자 로그인을 잠시 사용할 수 없습니다." },
      503,
      { "Retry-After": "60" },
    );
  }

  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        success: false,
        message: "로그인 시도가 많습니다. 잠시 후 다시 시도해 주세요.",
      },
      429,
      { "Retry-After": String(Math.max(1, rateLimit.retryAfter)) },
    );
  }

  // Always perform both comparisons. Short-circuiting here would make a
  // statistically observable timing difference between an invalid ID and an
  // invalid password.
  const adminIdMatches = secureEqual(adminId, process.env.ADMIN_ID);
  const adminPasswordMatches = secureEqual(
    adminPassword,
    process.env.ADMIN_PASSWORD,
  );

  if (adminIdMatches && adminPasswordMatches) {
    try {
      await clearAdminLoginRateLimits(rateLimit.rateKeys);
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "로그인 제한 초기화 오류",
      );
    }

    const response = jsonResponse({ success: true }, 200);

    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      createAdminSessionToken(),
      getAdminSessionCookieOptions(),
    );
    response.cookies.set(
      LEGACY_ADMIN_SESSION_COOKIE,
      "",
      getExpiredAdminSessionCookieOptions(),
    );

    return response;
  }

  return jsonResponse(
    { success: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." },
    401,
  );
}
