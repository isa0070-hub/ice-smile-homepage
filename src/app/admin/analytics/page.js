import Link from "next/link";
import { getSearchTrafficSummary } from "@/lib/ga4Analytics";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "검색 유입 통계 | 아이스마일어게인 관리자",
  robots: {
    index: false,
    follow: false,
  },
};

const PERIODS = [
  {
    key: "yesterday",
    label: "전일",
  },
  {
    key: "7d",
    label: "7일",
  },
  {
    key: "30d",
    label: "30일",
  },
];

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MAX_AD_CLICK_ROWS = 5000;

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function getPeriodRange(periodKey) {
  const now = new Date();
  const shiftedNow = new Date(
    now.getTime() + KST_OFFSET_MS
  );

  const startOfToday = new Date(
    Date.UTC(
      shiftedNow.getUTCFullYear(),
      shiftedNow.getUTCMonth(),
      shiftedNow.getUTCDate()
    ) - KST_OFFSET_MS
  );

  if (periodKey === "yesterday") {
    return {
      start: new Date(
        startOfToday.getTime() - DAY_MS
      ),
      end: new Date(startOfToday.getTime() - 1),
      label: "전일",
    };
  }

  const days = periodKey === "30d" ? 30 : 7;

  return {
    start: new Date(
      startOfToday.getTime() -
        (days - 1) * DAY_MS
    ),
    end: now,
    label: `최근 ${days}일`,
  };
}

function formatDateTime(value) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDuration(duration) {
  if (
    duration === null ||
    duration === undefined ||
    !Number.isFinite(duration)
  ) {
    return "-";
  }

  if (duration < 60 * 1000) {
    return `${Math.max(
      1,
      Math.round(duration / 1000)
    )}초`;
  }

  if (duration < HOUR_MS) {
    return `${Math.round(
      duration / (60 * 1000)
    )}분`;
  }

  if (duration < DAY_MS) {
    const hours = Math.floor(
      duration / HOUR_MS
    );
    const minutes = Math.round(
      (duration % HOUR_MS) / (60 * 1000)
    );

    return minutes
      ? `${hours}시간 ${minutes}분`
      : `${hours}시간`;
  }

  const days = Math.floor(duration / DAY_MS);
  const hours = Math.round(
    (duration % DAY_MS) / HOUR_MS
  );

  return hours
    ? `${days}일 ${hours}시간`
    : `${days}일`;
}

function asObject(value) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
}

function isNaverAdVisit(row) {
  const source = String(
    row.traffic_source || ""
  ).toLowerCase();

  const medium = String(
    row.traffic_medium || ""
  ).toLowerCase();

  const referrer = String(
    row.referrer || ""
  ).toLowerCase();

  const naverTracking =
    asObject(row.naver_tracking);

  const queryParams = asObject(row.query_params);

  const hasNaverQuery = Object.keys(
    queryParams
  ).some(
    (key) =>
      key === "NaPm" ||
      key.toLowerCase().startsWith("n_")
  );

  return (
    source.includes("naver") ||
    Object.keys(naverTracking).length > 0 ||
    hasNaverQuery ||
    (referrer.includes("naver.") &&
      ["cpc", "ppc", "paid", "paidsearch"].some(
        (value) => medium.includes(value)
      ))
  );
}

function getRiskLevel({
  maxScore,
  count,
  minGapMs,
  hasBot,
}) {
  if (
    hasBot ||
    maxScore >= 50 ||
    (count >= 4 &&
      minGapMs !== null &&
      minGapMs <= HOUR_MS)
  ) {
    return {
      key: "suspected",
      label: "확인 필요",
      color: "#b91c1c",
      background: "#fef2f2",
    };
  }

  if (
    maxScore >= 30 ||
    (count >= 2 &&
      minGapMs !== null &&
      minGapMs <= DAY_MS)
  ) {
    return {
      key: "caution",
      label: "주의",
      color: "#b45309",
      background: "#fff7ed",
    };
  }

  return {
    key: "normal",
    label: "일반",
    color: "#475569",
    background: "#f1f5f9",
  };
}

function analyzeNaverAdClicks(rows) {
  const visits = rows
    .filter(isNaverAdVisit)
    .map((row) => ({
      ...row,
      clickedTime: new Date(
        row.clicked_at
      ).getTime(),
      suspicionScore: Number(
        row.suspicion_score || 0
      ),
    }))
    .filter((row) =>
      Number.isFinite(row.clickedTime)
    )
    .sort(
      (a, b) => a.clickedTime - b.clickedTime
    );

  const groupMap = new Map();

  for (const visit of visits) {
    const groupKey = visit.ip_address
      ? `ip:${visit.ip_address}`
      : `unknown:${visit.id}`;

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        key: groupKey,
        ipAddress:
          visit.ip_address || "확인 불가",
        visits: [],
      });
    }

    groupMap.get(groupKey).visits.push(visit);
  }

  const groups = Array.from(
    groupMap.values()
  ).map((group) => {
    const gaps = [];

    for (
      let index = 1;
      index < group.visits.length;
      index += 1
    ) {
      gaps.push(
        group.visits[index].clickedTime -
          group.visits[index - 1].clickedTime
      );
    }

    const minGapMs = gaps.length
      ? Math.min(...gaps)
      : null;

    const maxScore = Math.max(
      0,
      ...group.visits.map(
        (visit) => visit.suspicionScore
      )
    );

    const hasBot = group.visits.some(
      (visit) => visit.is_bot
    );

    const risk = getRiskLevel({
      maxScore,
      count: group.visits.length,
      minGapMs,
      hasBot,
    });

    return {
      ...group,
      count: group.visits.length,
      firstVisit: group.visits[0],
      lastVisit:
        group.visits[group.visits.length - 1],
      minGapMs,
      maxScore,
      risk,
      keywords: Array.from(
        new Set(
          group.visits
            .map(
              (visit) =>
                visit.search_keyword
            )
            .filter(Boolean)
        )
      ),
    };
  });

  const riskOrder = {
    suspected: 3,
    caution: 2,
    normal: 1,
  };

  groups.sort(
    (a, b) =>
      riskOrder[b.risk.key] -
        riskOrder[a.risk.key] ||
      b.maxScore - a.maxScore ||
      b.count - a.count ||
      b.lastVisit.clickedTime -
        a.lastVisit.clickedTime
  );

  const suspiciousGroups = groups.filter(
    (group) => group.risk.key !== "normal"
  );

  const suspiciousGroupKeys = new Set(
    suspiciousGroups.map((group) => group.key)
  );

  const previousTimeByGroup = new Map();

  const exportVisits = visits
    .filter((visit) => {
      const key = visit.ip_address
        ? `ip:${visit.ip_address}`
        : `unknown:${visit.id}`;

      return suspiciousGroupKeys.has(key);
    })
    .map((visit) => {
      const key = visit.ip_address
        ? `ip:${visit.ip_address}`
        : `unknown:${visit.id}`;

      const previousTime =
        previousTimeByGroup.get(key);

      const gapMs =
        previousTime === undefined
          ? null
          : visit.clickedTime - previousTime;

      previousTimeByGroup.set(
        key,
        visit.clickedTime
      );

      const group = groupMap.has(key)
        ? groups.find(
            (item) => item.key === key
          )
        : null;

      return {
        ...visit,
        gapMs,
        group,
      };
    })
    .sort(
      (a, b) => b.clickedTime - a.clickedTime
    );

  return {
    visits,
    groups,
    suspiciousGroups,
    exportVisits,
    repeatIpCount: groups.filter(
      (group) =>
        group.ipAddress !== "확인 불가" &&
        group.count >= 2
    ).length,
    cautionVisitCount: exportVisits.length,
  };
}

async function getNaverAdClickAnalysis(
  periodKey
) {
  const range = getPeriodRange(periodKey);
  const rows = [];
  const pageSize = 1000;

  for (
    let from = 0;
    from < MAX_AD_CLICK_ROWS;
    from += pageSize
  ) {
    const to = Math.min(
      from + pageSize - 1,
      MAX_AD_CLICK_ROWS - 1
    );

    const { data, error } = await supabaseAdmin
      .from("ad_click_visits")
      .select(
        [
          "id",
          "clicked_at",
          "ip_address",
          "visitor_id",
          "session_id",
          "landing_url",
          "advertiser_url",
          "landing_path",
          "referrer",
          "traffic_source",
          "traffic_medium",
          "campaign",
          "search_keyword",
          "naver_tracking",
          "query_params",
          "device_type",
          "browser_name",
          "os_name",
          "is_bot",
          "suspicion_score",
          "suspicion_reasons",
          "review_status",
        ].join(",")
      )
      .gte(
        "clicked_at",
        range.start.toISOString()
      )
      .lte(
        "clicked_at",
        range.end.toISOString()
      )
      .order("clicked_at", {
        ascending: false,
      })
      .range(from, to);

    if (error) {
      throw error;
    }

    const batch = data || [];
    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }
  }

  return {
    ...analyzeNaverAdClicks(rows),
    periodLabel: range.label,
    reachedLimit:
      rows.length >= MAX_AD_CLICK_ROWS,
  };
}

function safeCsvCell(value) {
  let text = Array.isArray(value)
    ? value.join(" / ")
    : String(value ?? "");

  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function makeNaverCsv(analysis) {
  const headers = [
    "클릭 일시(KST)",
    "유입 IP",
    "검색 키워드",
    "광고주 URL",
    "방문 페이지",
    "이전 동일 IP 클릭과 간격",
    "의심 단계",
    "의심 점수",
    "의심 사유",
    "기기",
    "브라우저",
    "운영체제",
    "캠페인",
  ];

  const lines = [
    headers.map(safeCsvCell).join(","),
  ];

  for (const visit of analysis.exportVisits) {
    lines.push(
      [
        formatDateTime(visit.clicked_at),
        visit.ip_address || "확인 불가",
        visit.search_keyword || "",
        visit.advertiser_url ||
          visit.landing_url ||
          "",
        visit.landing_url ||
          visit.landing_path ||
          "",
        formatDuration(visit.gapMs),
        visit.group?.risk.label || "일반",
        visit.suspicionScore,
        visit.suspicion_reasons || [],
        visit.device_type || "",
        visit.browser_name || "",
        visit.os_name || "",
        visit.campaign || "",
      ]
        .map(safeCsvCell)
        .join(",")
    );
  }

  return `\uFEFF${lines.join("\r\n")}`;
}

function getCsvDownloadName() {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  )
    .formatToParts(new Date())
    .reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

  return `naver-suspicious-clicks-${parts.year}-${parts.month}-${parts.day}.csv`;
}

function safeWebUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (
      url.protocol === "http:" ||
      url.protocol === "https:"
    ) {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function shortenText(value, maxLength = 58) {
  const text = String(value || "");

  if (text.length <= maxLength) {
    return text || "-";
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

function MetricCard({
  label,
  value,
  description,
  emphasis = false,
}) {
  return (
    <div
      style={{
        ...metricCardStyle,
        ...(emphasis ? metricCardEmphasisStyle : {}),
      }}
    >
      <p style={metricLabelStyle}>{label}</p>

      <strong style={metricValueStyle}>
        {formatNumber(value)}
        <span style={metricUnitStyle}>회</span>
      </strong>

      <p style={metricDescriptionStyle}>
        {description}
      </p>
    </div>
  );
}

function BreakdownPanel({
  title,
  total,
  items,
  accent,
}) {
  return (
    <section style={breakdownPanelStyle}>
      <div style={breakdownHeaderStyle}>
        <h2 style={sectionTitleStyle}>{title}</h2>

        <strong style={{ color: accent }}>
          {formatNumber(total)}회
        </strong>
      </div>

      <div style={breakdownListStyle}>
        {items.map((item) => (
          <div
            key={item.label}
            style={breakdownRowStyle}
          >
            <span style={breakdownLabelStyle}>
              {item.label}
            </span>

            <strong style={breakdownValueStyle}>
              {formatNumber(item.value)}회
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function RepairCaseTopList({
  title,
  description,
  items,
}) {
  return (
    <section style={topListPanelStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>

      <p style={sectionDescriptionStyle}>
        {description}
      </p>

      {items.length === 0 ? (
        <div style={emptyStyle}>
          해당 기간에 확인된 수리사례 유입이 없습니다.
        </div>
      ) : (
        <div style={topListStyle}>
          {items.map((item, index) => (
            <Link
              key={item.path}
              href={item.path}
              style={topItemStyle}
            >
              <span style={rankStyle}>
                {index + 1}
              </span>

              <span style={topTitleStyle}>
                {item.title}
              </span>

              <strong style={topValueStyle}>
                {formatNumber(item.sessions)}회
              </strong>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function RiskBadge({ risk }) {
  return (
    <span
      style={{
        ...riskBadgeStyle,
        color: risk.color,
        background: risk.background,
      }}
    >
      {risk.label}
    </span>
  );
}

function NaverAdClickPanel({
  analysis,
  error,
}) {
  if (error) {
    return (
      <section
        id="naver-ad-clicks"
        style={adClickSectionStyle}
      >
        <div style={sectionHeadingRowStyle}>
          <div>
            <p style={sectionEyebrowStyle}>
              네이버 광고
            </p>

            <h2 style={adClickTitleStyle}>
              의심 클릭 분석
            </h2>
          </div>
        </div>

        <div style={errorStyle}>
          <strong>
            광고 클릭 기록을 불러오지
            못했습니다.
          </strong>

          <p style={{ marginBottom: 0 }}>
            ad_click_visits 테이블과 관리자
            Supabase 연결을 확인해주세요.
          </p>
        </div>
      </section>
    );
  }

  const csv =
    analysis.exportVisits.length > 0
      ? makeNaverCsv(analysis)
      : null;

  const csvHref = csv
    ? `data:text/csv;charset=utf-8,${encodeURIComponent(
        csv
      )}`
    : null;

  const latestVisits = [...analysis.visits]
    .sort(
      (a, b) => b.clickedTime - a.clickedTime
    )
    .slice(0, 200);

  return (
    <section
      id="naver-ad-clicks"
      style={adClickSectionStyle}
    >
      <div style={sectionHeadingRowStyle}>
        <div>
          <p style={sectionEyebrowStyle}>
            네이버 파워링크 증거 수집
          </p>

          <h2 style={adClickTitleStyle}>
            네이버 광고 의심 클릭
          </h2>

          <p style={sectionDescriptionStyle}>
            같은 IP의 반복 방문과 클릭 간격,
            저장된 의심 점수를 함께 확인합니다.
            의심 단계는 검토 우선순위이며 부정
            클릭 확정 판정은 아닙니다.
          </p>
        </div>

        {csvHref ? (
          <a
            href={csvHref}
            download={getCsvDownloadName()}
            style={csvButtonStyle}
          >
            네이버 제출용 CSV
          </a>
        ) : (
          <span style={csvButtonDisabledStyle}>
            제출할 의심 자료 없음
          </span>
        )}
      </div>

      <p style={selectedPeriodStyle}>
        광고 클릭 선택 기간:{" "}
        {analysis.periodLabel}
      </p>

      <section style={adMetricGridStyle}>
        <MetricCard
          label="네이버 광고 방문"
          value={analysis.visits.length}
          description="선택 기간에 수집된 네이버 유료광고 방문"
          emphasis
        />

        <MetricCard
          label="확인된 IP"
          value={analysis.groups.filter(
            (group) =>
              group.ipAddress !== "확인 불가"
          ).length}
          description="광고 방문이 기록된 서로 다른 IP"
        />

        <MetricCard
          label="반복 방문 IP"
          value={analysis.repeatIpCount}
          description="선택 기간에 2회 이상 방문한 IP"
        />

        <MetricCard
          label="주의 이상 클릭"
          value={analysis.cautionVisitCount}
          description="반복 간격이나 점수상 검토가 필요한 클릭"
        />
      </section>

      {analysis.reachedLimit && (
        <div style={noticeStyle}>
          선택 기간의 기록이{" "}
          {formatNumber(MAX_AD_CLICK_ROWS)}
          건을 넘어 최신 분석 범위가 제한됐습니다.
        </div>
      )}

      {analysis.visits.length === 0 ? (
        <div style={adEmptyStyle}>
          해당 기간에 수집된 네이버 광고 방문이
          없습니다.
        </div>
      ) : (
        <>
          <div style={panelHeadingStyle}>
            <div>
              <h3 style={panelTitleStyle}>
                IP별 반복 클릭 분석
              </h3>

              <p style={panelDescriptionStyle}>
                확인 필요 → 주의 → 일반 순으로
                표시합니다.
              </p>
            </div>
          </div>

          <div style={tablePanelStyle}>
            <div style={tableScrollStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>
                      의심 정도
                    </th>
                    <th style={tableHeaderStyle}>
                      IP
                    </th>
                    <th style={tableHeaderStyle}>
                      방문
                    </th>
                    <th style={tableHeaderStyle}>
                      최초 클릭
                    </th>
                    <th style={tableHeaderStyle}>
                      최근 클릭
                    </th>
                    <th style={tableHeaderStyle}>
                      최소 간격
                    </th>
                    <th style={tableHeaderStyle}>
                      검색어
                    </th>
                    <th style={tableHeaderStyle}>
                      최고 점수
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {analysis.groups
                    .slice(0, 100)
                    .map((group) => (
                      <tr key={group.key}>
                        <td style={tableCellStyle}>
                          <RiskBadge
                            risk={group.risk}
                          />
                        </td>
                        <td style={ipCellStyle}>
                          {group.ipAddress}
                        </td>
                        <td style={tableCellStyle}>
                          <strong>
                            {formatNumber(
                              group.count
                            )}
                            회
                          </strong>
                        </td>
                        <td style={dateCellStyle}>
                          {formatDateTime(
                            group.firstVisit
                              .clicked_at
                          )}
                        </td>
                        <td style={dateCellStyle}>
                          {formatDateTime(
                            group.lastVisit
                              .clicked_at
                          )}
                        </td>
                        <td style={tableCellStyle}>
                          {formatDuration(
                            group.minGapMs
                          )}
                        </td>
                        <td style={keywordCellStyle}>
                          {group.keywords.length
                            ? group.keywords.join(
                                " / "
                              )
                            : "-"}
                        </td>
                        <td style={tableCellStyle}>
                          {group.maxScore}점
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={panelHeadingStyle}>
            <div>
              <h3 style={panelTitleStyle}>
                최근 클릭 상세
              </h3>

              <p style={panelDescriptionStyle}>
                최신 200건까지 클릭 시각·검색어·
                광고 주소·방문 페이지를 확인할 수
                있습니다.
              </p>
            </div>
          </div>

          <div style={tablePanelStyle}>
            <div style={tableScrollStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>
                      클릭 시각
                    </th>
                    <th style={tableHeaderStyle}>
                      IP
                    </th>
                    <th style={tableHeaderStyle}>
                      검색어
                    </th>
                    <th style={tableHeaderStyle}>
                      광고주 URL
                    </th>
                    <th style={tableHeaderStyle}>
                      방문 페이지
                    </th>
                    <th style={tableHeaderStyle}>
                      환경
                    </th>
                    <th style={tableHeaderStyle}>
                      점수
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {latestVisits.map((visit) => {
                    const advertiserUrl =
                      safeWebUrl(
                        visit.advertiser_url ||
                          visit.landing_url
                      );

                    const landingUrl =
                      safeWebUrl(
                        visit.landing_url
                      );

                    return (
                      <tr key={visit.id}>
                        <td style={dateCellStyle}>
                          {formatDateTime(
                            visit.clicked_at
                          )}
                        </td>
                        <td style={ipCellStyle}>
                          {visit.ip_address ||
                            "확인 불가"}
                        </td>
                        <td style={keywordCellStyle}>
                          {visit.search_keyword ||
                            "-"}
                        </td>
                        <td style={urlCellStyle}>
                          {advertiserUrl ? (
                            <a
                              href={advertiserUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={tableLinkStyle}
                              title={advertiserUrl}
                            >
                              {shortenText(
                                advertiserUrl
                              )}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td style={urlCellStyle}>
                          {landingUrl ? (
                            <a
                              href={landingUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={tableLinkStyle}
                              title={landingUrl}
                            >
                              {shortenText(
                                visit.landing_path ||
                                  landingUrl
                              )}
                            </a>
                          ) : (
                            visit.landing_path ||
                            "-"
                          )}
                        </td>
                        <td style={environmentCellStyle}>
                          {[
                            visit.device_type,
                            visit.browser_name,
                            visit.os_name,
                          ]
                            .filter(Boolean)
                            .join(" / ") || "-"}
                        </td>
                        <td style={tableCellStyle}>
                          {visit.suspicionScore}
                          점
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <p style={adBottomNoticeStyle}>
        ※ CSV에는 “확인 필요” 또는 “주의”로
        분류된 클릭만 포함됩니다. 네이버 제출 전
        클릭 시각·IP·검색어·광고주 URL을 한 번
        더 확인해주세요.
      </p>
    </section>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}) {
  const resolvedSearchParams =
    await searchParams;

  const requestedPeriod =
    resolvedSearchParams?.period || "7d";

  const periodKey = PERIODS.some(
    (item) => item.key === requestedPeriod
  )
    ? requestedPeriod
    : "7d";

  let analytics;
  let adClickAnalysis = null;
  let adClickError = null;

  try {
    analytics =
      await getSearchTrafficSummary(periodKey);
  } catch (error) {
    console.error(
      "GA4 관리자 통계 조회 실패:",
      error
    );

    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <h1 style={pageTitleStyle}>
            검색 유입 통계
          </h1>

          <div style={errorStyle}>
            <strong>
              통계를 불러오지 못했습니다.
            </strong>

            <p style={{ marginBottom: 0 }}>
              환경변수와 Google Analytics 권한을
              다시 확인해주세요.
            </p>
          </div>
        </div>
      </main>
    );
  }

  try {
    adClickAnalysis =
      await getNaverAdClickAnalysis(periodKey);
  } catch (error) {
    adClickError = error;
    console.error(
      "네이버 광고 클릭 분석 조회 실패:",
      error
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={pageHeaderStyle}>
          <div>
            <p style={eyebrowStyle}>
              아이스마일어게인 관리자
            </p>

            <h1 style={pageTitleStyle}>
              검색 유입 통계
            </h1>

            <p style={pageDescriptionStyle}>
              광고와 일반검색을 구분해 어떤
              수리사례가 실제 검색 유입을 만들고
              있는지 확인합니다.
            </p>
          </div>

          <Link
            href="/admin"
            style={adminBackLinkStyle}
          >
            관리자 홈
          </Link>
        </div>

        <nav
          aria-label="관리자 통계 메뉴"
          style={analyticsMenuStyle}
        >
          <a
            href="#search-traffic"
            style={analyticsMenuLinkStyle}
          >
            검색 유입 통계
          </a>

          <a
            href="#naver-ad-clicks"
            style={analyticsMenuLinkAccentStyle}
          >
            네이버 광고 의심 클릭
          </a>
        </nav>

        <nav
          aria-label="통계 기간 선택"
          style={periodNavStyle}
        >
          {PERIODS.map((period) => {
            const active =
              period.key === periodKey;

            return (
              <Link
                key={period.key}
                href={`/admin/analytics?period=${period.key}`}
                style={{
                  ...periodButtonStyle,
                  ...(active
                    ? periodButtonActiveStyle
                    : {}),
                }}
              >
                {period.label}
              </Link>
            );
          })}
        </nav>

        <p style={selectedPeriodStyle}>
          선택 기간: {analytics.periodLabel}
        </p>

        <section
          id="search-traffic"
          style={metricGridStyle}
        >
          <MetricCard
            label="검색 유입 합계"
            value={analytics.searchTotal}
            description="자연검색과 유료광고 유입 합계"
            emphasis
          />

          <MetricCard
            label="자연검색 유입"
            value={analytics.organic.total}
            description="광고가 아닌 포털 일반검색 유입"
          />

          <MetricCard
            label="유료광고 유입"
            value={analytics.paid.total}
            description="파워링크와 검색광고 유입"
          />
        </section>

        {!analytics.hasData && (
          <div style={noticeStyle}>
            아직 해당 기간의 검색 유입 데이터가
            없습니다. GA4 설치 이후 데이터부터
            표시됩니다.
          </div>
        )}

        <section style={breakdownGridStyle}>
          <BreakdownPanel
            title="자연검색 세부"
            total={analytics.organic.total}
            accent="#15803d"
            items={[
              {
                label: "네이버 자연검색",
                value: analytics.organic.naver,
              },
              {
                label: "구글 자연검색",
                value: analytics.organic.google,
              },
              {
                label: "다음·빙·기타",
                value: analytics.organic.other,
              },
            ]}
          />

          <BreakdownPanel
            title="유료광고 세부"
            total={analytics.paid.total}
            accent="#b45309"
            items={[
              {
                label: "네이버 파워링크",
                value: analytics.paid.naver,
              },
              {
                label: "구글 검색광고",
                value: analytics.paid.google,
              },
              {
                label: "기타 유료광고",
                value: analytics.paid.other,
              },
            ]}
          />
        </section>

        <section style={topGridStyle}>
          <RepairCaseTopList
            title="자연검색 유입 수리사례"
            description="광고 없이 포털 검색결과에서 처음 들어온 수리사례입니다."
            items={analytics.organicTop}
          />

          <RepairCaseTopList
            title="유료광고 유입 수리사례"
            description="검색광고를 클릭한 뒤 처음 들어온 수리사례입니다."
            items={analytics.paidTop}
          />
        </section>

        <NaverAdClickPanel
          analysis={adClickAnalysis}
          error={adClickError}
        />

        <p style={bottomNoticeStyle}>
          ※ 직접 방문, 출처 불명, 추천사이트
          유입은 기본 화면에서 제외했습니다.
          검색 유입으로 명확히 분류된 데이터만
          표시합니다.
        </p>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "54px 20px 90px",
};

const containerStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const pageHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "28px",
};

const eyebrowStyle = {
  margin: "0 0 8px",
  color: "#2563eb",
  fontSize: "14px",
  fontWeight: "900",
};

const pageTitleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "clamp(34px, 6vw, 52px)",
  lineHeight: 1.15,
};

const pageDescriptionStyle = {
  maxWidth: "650px",
  margin: "14px 0 0",
  color: "#64748b",
  fontSize: "16px",
  lineHeight: 1.8,
};

const adminBackLinkStyle = {
  display: "inline-block",
  padding: "11px 17px",
  borderRadius: "999px",
  background: "#0f172a",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "900",
};

const analyticsMenuStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const analyticsMenuLinkStyle = {
  display: "inline-block",
  padding: "11px 16px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#334155",
  textDecoration: "none",
  fontWeight: "900",
};

const analyticsMenuLinkAccentStyle = {
  ...analyticsMenuLinkStyle,
  borderColor: "#fbbf24",
  background: "#fffbeb",
  color: "#92400e",
};

const periodNavStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const periodButtonStyle = {
  display: "inline-block",
  minWidth: "84px",
  padding: "11px 18px",
  borderRadius: "999px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#475569",
  textAlign: "center",
  textDecoration: "none",
  fontWeight: "900",
};

const periodButtonActiveStyle = {
    background: "#1e3a8a",
    border: "1px solid #1e3a8a",
    color: "#ffffff",
  };

const selectedPeriodStyle = {
  margin: "14px 0 24px",
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "800",
};

const metricGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const metricCardStyle = {
  minHeight: "172px",
  padding: "24px",
  borderRadius: "22px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  boxShadow:
    "0 10px 26px rgba(15, 23, 42, 0.06)",
};

const metricCardEmphasisStyle = {
  background:
    "linear-gradient(135deg, #1e3a8a, #2563eb)",
  borderColor: "#1e3a8a",
  color: "#ffffff",
};

const metricLabelStyle = {
  margin: "0 0 18px",
  fontSize: "15px",
  fontWeight: "900",
};

const metricValueStyle = {
  display: "block",
  fontSize: "42px",
  lineHeight: 1,
};

const metricUnitStyle = {
  marginLeft: "5px",
  fontSize: "17px",
};

const metricDescriptionStyle = {
  margin: "18px 0 0",
  fontSize: "14px",
  lineHeight: 1.6,
  opacity: 0.76,
};

const noticeStyle = {
  marginTop: "20px",
  padding: "18px",
  borderRadius: "16px",
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  color: "#9a3412",
  fontWeight: "800",
};

const breakdownGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "18px",
  marginTop: "22px",
};

const breakdownPanelStyle = {
  padding: "25px",
  borderRadius: "22px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  boxShadow:
    "0 10px 26px rgba(15, 23, 42, 0.05)",
};

const breakdownHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  alignItems: "center",
  marginBottom: "18px",
};

const sectionTitleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "23px",
  lineHeight: 1.4,
};

const sectionDescriptionStyle = {
  margin: "10px 0 20px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.7,
};

const breakdownListStyle = {
  display: "grid",
  gap: "10px",
};

const breakdownRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  padding: "14px 0",
  borderTop: "1px solid #f1f5f9",
};

const breakdownLabelStyle = {
  color: "#475569",
  fontWeight: "800",
};

const breakdownValueStyle = {
  color: "#0f172a",
};

const topGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(340px, 1fr))",
  gap: "18px",
  marginTop: "22px",
};

const topListPanelStyle = {
  padding: "25px",
  borderRadius: "22px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  boxShadow:
    "0 10px 26px rgba(15, 23, 42, 0.05)",
};

const topListStyle = {
  display: "grid",
};

const topItemStyle = {
  display: "grid",
  gridTemplateColumns: "36px 1fr auto",
  alignItems: "center",
  gap: "12px",
  padding: "15px 0",
  borderTop: "1px solid #f1f5f9",
  color: "#0f172a",
  textDecoration: "none",
};

const rankStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "30px",
  height: "30px",
  borderRadius: "10px",
  background: "#eff6ff",
  color: "#1e3a8a",
  fontWeight: "900",
};

const topTitleStyle = {
  minWidth: 0,
  lineHeight: 1.5,
  fontWeight: "800",
};

const topValueStyle = {
  whiteSpace: "nowrap",
  color: "#1e3a8a",
};

const emptyStyle = {
  padding: "28px 18px",
  borderRadius: "16px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center",
  fontSize: "14px",
  lineHeight: 1.7,
};

const errorStyle = {
  marginTop: "24px",
  padding: "24px",
  borderRadius: "18px",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#991b1b",
  lineHeight: 1.8,
};

const bottomNoticeStyle = {
  margin: "24px 0 0",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.7,
};

const adClickSectionStyle = {
  marginTop: "44px",
  paddingTop: "36px",
  borderTop: "2px solid #e2e8f0",
};

const sectionHeadingRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap",
};

const sectionEyebrowStyle = {
  margin: "0 0 8px",
  color: "#b45309",
  fontSize: "14px",
  fontWeight: "900",
};

const adClickTitleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "clamp(28px, 5vw, 40px)",
  lineHeight: 1.2,
};

const csvButtonStyle = {
  display: "inline-block",
  padding: "13px 18px",
  borderRadius: "12px",
  background: "#166534",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "900",
  boxShadow:
    "0 8px 20px rgba(22, 101, 52, 0.18)",
};

const csvButtonDisabledStyle = {
  display: "inline-block",
  padding: "13px 18px",
  borderRadius: "12px",
  background: "#e2e8f0",
  color: "#64748b",
  fontWeight: "900",
};

const adMetricGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "16px",
};

const adEmptyStyle = {
  marginTop: "22px",
  padding: "34px 20px",
  borderRadius: "18px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#64748b",
  textAlign: "center",
  fontWeight: "800",
};

const panelHeadingStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "16px",
  marginTop: "28px",
};

const panelTitleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "23px",
  lineHeight: 1.4,
};

const panelDescriptionStyle = {
  margin: "7px 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.7,
};

const tablePanelStyle = {
  marginTop: "14px",
  borderRadius: "18px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  boxShadow:
    "0 10px 26px rgba(15, 23, 42, 0.05)",
  overflow: "hidden",
};

const tableScrollStyle = {
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  minWidth: "1080px",
  borderCollapse: "collapse",
  fontSize: "13px",
};

const tableHeaderStyle = {
  padding: "14px 15px",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#475569",
  textAlign: "left",
  whiteSpace: "nowrap",
  fontWeight: "900",
};

const tableCellStyle = {
  padding: "14px 15px",
  borderBottom: "1px solid #f1f5f9",
  color: "#334155",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};

const ipCellStyle = {
  ...tableCellStyle,
  color: "#0f172a",
  fontFamily: "ui-monospace, monospace",
  fontWeight: "800",
};

const dateCellStyle = {
  ...tableCellStyle,
  minWidth: "155px",
};

const keywordCellStyle = {
  ...tableCellStyle,
  minWidth: "150px",
  maxWidth: "250px",
  whiteSpace: "normal",
  lineHeight: 1.5,
};

const urlCellStyle = {
  ...tableCellStyle,
  minWidth: "210px",
  maxWidth: "300px",
  whiteSpace: "normal",
  wordBreak: "break-all",
};

const environmentCellStyle = {
  ...tableCellStyle,
  minWidth: "170px",
  whiteSpace: "normal",
  lineHeight: 1.5,
};

const tableLinkStyle = {
  color: "#1d4ed8",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
};

const riskBadgeStyle = {
  display: "inline-block",
  padding: "6px 9px",
  borderRadius: "999px",
  whiteSpace: "nowrap",
  fontSize: "12px",
  fontWeight: "900",
};

const adBottomNoticeStyle = {
  margin: "20px 0 0",
  padding: "16px 18px",
  borderRadius: "14px",
  background: "#f8fafc",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.7,
};
