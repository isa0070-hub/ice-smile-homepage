"use client";

import { useEffect, useRef } from "react";

const VISITOR_ID_KEY = "ismile_ad_visitor_id";
const SESSION_ID_KEY = "ismile_ad_session_id";
const ACTIVE_VISIT_ID_KEY = "ismile_ad_active_visit_id";

const NAVER_TRACKING_KEYS = [
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

function createId(prefix) {
  const randomPart =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random()
          .toString(36)
          .slice(2)}`;

  return `${prefix}_${randomPart}`;
}

function getOrCreateId(storage, key, prefix) {
  try {
    const savedId = storage.getItem(key);

    if (savedId) {
      return savedId;
    }

    const newId = createId(prefix);
    storage.setItem(key, newId);

    return newId;
  } catch {
    return createId(prefix);
  }
}

function getPaidTraffic(url) {
  const params = url.searchParams;

  const hasNaverTracking = NAVER_TRACKING_KEYS.some((key) =>
    params.has(key)
  );

  const utmSource = params.get("utm_source")?.trim().toLowerCase() || "";
  const utmMedium = params.get("utm_medium")?.trim().toLowerCase() || "";

  const hasPaidMedium = [
    "cpc",
    "ppc",
    "paid",
    "paidsearch",
    "paid_search",
  ].includes(utmMedium);

  const hasGoogleClickId =
    params.has("gclid") ||
    params.has("gbraid") ||
    params.has("wbraid");

  const hasOtherClickId =
    params.has("msclkid") ||
    params.has("dclid");

  if (
    !hasNaverTracking &&
    !hasPaidMedium &&
    !hasGoogleClickId &&
    !hasOtherClickId
  ) {
    return null;
  }

  let trafficSource = utmSource;

  if (!trafficSource && hasNaverTracking) {
    trafficSource = "naver";
  } else if (!trafficSource && hasGoogleClickId) {
    trafficSource = "google";
  } else if (!trafficSource && params.has("msclkid")) {
    trafficSource = "bing";
  } else if (!trafficSource && params.has("dclid")) {
    trafficSource = "display";
  }

  return {
    trafficSource: trafficSource || "paid-ad",
    trafficMedium: utmMedium || "cpc",
    campaign: params.get("utm_campaign") || null,
    searchKeyword:
      params.get("n_query") ||
      params.get("n_keyword") ||
      params.get("utm_term") ||
      null,
  };
}

function isReloadNavigation() {
  try {
    const navigation = performance.getEntriesByType("navigation")[0];
    return navigation?.type === "reload";
  } catch {
    return false;
  }
}

export default function AdClickTracker() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // 단순 새로고침을 반복 광고 클릭으로 잘못 기록하지 않습니다.
    if (isReloadNavigation()) return;

    const landingUrl = new URL(window.location.href);
    const paidTraffic = getPaidTraffic(landingUrl);

    // 유료광고 유입으로 확인된 방문만 기록합니다.
    if (!paidTraffic) return;

    const visitorId = getOrCreateId(
      window.localStorage,
      VISITOR_ID_KEY,
      "visitor"
    );

    const sessionId = getOrCreateId(
      window.sessionStorage,
      SESSION_ID_KEY,
      "session"
    );

    const saveVisit = async () => {
      try {
        const response = await fetch("/api/ad-click/visit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          cache: "no-store",
          keepalive: true,
          body: JSON.stringify({
            visitorId,
            sessionId,
            landingUrl: landingUrl.toString(),
            advertiserUrl: `${landingUrl.origin}${landingUrl.pathname}`,
            referrer: document.referrer || null,
            trafficSource: paidTraffic.trafficSource,
            trafficMedium: paidTraffic.trafficMedium,
            campaign: paidTraffic.campaign,
            searchKeyword: paidTraffic.searchKeyword,
          }),
        });

        if (!response.ok) return;

        const result = await response.json();

        if (result?.success && result?.visitId) {
          window.sessionStorage.setItem(
            ACTIVE_VISIT_ID_KEY,
            result.visitId
          );
        }
      } catch {
        // 추적 오류가 발생해도 홈페이지 이용에는 영향을 주지 않습니다.
      }
    };

    saveVisit();
  }, []);

  return null;
}
