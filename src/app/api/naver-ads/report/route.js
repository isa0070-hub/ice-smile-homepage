import crypto from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function signature(timestamp, method, uri, secretKey) {
  return crypto
    .createHmac("sha256", secretKey)
    .update(`${timestamp}.${method}.${uri}`)
    .digest("base64");
}

async function naverGet(uri, credentials, query = "") {
  const timestamp = Date.now().toString();
  const method = "GET";

  const response = await fetch(
    `https://api.searchad.naver.com${uri}${query}`,
    {
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": credentials.accessLicense,
        "X-Customer": credentials.customerId,
        "X-Signature": signature(
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
      `${response.status} ${JSON.stringify(data)}`
    );
  }

  return data;
}

function getDateRange(period = "yesterday") {
  const now = new Date();

  const kst = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Seoul",
    })
  );

  // 모든 리포트의 종료일은 어제
  const end = new Date(kst);
  end.setDate(end.getDate() - 1);

  let days = 1;

  if (period === "7d") days = 7;
  if (period === "30d") days = 30;

  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  function format(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
  }

  return {
    since: format(start),
    until: format(end),
    days,
  };
}

async function getAdgroups(credentials) {
  const campaigns = await naverGet(
    "/ncc/campaigns",
    credentials
  );

  const groups = [];

  for (const campaign of campaigns) {
    const adgroups = await naverGet(
      "/ncc/adgroups",
      credentials,
      `?nccCampaignId=${encodeURIComponent(
        campaign.nccCampaignId
      )}`
    );

    for (const group of adgroups) {
      groups.push({
        id: group.nccAdgroupId,
        name: group.name,
        status: group.status,
        campaignId: campaign.nccCampaignId,
        campaignName: campaign.name,
        campaignType: campaign.campaignTp,
      });
    }
  }

  return groups;
}

async function getStats(credentials, ids, since, until) {
  if (!ids.length) return [];

  const uri = "/stats";

  const fields = JSON.stringify([
    "impCnt",
    "clkCnt",
    "salesAmt",
    "ccnt",
  ]);

  const results = [];

  for (const id of ids) {
    const query =
      `?id=${encodeURIComponent(id)}` +
      `&fields=${encodeURIComponent(fields)}` +
      `&timeRange=${encodeURIComponent(
        JSON.stringify({
          since,
          until,
        })
      )}`;

    const data = await naverGet(
      uri,
      credentials,
      query
    );

    if (data) {
      if (Array.isArray(data)) {
        results.push(...data);
      } else if (Array.isArray(data.data)) {
        const row = data.data[0] || {};

        results.push({
          id,
          ...row,
        });
      } else {
        results.push({
          id,
          ...data,
        });
      }
    }
  }

  return results;
}

function classify(account, group) {
  if (account === "main") {
    if (group.campaignType === "PLACE") {
      return {
        branch: "gangbyeon",
        adType: "place",
      };
    }

    if (
      group.name.includes("선릉") ||
      group.campaignName === "파워링크#1"
    ) {
      return {
        branch: "seolleung",
        adType: "keyword",
      };
    }

    if (
      group.name.includes("강변") ||
      group.campaignName.includes("강변")
    ) {
      return {
        branch: "gangbyeon",
        adType: "keyword",
      };
    }
  }

  if (account === "seolleung") {
    if (group.campaignType === "PLACE") {
      return {
        branch: "seolleung",
        adType: "place",
      };
    }

    return {
      branch: "seolleung",
      adType: "other",
    };
  }

  return {
    branch: "unknown",
    adType: "other",
  };
}

async function collectAccount(
  account,
  credentials,
  since,
  until
) {
  const groups = await getAdgroups(credentials);

  const stats = await getStats(
    credentials,
    groups.map((g) => g.id),
    since,
    until
  );

  const statMap = new Map(
    (Array.isArray(stats) ? stats : []).map((s) => [
      s.id,
      s,
    ])
  );

  return groups.map((group) => {
    const stat = statMap.get(group.id) || {};

    const impCnt = Number(stat.impCnt || 0);
    const clkCnt = Number(stat.clkCnt || 0);
    const salesAmt = Number(stat.salesAmt || 0);
    const conversions = Number(stat.ccnt || 0);

    return {
      account,
      ...classify(account, group),

      campaignName: group.campaignName,
      campaignType: group.campaignType,

      adgroupId: group.id,
      adgroupName: group.name,
      status: group.status,

      impressions: impCnt,
      clicks: clkCnt,
      cost: salesAmt,
      conversions,

      avgCpc:
        clkCnt > 0
          ? Math.round(salesAmt / clkCnt)
          : 0,
    };
  });
}

function summarize(rows) {
  const result = {
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversions: 0,
    avgCpc: 0,
  };

  for (const row of rows) {
    result.impressions += row.impressions;
    result.clicks += row.clicks;
    result.cost += row.cost;
    result.conversions += row.conversions;
  }

  result.avgCpc =
    result.clicks > 0
      ? Math.round(result.cost / result.clicks)
      : 0;

  return result;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const requestedPeriod =
      searchParams.get("period") || "yesterday";

    const allowedPeriods = [
      "yesterday",
      "7d",
      "30d",
    ];

    const period = allowedPeriods.includes(requestedPeriod)
      ? requestedPeriod
      : "yesterday";

    const range = getDateRange(period);

    const mainCredentials = {
      customerId: process.env.NAVER_AD_CUSTOMER_ID,
      accessLicense:
        process.env.NAVER_AD_ACCESS_LICENSE,
      secretKey: process.env.NAVER_AD_SECRET_KEY,
    };

    const seolleungCredentials = {
      customerId:
        process.env.NAVER_AD_SEOLLEUNG_CUSTOMER_ID,
      accessLicense:
        process.env.NAVER_AD_SEOLLEUNG_ACCESS_LICENSE,
      secretKey:
        process.env.NAVER_AD_SEOLLEUNG_SECRET_KEY,
    };

    const [mainRows, seolleungRows] =
      await Promise.all([
        collectAccount(
          "main",
          mainCredentials,
          range.since,
          range.until
        ),
        collectAccount(
          "seolleung",
          seolleungCredentials,
          range.since,
          range.until
        ),
      ]);

    const rows = [...mainRows, ...seolleungRows];

    const seolleung = rows.filter(
      (r) => r.branch === "seolleung"
    );

    const gangbyeon = rows.filter(
      (r) => r.branch === "gangbyeon"
    );

    return NextResponse.json({
      ok: true,
      period,
      since: range.since,
      until: range.until,
      days: range.days,

      total: summarize(rows),

      branches: {
        seolleung: {
          total: summarize(seolleung),

          keyword: summarize(
            seolleung.filter(
              (r) => r.adType === "keyword"
            )
          ),

          place: summarize(
            seolleung.filter(
              (r) => r.adType === "place"
            )
          ),
        },

        gangbyeon: {
          total: summarize(gangbyeon),

          keyword: summarize(
            gangbyeon.filter(
              (r) => r.adType === "keyword"
            )
          ),

          place: summarize(
            gangbyeon.filter(
              (r) => r.adType === "place"
            )
          ),
        },
      },

      details: rows,
    });
  } catch (error) {
    console.error(
      "NAVER ADS YESTERDAY ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
