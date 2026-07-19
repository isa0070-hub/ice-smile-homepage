import Link from "next/link";
import { getSearchTrafficSummary } from "@/lib/ga4Analytics";

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

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
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

        <section style={metricGridStyle}>
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