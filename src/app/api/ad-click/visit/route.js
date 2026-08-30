import { isIP } from "node:net";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { consumeAdClickRateLimit } from "@/lib/adClickRateLimit";
import { isSameOriginRequest } from "@/lib/adminSession";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;
const MAX_BODY_SIZE = 16 * 1024;
const NAVER_TRACKING_KEYS = [
  "NaPm",
  "n_media",
  "n_query",
  "n_rank",
  "n_ad_group",
  "n_ad",
  "n_keyword_id",
  "n_keyword",
  "n_match",
  "n_campaign",
  "n_campaign_type",
  "n_ad_group_type",
];
const UNIQUE_CLICK_ID_KEYS = [
  "NaPm",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "dclid",
];
const ALLOWED_TRACKING_PARAM_KEYS = new Set([
  ...NAVER_TRACKING_KEYS,
  ...UNIQUE_CLICK_ID_KEYS,
  "utm_id",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
]);
const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

function jsonResponse(body, status = 200, headers = {}) {
  return NextResponse.json(body, {
    status,
    headers: {
      ...RESPONSE_HEADERS,
      ...headers,
    },
  });
}

function cleanText(value, maxLength = 500) {
  if (typeof value !== "string") return null;

  const cleaned = value.trim().slice(0, maxLength);
  return cleaned || null;
}

function cleanIdentifier(value, prefix) {
  if (typeof value !== "string" || value.length > 100) {
    return null;
  }

  const cleaned = value.trim();

  if (
    cleaned.length < 24 ||
    !cleaned.startsWith(`${prefix}_`) ||
    !/^[A-Za-z0-9_-]+$/.test(cleaned)
  ) {
    return null;
  }

  return cleaned;
}

function getClientIp(request) {
  const forwardedIp =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip");

  let ip = forwardedIp?.split(",")[0]?.trim();

  if (!ip) return null;

  ip = ip.trim();

  if (ip.startsWith("::ffff:")) {
    ip = ip.slice(7);
  }

  return isIP(ip) ? ip : null;
}

function paramsFromUrl(url) {
  const result = Object.create(null);

  for (const [key, value] of url.searchParams.entries()) {
    if (!ALLOWED_TRACKING_PARAM_KEYS.has(key)) {
      continue;
    }

    const safeKey = cleanText(key, 100);
    const safeValue = cleanText(value, 500);

    if (safeKey && safeValue !== null) {
      result[safeKey] = safeValue;
    }
  }

  return result;
}

function makeStoredLandingUrl(landingUrl, queryParams) {
  const storedUrl = new URL(`${landingUrl.origin}${landingUrl.pathname}`);

  for (const key of ALLOWED_TRACKING_PARAM_KEYS) {
    const value = queryParams[key];

    if (typeof value === "string" && value.length > 0) {
      storedUrl.searchParams.set(key, value);
    }
  }

  return storedUrl;
}

function sanitizeReferrer(value) {
  const cleaned = cleanText(value, 2000);

  if (!cleaned) {
    return null;
  }

  try {
    const url = new URL(cleaned);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return null;
    }

    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
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

      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > MAX_BODY_SIZE) {
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

    const text = new TextDecoder("utf-8", { fatal: true }).decode(
      combined
    );

    return { value: JSON.parse(text) };
  } catch {
    return { error: true };
  }
}

function getParam(params, key) {
  const value = params[key];

  if (Array.isArray(value)) {
    return cleanText(String(value[0] || ""), 500);
  }

  return cleanText(String(value || ""), 500);
}

function getNaverTracking(params) {
  const result = {};

  for (const key of NAVER_TRACKING_KEYS) {
    const value = getParam(params, key);

    if (value) {
      result[key] = value;
    }
  }

  return result;
}

function getClickFingerprint(params, landingUrl, sessionId) {
  let fingerprintSource = null;

  for (const key of UNIQUE_CLICK_ID_KEYS) {
    const value = getParam(params, key);

    if (value) {
      fingerprintSource = `click:${key.toLowerCase()}:${value}`;
      break;
    }
  }

  if (!fingerprintSource) {
    fingerprintSource = `session:${sessionId}:${landingUrl.toString()}`;
  }

  return createHash("sha256").update(fingerprintSource).digest("hex");
}

function detectDevice(userAgent) {
  if (/bot|crawler|spider|slurp|preview/i.test(userAgent)) {
    return "bot";
  }

  if (/ipad|tablet|android(?!.*mobile)/i.test(userAgent)) {
    return "tablet";
  }

  if (/mobile|iphone|ipod|android/i.test(userAgent)) {
    return "mobile";
  }

  return "desktop";
}

function detectBrowser(userAgent) {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/samsungbrowser/i.test(userAgent)) return "Samsung Internet";
  if (/opr\//i.test(userAgent)) return "Opera";
  if (/chrome|crios/i.test(userAgent)) return "Chrome";
  if (/firefox|fxios/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent)) return "Safari";

  return "기타";
}

function detectOs(userAgent) {
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/mac os x|macintosh/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";

  return "기타";
}

async function getRecentVisits(column, value, since) {
  if (!value) return [];

  const { data, error } = await supabaseAdmin
    .from("ad_click_visits")
    .select("clicked_at")
    .eq(column, value)
    .gte("clicked_at", since)
    .order("clicked_at", { ascending: false })
    .limit(200);

  if (error) {
    throw error;
  }

  return data || [];
}

function countSince(rows, now, duration) {
  return rows.filter((row) => {
    const clickedAt = new Date(row.clicked_at).getTime();
    return Number.isFinite(clickedAt) && now - clickedAt <= duration;
  }).length;
}

export async function POST(request) {
  try {
    if (!isSameOriginRequest(request)) {
      return jsonResponse(
        { success: false, message: "허용되지 않은 요청입니다." },
        403
      );
    }

    const mediaType = request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase();

    if (mediaType !== "application/json") {
      return jsonResponse(
        { success: false, message: "JSON 형식의 요청만 허용됩니다." },
        415
      );
    }

    const contentLength = Number(request.headers.get("content-length") || 0);

    if (contentLength > MAX_BODY_SIZE) {
      return jsonResponse(
        { success: false, message: "요청 데이터가 너무 큽니다." },
        413
      );
    }

    const parsedBody = await readLimitedJson(request);

    if (parsedBody.tooLarge) {
      return jsonResponse(
        { success: false, message: "요청 데이터가 너무 큽니다." },
        413
      );
    }

    if (
      parsedBody.error ||
      !parsedBody.value ||
      typeof parsedBody.value !== "object" ||
      Array.isArray(parsedBody.value)
    ) {
      return jsonResponse(
        { success: false, message: "요청 형식이 올바르지 않습니다." },
        400
      );
    }

    const body = parsedBody.value;
    const landingUrlText =
      typeof body.landingUrl === "string" && body.landingUrl.length <= 3000
        ? body.landingUrl.trim()
        : null;

    if (!landingUrlText) {
      return jsonResponse(
        { success: false, message: "방문 주소가 필요합니다." },
        400
      );
    }

    let landingUrl;

    try {
      landingUrl = new URL(landingUrlText);
    } catch {
      return jsonResponse(
        { success: false, message: "방문 주소가 올바르지 않습니다." },
        400
      );
    }

    // isSameOriginRequest already validates this browser-supplied origin
    // against the production, preview, or local deployment origin.
    const requestOrigin = new URL(request.headers.get("origin")).origin;

    if (
      !["http:", "https:"].includes(landingUrl.protocol) ||
      landingUrl.username ||
      landingUrl.password ||
      landingUrl.origin !== requestOrigin
    ) {
      return jsonResponse(
        { success: false, message: "허용되지 않는 주소 형식입니다." },
        403
      );
    }

    landingUrl.hash = "";

    const ipAddress = getClientIp(request);
    const visitorId = cleanIdentifier(body.visitorId, "visitor");
    const sessionId = cleanIdentifier(body.sessionId, "session");

    if (!visitorId || !sessionId) {
      return jsonResponse(
        { success: false, message: "방문 확인값이 올바르지 않습니다." },
        400
      );
    }

    const userAgent = cleanText(
      request.headers.get("user-agent") || "",
      1000
    ) || "";

    const acceptLanguage = cleanText(
      request.headers.get("accept-language") || "",
      300
    );

    const queryParams = paramsFromUrl(landingUrl);
    const storedLandingUrl = makeStoredLandingUrl(landingUrl, queryParams);
    const naverTracking = getNaverTracking(queryParams);
    const hasNaverTracking = Object.keys(naverTracking).length > 0;

    const utmMedium = getParam(queryParams, "utm_medium")
      ?.toLowerCase();

    const hasPaidMedium = [
      "cpc",
      "ppc",
      "paid",
      "paidsearch",
      "paid_search",
    ].includes(utmMedium);

    const hasOtherPaidClickId = [
      "gclid",
      "gbraid",
      "wbraid",
      "msclkid",
      "dclid",
    ].some((key) => Boolean(getParam(queryParams, key)));

    if (
      !hasNaverTracking &&
      !hasPaidMedium &&
      !hasOtherPaidClickId
    ) {
      return jsonResponse(
        {
          success: false,
          message: "유료광고 유입 정보가 확인되지 않습니다.",
        },
        400
      );
    }

    let abuseLimit;

    try {
      abuseLimit = await consumeAdClickRateLimit(request, visitorId);
    } catch (error) {
      console.error(
        "광고 방문 제한 저장소 오류:",
        error?.message || "unknown",
      );

      return jsonResponse(
        {
          success: false,
          message: "방문 보호 기능을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        },
        503,
        { "Retry-After": "60" },
      );
    }

    if (!abuseLimit.allowed) {
      return jsonResponse(
        {
          success: false,
          message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
        },
        429,
        { "Retry-After": String(abuseLimit.retryAfter) },
      );
    }

    const clickFingerprint = getClickFingerprint(
      queryParams,
      storedLandingUrl,
      sessionId
    );

    const referrer = sanitizeReferrer(
      body.referrer || request.headers.get("referer") || ""
    );

    const trafficSource =
      getParam(queryParams, "utm_source") ||
      (hasNaverTracking ? "naver" : null) ||
      (getParam(queryParams, "msclkid")
        ? "bing"
        : null) ||
      (hasOtherPaidClickId ? "google" : null);

    const trafficMedium =
      utmMedium ||
      (hasNaverTracking ? "cpc" : null);

    const campaign =
      getParam(queryParams, "utm_campaign") ||
      getParam(queryParams, "n_campaign");

    const searchKeyword =
      getParam(queryParams, "n_query") ||
      getParam(queryParams, "n_keyword") ||
      getParam(queryParams, "utm_term");

    const isBot =
      /bot|crawler|spider|slurp|headless|preview|facebookexternalhit/i.test(
        userAgent
      );

    const now = Date.now();
    const since24Hours = new Date(now - DAY_MS).toISOString();

    const [recentIpVisits, recentVisitorVisits] = await Promise.all([
      getRecentVisits("ip_address", ipAddress, since24Hours),
      getRecentVisits("visitor_id", visitorId, since24Hours),
    ]);

    const ipVisitsIn10Minutes = countSince(
      recentIpVisits,
      now,
      TEN_MINUTES_MS
    );

    const ipVisitsInOneHour = countSince(
      recentIpVisits,
      now,
      HOUR_MS
    );

    const visitorVisitsIn24Hours = recentVisitorVisits.length;

    let suspicionScore = 0;
    const suspicionReasons = [];

    if (isBot) {
      suspicionScore += 80;
      suspicionReasons.push("자동화 프로그램 또는 봇 의심");
    }

    if (ipVisitsIn10Minutes >= 2) {
      suspicionScore += 50;
      suspicionReasons.push("동일 IP에서 10분 이내 반복 광고 방문");
    } else if (ipVisitsIn10Minutes === 1) {
      suspicionScore += 30;
      suspicionReasons.push("동일 IP에서 10분 이내 재방문");
    }

    if (ipVisitsInOneHour >= 4) {
      suspicionScore += 20;
      suspicionReasons.push("동일 IP에서 1시간 이내 다수 방문");
    }

    if (visitorVisitsIn24Hours >= 3) {
      suspicionScore += 25;
      suspicionReasons.push("동일 방문자에서 24시간 이내 반복 방문");
    }

    suspicionScore = Math.min(suspicionScore, 100);

    const reviewStatus =
      suspicionScore >= 50 ? "suspected" : "unchecked";

    const { data, error } = await supabaseAdmin
      .from("ad_click_visits")
      .insert({
        click_fingerprint: clickFingerprint,
        ip_address: ipAddress,
        visitor_id: visitorId,
        session_id: sessionId,
        landing_url: storedLandingUrl.toString(),
        advertiser_url: `${landingUrl.origin}${landingUrl.pathname}`,
        landing_path: landingUrl.pathname,
        referrer,
        traffic_source: trafficSource,
        traffic_medium: trafficMedium,
        campaign,
        search_keyword: searchKeyword,
        naver_tracking: naverTracking,
        query_params: queryParams,
        user_agent: userAgent || null,
        accept_language: acceptLanguage,
        device_type: detectDevice(userAgent),
        browser_name: detectBrowser(userAgent),
        os_name: detectOs(userAgent),
        is_bot: isBot,
        suspicion_score: suspicionScore,
        suspicion_reasons: suspicionReasons,
        review_status: reviewStatus,
      })
      .select("id, suspicion_score, review_status")
      .single();

    if (error) {
      const duplicateDetails = `${error.message || ""} ${
        error.details || ""
      } ${error.hint || ""}`;

      if (
        error.code === "23505" &&
        (duplicateDetails.includes("click_fingerprint") ||
          duplicateDetails.includes(
            "ad_click_visits_click_fingerprint_key"
          ))
      ) {
        return jsonResponse({ success: true, duplicate: true });
      }

      throw error;
    }

    return jsonResponse(
      {
        success: true,
        visitId: data.id,
        suspicionScore: data.suspicion_score,
        reviewStatus: data.review_status,
      }
    );
  } catch (error) {
    console.error("광고 방문 기록 저장 실패:", error?.message || error);

    return jsonResponse(
      {
        success: false,
        message: "방문 기록 저장 중 오류가 발생했습니다.",
      },
      500
    );
  }
}
