import crypto from "crypto";
import { requireAdminRequest } from "@/lib/adminApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = "https://api.searchad.naver.com";

const TARGET_GROUPS = [
  {
    branch: "seolleung",
    label: "선릉 아이폰수리",
    adgroupId: "grp-a001-01-000000071967372",
  },
  {
    branch: "gangbyeon",
    label: "강변 아이폰수리",
    adgroupId: "grp-a001-01-000000069539305",
  },
];

function makeSignature(timestamp, method, uri, secretKey) {
  return crypto
    .createHmac("sha256", secretKey)
    .update(`${timestamp}.${method}.${uri}`)
    .digest("base64");
}

function getCredentials() {
  const credentials = {
    customerId: process.env.NAVER_AD_CUSTOMER_ID,
    accessLicense: process.env.NAVER_AD_ACCESS_LICENSE,
    secretKey: process.env.NAVER_AD_SECRET_KEY,
  };

  if (
    !credentials.customerId ||
    !credentials.accessLicense ||
    !credentials.secretKey
  ) {
    throw new Error("네이버 광고 API 환경변수가 부족합니다.");
  }

  return credentials;
}

async function naverGet(uri, params = {}) {
  const credentials = getCredentials();
  const timestamp = Date.now().toString();
  const method = "GET";

  const query = new URLSearchParams(params).toString();

  const response = await fetch(
    `${BASE_URL}${uri}${query ? `?${query}` : ""}`,
    {
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": credentials.accessLicense,
        "X-Customer": credentials.customerId,
        "X-Signature": makeSignature(
          timestamp,
          method,
          uri,
          credentials.secretKey
        ),
      },
      cache: "no-store",
    }
  );

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `NAVER API ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

function kstToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const out = {};

  for (const part of parts) {
    out[part.type] = part.value;
  }

  return `${out.year}-${out.month}-${out.day}`;
}

function shiftDate(value, amount) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function getRange(period) {
  const yesterday = shiftDate(kstToday(), -1);

  let days = 7;

  if (period === "yesterday") days = 1;
  if (period === "30d") days = 30;

  return {
    since: shiftDate(yesterday, -(days - 1)),
    until: yesterday,
    days,
  };
}

function sumStats(rows = []) {
  const result = {
    impressions: 0,
    clicks: 0,
    cost: 0,
    rawConversions: 0,
  };

  for (const row of rows) {
    result.impressions += Number(row.impCnt || 0);
    result.clicks += Number(row.clkCnt || 0);
    result.cost += Number(row.salesAmt || 0);
    result.rawConversions += Number(row.ccnt || 0);
  }

  return {
    ...result,

    avgCpc:
      result.clicks > 0
        ? Math.round(result.cost / result.clicks)
        : 0,

    rawCvr:
      result.clicks > 0
        ? Number(
            (
              (result.rawConversions / result.clicks) *
              100
            ).toFixed(2)
          )
        : 0,

    rawCpa:
      result.rawConversions > 0
        ? Math.round(
            result.cost / result.rawConversions
          )
        : 0,
  };
}

async function getKeywordStats(keywordId, range) {
  const response = await naverGet("/stats", {
    id: keywordId,

    fields: JSON.stringify([
      "impCnt",
      "clkCnt",
      "salesAmt",
      "ccnt",
    ]),

    timeRange: JSON.stringify({
      since: range.since,
      until: range.until,
    }),

    timeIncrement: "1",
  });

  return sumStats(
    Array.isArray(response?.data)
      ? response.data
      : []
  );
}

async function mapLimit(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (true) {
      const index = cursor++;

      if (index >= items.length) return;

      results[index] = await worker(
        items[index],
        index
      );
    }
  }

  await Promise.all(
    Array.from(
      {
        length: Math.min(
          concurrency,
          Math.max(items.length, 1)
        ),
      },
      () => run()
    )
  );

  return results;
}

async function collectGroup(group, range) {
  const keywords = await naverGet(
    "/ncc/keywords",
    {
      nccAdgroupId: group.adgroupId,
    }
  );

  if (!Array.isArray(keywords)) {
    throw new Error(
      `${group.label} 키워드 목록 형식이 예상과 다릅니다.`
    );
  }

  const rows = await mapLimit(
    keywords,
    5,
    async (keyword) => {
      const stats = await getKeywordStats(
        keyword.nccKeywordId,
        range
      );

      return {
        keywordId: keyword.nccKeywordId,
        keyword: keyword.keyword,
        status: keyword.status,
        userLock: keyword.userLock,
        bidAmt: Number(keyword.bidAmt || 0),
        useGroupBidAmt: keyword.useGroupBidAmt,
        ...stats,
      };
    }
  );

  rows.sort(
    (a, b) =>
      b.cost - a.cost ||
      b.clicks - a.clicks
  );

  return {
    ...group,
    keywordCount: rows.length,
    keywords: rows,
  };
}

export async function GET(request) {
  const authError =
    requireAdminRequest(request);

  if (authError) {
    return authError;
  }

  try {
    const { searchParams } =
      new URL(request.url);

    const requested =
      searchParams.get("period") || "7d";

    const period = [
      "yesterday",
      "7d",
      "30d",
    ].includes(requested)
      ? requested
      : "7d";

    const range = getRange(period);

    const groups = [];

    for (const group of TARGET_GROUPS) {
      groups.push(
        await collectGroup(
          group,
          range
        )
      );
    }

    return Response.json(
      {
        ok: true,
        period,
        ...range,

        note:
          "rawConversions는 네이버 ccnt이며 아직 실제 문의 전환으로 확정하지 않습니다.",

        groups,
      },
      {
        headers: {
          "Cache-Control":
            "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "NAVER KEYWORD PERFORMANCE ERROR:",
      error
    );

    return Response.json(
      {
        ok: false,
        error: error.message,
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "private, no-store",
        },
      }
    );
  }
}
