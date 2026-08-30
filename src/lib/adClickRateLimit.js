import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const HASH_PATTERN = /^[0-9a-f]{64}$/;
const MAX_RETRY_AFTER_SECONDS = 24 * 60 * 60;

function getRateLimitSecret() {
  const secret =
    process.env.AD_CLICK_RATE_LIMIT_SECRET ||
    process.env.SUPABASE_SECRET_KEY;

  if (
    typeof secret !== "string" ||
    Buffer.byteLength(secret, "utf8") < 32
  ) {
    throw new Error(
      "Ad-click rate-limit secret must contain at least 32 bytes.",
    );
  }

  return secret;
}

function getClientIp(request) {
  const candidates = [
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  ];

  for (const candidate of candidates) {
    let value = candidate?.split(",", 1)[0]?.trim() || "";

    if (value.startsWith("::ffff:")) {
      value = value.slice(7);
    }

    if (isIP(value)) {
      return value;
    }
  }

  // Missing proxy metadata shares one conservative bucket instead of
  // bypassing the limiter. The literal is HMACed before it leaves this module.
  return "unknown";
}

function makeSubjectHash(secret, scope, value) {
  return createHmac("sha256", secret)
    .update(scope)
    .update("\0")
    .update(value)
    .digest("hex");
}

function assertVisitorId(visitorId) {
  if (
    typeof visitorId !== "string" ||
    visitorId.length < 1 ||
    visitorId.length > 128
  ) {
    throw new Error("Ad-click visitor ID is invalid.");
  }
}

function parseRateLimitResponse(data) {
  const retryAfter = data?.retry_after;

  if (
    !data ||
    typeof data.allowed !== "boolean" ||
    typeof retryAfter !== "number" ||
    !Number.isInteger(retryAfter) ||
    retryAfter < 0 ||
    retryAfter > MAX_RETRY_AFTER_SECONDS ||
    (data.allowed && retryAfter !== 0) ||
    (!data.allowed && retryAfter < 1)
  ) {
    throw new Error("Ad-click rate-limit response is invalid.");
  }

  return {
    allowed: data.allowed,
    retryAfter,
  };
}

export async function consumeAdClickRateLimit(request, visitorId) {
  assertVisitorId(visitorId);

  const secret = getRateLimitSecret();
  const ipHash = makeSubjectHash(
    secret,
    "ad-click-ip",
    getClientIp(request),
  );
  const visitorHash = makeSubjectHash(
    secret,
    "ad-click-visitor",
    visitorId,
  );

  if (!HASH_PATTERN.test(ipHash) || !HASH_PATTERN.test(visitorHash)) {
    throw new Error("Ad-click rate-limit hash generation failed.");
  }

  const { data, error } = await supabaseAdmin
    .rpc("consume_ad_click_rate_limit", {
      p_ip_hash: ipHash,
      p_visitor_hash: visitorHash,
    })
    .maybeSingle();

  if (error) {
    throw new Error(
      `Ad-click rate-limit storage failed: ${error.code || "unknown"}.`,
    );
  }

  return parseRateLimitResponse(data);
}
