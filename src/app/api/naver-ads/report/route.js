import crypto from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeSignature(timestamp, method, uri, secretKey) {
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
      method,
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

function getKstToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    values[part.type] = part.value;
  }

  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDate(ymd, amount) {
  const date = new Date(`${ymd}T12:00:00Z`);

  date.setUTCDate(date.getUTCDate() + amount);

  return date.toISOString().slice(0, 10);
}

function getDates(period) {
  const today = getKstToday();
  const yesterday = shiftDate(today, -1);

  let days = 1;

  if (period === "7d") {
    days = 7;
  }

  if (period === "30d") {
    days = 30;
  }

  const dates = [];

  for (let i = days - 1; i >= 0; i--) {
    dates.push(
      shiftDate(yesterday, -i)
    );
  }

  return dates;
}

function validateCredentials(label, credentials) {
  if (
    !credentials.customerId ||
    !credentials.accessLicense ||
    !credentials.secretKey
  ) {
    throw new Error(
      `${label} 네이버 광고 API 환경변수가 부족합니다.`
    );
  }
}

async function getAdgroups(credentials) {
  const campaigns = await naverGet(
    "/ncc/campaigns",
    credentials
  );

  if (!Array.isArray(campaigns)) {
    throw new Error(
      "캠페인 목록 응답 형식이 예상과 다릅니다."
    );
  }

  const groups = [];

  for (const campaign of campaigns) {
    const adgroups = await naverGet(
      "/ncc/adgroups",
      credentials,
      `?nccCampaignId=${encodeURIComponent(
        campaign.nccCampaignId
      )}`
    );

    if (!Array.isArray(adgroups)) {
      throw new Error(
        `광고그룹 응답 형식 오류: ${campaign.name}`
      );
    }

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

function classify(account, group) {
  if (account === "main") {
    if (group.campaignType === "PLACE") {
      return {
        branch: "gangbyeon",
        adType: "place",
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

    if (
      group.name.includes("선릉") ||
      group.campaignName === "파워링크#1"
    ) {
      return {
        branch: "seolleung",
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

function emptyStat() {
  return {
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversions: 0,
    avgCpc: 0,
  };
}

function addStat(target, source) {
  target.impressions += Number(
    source.impressions || 0
  );

  target.clicks += Number(
    source.clicks || 0
  );

  target.cost += Number(
    source.cost || 0
  );

  target.conversions += Number(
    source.conversions || 0
  );

  target.avgCpc =
    target.clicks > 0
      ? Math.round(
          target.cost / target.clicks
        )
      : 0;

  return target;
}

function summarize(rows) {
  const result = emptyStat();

  for (const row of rows) {
    addStat(result, row);
  }

  return result;
}

async function getPeriodStats(
  credentials,
  id,
  since,
  until
) {
  const uri = "/stats";

  const fields = JSON.stringify([
    "impCnt",
    "clkCnt",
    "salesAmt",
    "ccnt",
  ]);

  const timeRange = JSON.stringify({
    since,
    until,
  });

  const params = new URLSearchParams();

  params.set("id", id);
  params.set("fields", fields);
  params.set("timeRange", timeRange);

  // 기간 전체를 한 번 요청하되
  // 결과는 날짜별로 반환받는다.
  params.set("timeIncrement", "1");

  const response = await naverGet(
    uri,
    credentials,
    `?${params.toString()}`
  );

  if (
    !response ||
    !Array.isArray(response.data)
  ) {
    throw new Error(
      `통계 응답 형식 오류: ${id}`
    );
  }

  return response.data.map((row) => ({
    date:
      row.dateStart ||
      row.dateEnd ||
      null,

    impressions: Number(
      row.impCnt || 0
    ),

    clicks: Number(
      row.clkCnt || 0
    ),

    cost: Number(
      row.salesAmt || 0
    ),

    conversions: Number(
      row.ccnt || 0
    ),
  }));
}

async function collectAccount(
  account,
  credentials,
  dates
) {
  const groups =
    await getAdgroups(credentials);

  const since = dates[0];
  const until =
    dates[dates.length - 1];

  const results = [];

  for (const group of groups) {
    const classification =
      classify(account, group);

    const rawDaily =
      await getPeriodStats(
        credentials,
        group.id,
        since,
        until
      );

    const statMap = new Map();

    for (const stat of rawDaily) {
      if (!stat.date) {
        continue;
      }

      statMap.set(
        stat.date,
        stat
      );
    }

    // 네이버가 0실적 날짜를 생략해도
    // 요청 기간의 날짜를 모두 생성한다.
    const daily = dates.map((date) => {
      const stat =
        statMap.get(date) ||
        emptyStat();

      return {
        date,

        impressions:
          Number(
            stat.impressions || 0
          ),

        clicks:
          Number(
            stat.clicks || 0
          ),

        cost:
          Number(
            stat.cost || 0
          ),

        conversions:
          Number(
            stat.conversions || 0
          ),

        avgCpc:
          Number(stat.clicks || 0) > 0
            ? Math.round(
                Number(
                  stat.cost || 0
                ) /
                  Number(
                    stat.clicks || 0
                  )
              )
            : 0,
      };
    });

    const total =
      summarize(daily);

    results.push({
      account,

      ...classification,

      campaignId:
        group.campaignId,

      campaignName:
        group.campaignName,

      campaignType:
        group.campaignType,

      adgroupId:
        group.id,

      adgroupName:
        group.name,

      status:
        group.status,

      ...total,

      daily,
    });
  }

  return results;
}

function buildDailySummary(
  rows,
  dates
) {
  return dates.map((date) => {
    const dayRows = rows.map(
      (row) => {
        const stat =
          row.daily.find(
            (item) =>
              item.date === date
          ) ||
          emptyStat();

        return {
          ...stat,
          branch: row.branch,
          adType: row.adType,
        };
      }
    );

    const trackedRows =
      dayRows.filter(
        (row) =>
          row.adType === "keyword" ||
          row.adType === "place"
      );

    const unclassifiedRows =
      dayRows.filter(
        (row) =>
          row.adType !== "keyword" &&
          row.adType !== "place"
      );

    const seolleung =
      trackedRows.filter(
        (row) =>
          row.branch === "seolleung"
      );

    const gangbyeon =
      trackedRows.filter(
        (row) =>
          row.branch === "gangbyeon"
      );

    return {
      date,

      // 두 계정 전체 실제 지출
      total: summarize(dayRows),

      trackedTotal:
        summarize(trackedRows),

      unclassified:
        summarize(
          unclassifiedRows
        ),

      branches: {
        seolleung:
          summarize(seolleung),

        gangbyeon:
          summarize(gangbyeon),
      },
    };
  });
}

export async function GET(request) {
  try {
    const {
      searchParams,
    } = new URL(request.url);

    const requestedPeriod =
      searchParams.get("period") ||
      "yesterday";

    const allowedPeriods = [
      "yesterday",
      "7d",
      "30d",
    ];

    const period =
      allowedPeriods.includes(
        requestedPeriod
      )
        ? requestedPeriod
        : "yesterday";

    const dates =
      getDates(period);

    const mainCredentials = {
      customerId:
        process.env
          .NAVER_AD_CUSTOMER_ID,

      accessLicense:
        process.env
          .NAVER_AD_ACCESS_LICENSE,

      secretKey:
        process.env
          .NAVER_AD_SECRET_KEY,
    };

    const seolleungCredentials = {
      customerId:
        process.env
          .NAVER_AD_SEOLLEUNG_CUSTOMER_ID,

      accessLicense:
        process.env
          .NAVER_AD_SEOLLEUNG_ACCESS_LICENSE,

      secretKey:
        process.env
          .NAVER_AD_SEOLLEUNG_SECRET_KEY,
    };

    validateCredentials(
      "메인 계정",
      mainCredentials
    );

    validateCredentials(
      "선릉 플레이스 계정",
      seolleungCredentials
    );

    const [
      mainRows,
      seolleungRows,
    ] = await Promise.all([
      collectAccount(
        "main",
        mainCredentials,
        dates
      ),

      collectAccount(
        "seolleung",
        seolleungCredentials,
        dates
      ),
    ]);

    const rows = [
      ...mainRows,
      ...seolleungRows,
    ];

    const trackedRows =
      rows.filter(
        (row) =>
          row.adType === "keyword" ||
          row.adType === "place"
      );

    const unclassifiedRows =
      rows.filter(
        (row) =>
          row.adType !== "keyword" &&
          row.adType !== "place"
      );

    const seolleung =
      trackedRows.filter(
        (row) =>
          row.branch === "seolleung"
      );

    const gangbyeon =
      trackedRows.filter(
        (row) =>
          row.branch === "gangbyeon"
      );

    const daily =
      buildDailySummary(
        rows,
        dates
      );

    const total =
      summarize(rows);

    const trackedTotal =
      summarize(trackedRows);

    const unclassified =
      summarize(unclassifiedRows);

    const dailyTotal =
      summarize(
        daily.map((day) => day.total)
      );

    const dailyTrackedTotal =
      summarize(
        daily.map((day) => day.trackedTotal)
      );

    const dailyUnclassified =
      summarize(
        daily.map((day) => day.unclassified)
      );

    function sameStat(a, b) {
      return (
        a.impressions === b.impressions &&
        a.clicks === b.clicks &&
        a.cost === b.cost &&
        a.conversions === b.conversions
      );
    }

    const validation = {
      passed:
        sameStat(total, dailyTotal) &&
        sameStat(
          trackedTotal,
          dailyTrackedTotal
        ) &&
        sameStat(
          unclassified,
          dailyUnclassified
        ),

      totalMatchesDaily:
        sameStat(total, dailyTotal),

      trackedMatchesDaily:
        sameStat(
          trackedTotal,
          dailyTrackedTotal
        ),

      unclassifiedMatchesDaily:
        sameStat(
          unclassified,
          dailyUnclassified
        ),

      totalCost:
        total.cost,

      dailyCostSum:
        dailyTotal.cost,
    };

    return NextResponse.json({
      ok: true,

      period,

      since:
        dates[0],

      until:
        dates[
          dates.length - 1
        ],

      days:
        dates.length,

      generatedAt:
        new Date().toISOString(),

      // 두 네이버 광고계정 전체
      total,

      // 선릉/강변으로 정상 분류된 광고
      trackedTotal,

      // 아직 분류하지 않은 캠페인
      unclassified,

      validation,

      branches: {
        seolleung: {
          total:
            summarize(
              seolleung
            ),

          keyword:
            summarize(
              seolleung.filter(
                (row) =>
                  row.adType ===
                  "keyword"
              )
            ),

          place:
            summarize(
              seolleung.filter(
                (row) =>
                  row.adType ===
                  "place"
              )
            ),
        },

        gangbyeon: {
          total:
            summarize(
              gangbyeon
            ),

          keyword:
            summarize(
              gangbyeon.filter(
                (row) =>
                  row.adType ===
                  "keyword"
              )
            ),

          place:
            summarize(
              gangbyeon.filter(
                (row) =>
                  row.adType ===
                  "place"
              )
            ),
        },
      },

      daily,

      details:
        rows,
    });
  } catch (error) {
    console.error(
      "NAVER ADS REPORT ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}
