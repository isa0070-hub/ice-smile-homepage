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

function credentials() {
  const value = {
    customerId: process.env.NAVER_AD_CUSTOMER_ID,
    accessLicense: process.env.NAVER_AD_ACCESS_LICENSE,
    secretKey: process.env.NAVER_AD_SECRET_KEY,
  };

  if (
    !value.customerId ||
    !value.accessLicense ||
    !value.secretKey
  ) {
    throw new Error("네이버 광고 API 환경변수가 부족합니다.");
  }

  return value;
}

async function naverGet(uri, query = "") {
  const auth = credentials();
  const timestamp = Date.now().toString();
  const method = "GET";

  const response = await fetch(
    `${BASE_URL}${uri}${query}`,
    {
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": auth.accessLicense,
        "X-Customer": auth.customerId,
        "X-Signature": makeSignature(
          timestamp,
          method,
          uri,
          auth.secretKey
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

  const obj = {};
  for (const part of parts) {
    obj[part.type] = part.value;
  }

  return `${obj.year}-${obj.month}-${obj.day}`;
}

function shiftDate(value, amount) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function getRange(period) {
  const yesterday = shiftDate(kstToday(), -1);

  let days = 1;
  if (period === "7d") days = 7;
  if (period === "30d") days = 30;

  return {
    since: shiftDate(yesterday, -(days - 1)),
    until: yesterday,
    days,
  };
}

async function getKeywords(adgroupId) {
  const params = new URLSearchParams({
    nccAdgroupId: adgroupId,
  });

  const data = await naverGet(
    "/ncc/keywords",
    `?${params.toString()}`
  );

  return Array.isArray(data) ? data : [];
}

async function getKeywordStat(keywordId, range) {
  const fields = JSON.stringify([
    "impCnt",
    "clkCnt",
    "salesAmt",
    "ccnt",
  ]);

  const timeRange = JSON.stringify({
    since: range.since,
    until: range.until,
  });

  const params = new URLSearchParams({
    id: keywordId,
    fields,
    timeRange,
    timeIncrement: "allDays",
  });

  const response = await naverGet(
    "/stats",
    `?${params.toString()}`
  );

  const row =
    Array.isArray(response?.data) && response.data.length
      ? response.data[0]
      : {};

  const impressions = Number(row.impCnt || 0);
  const clicks = Number(row.clkCnt || 0);
  const cost = Number(row.salesAmt || 0);
  const rawConversions = Number(row.ccnt || 0);

  return {
    impressions,
    clicks,
    cost,
    rawConversions,
    avgCpc:
      clicks > 0
        ? Math.round(cost / clicks)
        : 0,
    rawCvr:
      clicks > 0
        ? Number(
            ((rawConversions / clicks) * 100).toFixed(2)
          )
        : 0,
    rawCpa:
      rawConversions > 0
        ? Math.round(cost / rawConversions)
        : 0,
  };
}

async function mapLimit(items, limit, worker) {
  const result = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (true) {
      const index = cursor++;

      if (index >= items.length) {
        return;
      }

      result[index] = await worker(items[index]);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(limit, items.length) },
      () => run()
    )
  );

  return result;
}

async function collectGroup(group, range) {
  const keywords = await getKeywords(group.adgroupId);

  const rows = await mapLimit(
    keywords,
    6,
    async (keyword) => {
      const stat = await getKeywordStat(
        keyword.nccKeywordId,
        range
      );

      return {
        keywordId: keyword.nccKeywordId,
        keyword: keyword.keyword,
        status: keyword.status,
        userLock: keyword.userLock,
        ...stat,
      };
    }
  );

  rows.sort((a, b) => {
    if (b.cost !== a.cost) {
      return b.cost - a.cost;
    }

    return b.clicks - a.clicks;
  });

  return {
    ...group,
    keywordCount: rows.length,
    keywords: rows,
  };
}

export async function GET(request) {
  const authError = requireAdminRequest(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);

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
        await collectGroup(group, range)
      );
    }

    return Response.json(
      {
        ok: true,
        period,
        ...range,
        note:
          "rawConversions는 네이버 /stats ccnt이며 아직 유효 문의 전환으로 확정하지 않습니다.",
        groups,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
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
          "Cache-Control": "private, no-store",
        },
      }
    );
  }
}
