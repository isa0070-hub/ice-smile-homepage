const ACTIVE_VISIT_ID_KEY =
  "ismile_ad_active_visit_id";

export async function trackPaidAdAction(
  eventType,
  metadata = {}
) {
  if (typeof window === "undefined") {
    return false;
  }

  let visitId;

  try {
    visitId = window.sessionStorage.getItem(
      ACTIVE_VISIT_ID_KEY
    );
  } catch {
    return false;
  }

  // 광고 유입 세션이 아니면 아무것도 기록하지 않는다.
  if (!visitId) {
    return false;
  }

  try {
    const response = await fetch(
      "/api/ad-click/event",
      {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        keepalive: true,

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          visitId,
          eventType,
          pagePath:
            window.location.pathname +
            window.location.search,
          ...metadata,
        }),
      }
    );

    return response.ok;
  } catch {
    // 추적 실패가 고객의 홈페이지 이용을 방해하면 안 된다.
    return false;
  }
}
