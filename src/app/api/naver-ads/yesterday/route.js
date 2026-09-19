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

function yesterdayKST() {
  const now = new Date();

  const kst = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Seoul",
    })
  );

  kst.setDate(kst.getDate() - 1);

  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, "0");
  const d = String(kst.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
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

async function getStats(credentials, ids, date) {
  if (!ids.length) return [];

  const uri = "/stats";

  const fields = JSON.stringify([
    "impCnt",
    "clkCnt",
    "salesAmt",
    "ccnt",
  ]);

  const query =
    `?ids=${encodeURIComponent(JSON.stringify(ids))}` +
    `&fields=${encodeURIComponent(fields)}` +
    `&timeRange=${encodeURIComponent(
      JSON.stringify({
        since: date,
        until: date,
      })
    )}`;

  return naverGet(uri, credentials, query);
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
  date
) {
  const groups = await getAdgroups(credentials);

  const stats = await getStats(
    credentials,
    groups.map((g) => g.id),
    date
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

export async function GET() {
  try {
    const date = yesterdayKST();

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
          date
        ),
        collectAccount(
          "seolleung",
          seolleungCredentials,
          date
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
      date,

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
