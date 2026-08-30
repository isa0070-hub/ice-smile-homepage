import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const IP_RATE_LIMIT = {
  scope: "ip",
  maxAttempts: 5,
  windowSeconds: 15 * 60,
  blockSeconds: 15 * 60,
};

function getClientIp(request) {
  const forwardedFor =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "";
  const candidate = forwardedFor.split(",", 1)[0].trim();

  return isIP(candidate) ? candidate : "unknown";
}

function makeRateKey(scope, value) {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("관리자 로그인 제한용 비밀키가 설정되지 않았습니다.");
  }

  const digest = createHmac("sha256", secret)
    .update(scope)
    .update("\0")
    .update(value)
    .digest("hex");

  return `${scope}:${digest}`;
}

async function consumeLimit(rateKey, limit) {
  const { data, error } = await supabaseAdmin.rpc(
    "consume_admin_login_rate_limit",
    {
      p_rate_key: rateKey,
      p_max_attempts: limit.maxAttempts,
      p_window_seconds: limit.windowSeconds,
      p_block_seconds: limit.blockSeconds,
    },
  );

  if (error) {
    throw new Error(
      `관리자 로그인 제한 저장소 오류: ${error.code || "unknown"}`,
    );
  }

  if (
    !data ||
    typeof data.allowed !== "boolean" ||
    !Number.isFinite(Number(data.retry_after_seconds))
  ) {
    throw new Error("관리자 로그인 제한 저장소 응답이 올바르지 않습니다.");
  }

  return {
    allowed: data.allowed,
    retryAfter: Math.max(0, Math.ceil(Number(data.retry_after_seconds))),
  };
}

export async function consumeAdminLoginRateLimits(request) {
  const rateKey = makeRateKey(
    IP_RATE_LIMIT.scope,
    getClientIp(request),
  );
  const result = await consumeLimit(rateKey, IP_RATE_LIMIT);

  return {
    allowed: result.allowed,
    retryAfter: result.retryAfter,
    rateKeys: [rateKey],
  };
}

export async function clearAdminLoginRateLimits(rateKeys) {
  if (!Array.isArray(rateKeys) || rateKeys.length === 0) {
    return;
  }

  const { error } = await supabaseAdmin
    .from("admin_login_rate_limits")
    .delete()
    .in("rate_key", rateKeys);

  if (error) {
    throw new Error(
      `관리자 로그인 제한 초기화 오류: ${error.code || "unknown"}`,
    );
  }
}
