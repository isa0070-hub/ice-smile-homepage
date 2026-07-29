import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

function cleanText(value, maxLength = 500) {
  if (typeof value !== "string") return null;

  const cleaned = value.trim().slice(0, maxLength);
  return cleaned || null;
}

function cleanIdentifier(value) {
  const cleaned = cleanText(value, 100);

  if (!cleaned || !/^[A-Za-z0-9_-]+$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

function normalizeHost(host) {
  return String(host || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
}

function getClientIp(request) {
  const forwardedIp = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  let ip =
    forwardedIp ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-vercel-forwarded-for");

  if (!ip) return null;

  ip = ip.trim();

  if (ip.startsWith("::ffff:")) {
    ip = ip.slice(7);
  }

  return isIP(ip) ? ip : null;
}

function paramsFromUrl(url) {
  const result = {};
  let count = 0;

  for (const [key, value] of url.searchParams.entries()) {
    if (count >= 60) break;

    const safeKey = cleanText(key, 100);
    const safeValue = cleanText(value, 500);

    if (safeKey && safeValue !== null) {
      result[safeKey] = safeValue;
      count += 1;
    }
  }

  return result;
}

function getParam(params, key) {
  const value = params[key];

  if (Array.isArray(value)) {
    return cleanText(String(value[0] || ""), 500);
  }

  return cleanText(String(value || ""), 500);
}

function getNaverTracking(params) {
  const keys = [
    "NaPm",
    "n_media",
    "n_query",
    "n_rank",
    "n_ad_group",
    "n_ad",
    "n_keyword_id",
    "n_keyword",
    "n_campaign_type",
    "n_ad_group_type",
  ];

  const result = {};

  for (const key of keys) {
    const value = getParam(params, key);

    if (value) {
      result[key] = value;
    }
  }

  return result;
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
    const contentLength = Number(request.headers.get("content-length") || 0);

    if (contentLength > 32768) {
      return NextResponse.json(
        { success: false, message: "요청 데이터가 너무 큽니다." },
        { status: 413 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "요청 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const landingUrlText = cleanText(body?.landingUrl, 3000);

    if (!landingUrlText) {
      return NextResponse.json(
        { success: false, message: "방문 주소가 필요합니다." },
        { status: 400 }
      );
    }

    let landingUrl;

    try {
      landingUrl = new URL(landingUrlText);
    } catch {
      return NextResponse.json(
        { success: false, message: "방문 주소가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (!["http:", "https:"].includes(landingUrl.protocol)) {
      return NextResponse.json(
        { success: false, message: "허용되지 않는 주소 형식입니다." },
        { status: 400 }
      );
    }

    const requestHost =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.host;

    if (
      normalizeHost(requestHost) &&
      normalizeHost(landingUrl.host) !== normalizeHost(requestHost)
    ) {
      return NextResponse.json(
        { success: false, message: "허용되지 않는 방문 주소입니다." },
        { status: 403 }
      );
    }

    const ipAddress = getClientIp(request);
    const visitorId = cleanIdentifier(body?.visitorId);
    const sessionId = cleanIdentifier(body?.sessionId);

    const userAgent = cleanText(
      request.headers.get("user-agent") || "",
      1000
    ) || "";

    const acceptLanguage = cleanText(
      request.headers.get("accept-language") || "",
      300
    );

    const queryParams = paramsFromUrl(landingUrl);
    const naverTracking = getNaverTracking(queryParams);
    const hasNaverTracking = Object.keys(naverTracking).length > 0;

    const referrer =
      cleanText(body?.referrer, 2000) ||
      cleanText(request.headers.get("referer") || "", 2000);

    const trafficSource =
      cleanText(body?.trafficSource, 100) ||
      getParam(queryParams, "utm_source") ||
      (hasNaverTracking ? "naver" : null);

    const trafficMedium =
      cleanText(body?.trafficMedium, 100) ||
      getParam(queryParams, "utm_medium") ||
      (hasNaverTracking ? "cpc" : null);

    const campaign =
      cleanText(body?.campaign, 300) ||
      getParam(queryParams, "utm_campaign");

    const searchKeyword =
      cleanText(body?.searchKeyword, 500) ||
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
        ip_address: ipAddress,
        visitor_id: visitorId,
        session_id: sessionId,
        landing_url: landingUrl.toString(),
        advertiser_url:
          cleanText(body?.advertiserUrl, 2000) ||
          landingUrl.toString(),
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
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        visitId: data.id,
        suspicionScore: data.suspicion_score,
        reviewStatus: data.review_status,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("광고 방문 기록 저장 실패:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        message: "방문 기록 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
