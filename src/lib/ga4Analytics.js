import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { supabase } from "@/lib/supabase";

const PERIOD_CONFIG = {
  yesterday: {
    label: "전일",
    startDate: "yesterday",
    endDate: "yesterday",
  },
  "7d": {
    label: "7일",
    startDate: "6daysAgo",
    endDate: "today",
  },
  "30d": {
    label: "30일",
    startDate: "29daysAgo",
    endDate: "today",
  },
};

const PAID_CHANNELS = new Set([
  "Paid Search",
  "Cross-network",
  "Display",
  "Paid Social",
  "Paid Video",
  "Paid Shopping",
  "Other Advertising",
]);

const PAID_MEDIUMS = new Set([
  "cpc",
  "ppc",
  "paid",
  "paidsearch",
  "paid_search",
  "display",
  "cpm",
  "cpv",
  "cpa",
]);

let analyticsClient = null;

function cleanText(value = "") {
  return String(value || "").trim();
}

function normalize(value = "") {
  return cleanText(value).toLowerCase();
}
function getGa4PropertyId() {
    const value = process.env.GA4_PROPERTY_ID;
  
    if (!value || !value.trim()) {
      throw new Error(
        `GA4_PROPERTY_ID 값을 읽지 못했습니다. 현재 길이: ${
          String(value || "").length
        }`
      );
    }
  
    return value.trim();
  }
  
  function getGa4CredentialsBase64() {
    const value =
      process.env.GOOGLE_ANALYTICS_CREDENTIALS_BASE64;
  
    if (!value || !value.trim()) {
      throw new Error(
        `GOOGLE_ANALYTICS_CREDENTIALS_BASE64 값을 읽지 못했습니다. 현재 길이: ${
          String(value || "").length
        }`
      );
    }
  
    return value.trim();
  }
function getPeriodConfig(periodKey = "7d") {
  return PERIOD_CONFIG[periodKey] || PERIOD_CONFIG["7d"];
}

function getAnalyticsClient() {
  if (analyticsClient) {
    return analyticsClient;
  }

  const encodedCredentials =
  getGa4CredentialsBase64();

  let credentials;

  try {
    credentials = JSON.parse(
      Buffer.from(
        encodedCredentials,
        "base64"
      ).toString("utf8")
    );
  } catch {
    throw new Error(
      "Google Analytics 인증정보를 읽지 못했습니다."
    );
  }

  if (
    !credentials.client_email ||
    !credentials.private_key
  ) {
    throw new Error(
      "Google Analytics 서비스 계정 정보가 올바르지 않습니다."
    );
  }

  analyticsClient = new BetaAnalyticsDataClient({
    projectId: credentials.project_id,
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
  });

  return analyticsClient;
}

function isOrganicTraffic(channel, medium) {
  return (
    channel === "Organic Search" ||
    normalize(medium) === "organic"
  );
}

function isPaidTraffic(channel, medium) {
  const normalizedMedium = normalize(medium);

  return (
    PAID_CHANNELS.has(channel) ||
    PAID_MEDIUMS.has(normalizedMedium)
  );
}

function classifyPortal(source = "") {
  const normalizedSource = normalize(source);

  if (normalizedSource.includes("naver")) {
    return "naver";
  }

  if (normalizedSource.includes("google")) {
    return "google";
  }

  return "other";
}

function classifyPaidPortal({
    source = "",
    channel = "",
    campaign = "",
  }) {
    const normalizedSource = normalize(source);
    const normalizedCampaign = normalize(campaign);
  
    // UTM 캠페인이 powerlink로 확인되는 경우만 파워링크
    if (
      normalizedSource.includes("naver") &&
      normalizedCampaign.includes("powerlink")
    ) {
      return "naver";
    }
  
    // Google의 검색광고로 확실히 분류된 경우
    if (
      normalizedSource.includes("google") &&
      channel === "Paid Search"
    ) {
      return "google";
    }
  
    return "other";
  }

function normalizeLandingPath(value = "") {
  const path = cleanText(value);

  if (
    !path ||
    path === "(not set)" ||
    path === "/"
  ) {
    return path === "/" ? "/" : "";
  }

  return path
    .split("?")[0]
    .split("#")[0]
    .replace(/\/+$/, "");
}

function isRepairCasePath(path = "") {
  return path.startsWith("/repair-cases/");
}

function extractSlug(path = "") {
  const rawSlug = path
    .replace(/^\/repair-cases\//, "")
    .split("/")[0];

  try {
    return decodeURIComponent(rawSlug);
  } catch {
    return rawSlug;
  }
}

function addSessions(map, path, sessions) {
  if (!path || sessions <= 0) {
    return;
  }

  map.set(path, (map.get(path) || 0) + sessions);
}

async function makeTopRepairCases(sessionMap) {
  const sortedEntries = Array.from(
    sessionMap.entries()
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const slugs = Array.from(
    new Set(
      sortedEntries
        .map(([path]) => extractSlug(path))
        .filter(Boolean)
    )
  );

  const titleMap = new Map();

  if (slugs.length > 0) {
    const { data, error } = await supabase
      .from("repair_cases")
      .select("slug, title")
      .in("slug", slugs);

    if (!error) {
      (data || []).forEach((item) => {
        if (item?.slug) {
          titleMap.set(
            item.slug,
            item.title || item.slug
          );
        }
      });
    }
  }

  return sortedEntries.map(([path, sessions]) => {
    const slug = extractSlug(path);

    return {
      path,
      slug,
      sessions,
      title:
        titleMap.get(slug) ||
        slug.replace(/-/g, " ") ||
        path,
    };
  });
}

export async function getSearchTrafficSummary(
  periodKey = "7d"
) {
    const propertyId = getGa4PropertyId();

  const period = getPeriodConfig(periodKey);
  const client = getAnalyticsClient();

  const [report] = await client.runReport({
    property: `properties/${propertyId}`,

    dateRanges: [
      {
        startDate: period.startDate,
        endDate: period.endDate,
      },
    ],

    dimensions: [
  {
    name: "sessionDefaultChannelGroup",
  },
  {
    name: "sessionSource",
  },
  {
    name: "sessionMedium",
  },
  {
    name: "sessionCampaignName",
  },
  {
    name: "landingPagePlusQueryString",
  },
],

    metrics: [
      {
        name: "sessions",
      },
    ],

    orderBys: [
      {
        metric: {
          metricName: "sessions",
        },
        desc: true,
      },
    ],

    limit: 100000,
  });

  const organic = {
    total: 0,
    naver: 0,
    google: 0,
    other: 0,
  };

  const paid = {
    total: 0,
    naver: 0,
    google: 0,
    other: 0,
  };

  const organicRepairCases = new Map();
  const paidRepairCases = new Map();

  for (const row of report.rows || []) {
    const channel =
      row.dimensionValues?.[0]?.value || "";

    const source =
      row.dimensionValues?.[1]?.value || "";

      const medium =
      row.dimensionValues?.[2]?.value || "";
    
    const campaign =
      row.dimensionValues?.[3]?.value || "";
    
    const landingPath = normalizeLandingPath(
      row.dimensionValues?.[4]?.value || ""
    );

    const sessions = Number(
      row.metricValues?.[0]?.value || 0
    );

    if (!sessions) {
      continue;
    }

    const organicPortal = classifyPortal(source);

    if (isOrganicTraffic(channel, medium)) {
      organic.total += sessions;
      organic[organicPortal] += sessions;

      if (isRepairCasePath(landingPath)) {
        addSessions(
          organicRepairCases,
          landingPath,
          sessions
        );
      }

      continue;
    }

    if (isPaidTraffic(channel, medium)) {
        const paidPortal = classifyPaidPortal({
          source,
          channel,
          campaign,
        });
      
        paid.total += sessions;
        paid[paidPortal] += sessions;

      if (isRepairCasePath(landingPath)) {
        addSessions(
          paidRepairCases,
          landingPath,
          sessions
        );
      }
    }
  }

  const [organicTop, paidTop] = await Promise.all([
    makeTopRepairCases(organicRepairCases),
    makeTopRepairCases(paidRepairCases),
  ]);

  return {
    periodKey,
    periodLabel: period.label,

    searchTotal: organic.total + paid.total,

    organic,
    paid,

    organicTop,
    paidTop,

    hasData:
      organic.total > 0 ||
      paid.total > 0,
  };
}