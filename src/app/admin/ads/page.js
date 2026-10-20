import { headers } from "next/headers";
import NaverAdsAnalysisCopyButton from "@/components/NaverAdsAnalysisCopyButton";
import AdAttributionSummary from "@/components/AdAttributionSummary";
import NaverAdsScopeReport from "@/components/NaverAdsScopeReport";
export const dynamic = "force-dynamic";

function periodLabel(period) {
  if (period === "7d") return "최근 7일";
  if (period === "30d") return "최근 30일";
  return "어제";
}

function kstTimestamp(value) {
  if (!value) return "확인 불가";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function PeriodButton({ href, active, children }) {
  return (
    <a
      href={href}
      style={{
        display: "inline-block",
        padding: "10px 18px",
        borderRadius: 10,
        textDecoration: "none",
        fontWeight: 700,
        fontSize: 14,
        background: active ? "#111827" : "#fff",
        color: active ? "#fff" : "#374151",
        border: active
          ? "1px solid #111827"
          : "1px solid #d1d5db",
      }}
    >
      {children}
    </a>
  );
}

export default async function AdsDashboard({
  searchParams,
}) {
  const params = await searchParams;

  const allowed = ["yesterday", "7d", "30d"];

  const period = allowed.includes(params?.period)
    ? params.period
    : "yesterday";

  const previewHost =
    process.env.VERCEL_ENV === "preview"
      ? process.env.VERCEL_URL
      : null;

  const baseUrl = previewHost
    ? `https://${previewHost}`
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://www.ismileagain.co.kr";

  let data;
  let error;

  try {
    const incomingHeaders = await headers();
    const cookieHeader = incomingHeaders.get("cookie") || "";

    const response = await fetch(
      `${baseUrl}/api/naver-ads/report?period=${period}`,
      {
        cache: "no-store",
        headers: {
          cookie: cookieHeader,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `광고 API 오류 ${response.status}`
      );
    }

    data = await response.json();

    if (!data.ok) {
      throw new Error(
        data.error || "광고 데이터 조회 실패"
      );
    }
  } catch (e) {
    error = e.message;
  }

  if (error || !data) {
    return (
      <main style={{ padding: 30 }}>
        <h1>네이버 광고 현황</h1>
        <p style={{ color: "#dc2626" }}>
          데이터를 불러오지 못했습니다.
          <br />
          {error}
        </p>
      </main>
    );
  }

  const { validation } = data;

  const scopeDetails = data.details.map((row) => ({
    account: row.account,
    branch: row.branch,
    adType: row.adType,
    campaignId: row.campaignId,
    campaignName: row.campaignName,
    adgroupId: row.adgroupId,
    adgroupName: row.adgroupName,
    status: row.status,
    impressions: row.impressions,
    clicks: row.clicks,
    cost: row.cost,
    conversions: row.conversions,
    avgCpc: row.avgCpc,
  }));

  return (
    <main
      style={{
        padding: 28,
        background: "#f5f6f8",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 20,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 30,
                color: "#111827",
              }}
            >
              네이버 광고 현황
            </h1>

            <div
              style={{
                marginTop: 8,
                color: "#6b7280",
              }}
            >
              {data.since === data.until
                ? data.since
                : `${data.since} ~ ${data.until}`}
              {" · "}
              {periodLabel(period)}
            </div>

            <div
              style={{
                marginTop: 5,
                color: "#475569",
                fontSize: 13,
              }}
            >
              데이터 기준일 {data.until} (KST) · API 조회 {kstTimestamp(data.generatedAt)} KST
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <a
              href="/admin"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "9px 14px",
                borderRadius: 10,
                background: "#1e3a8a",
                color: "#ffffff",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              ← 관리자 대시보드
            </a>

            <div
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: "#ecfdf5",
                color: "#047857",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {validation?.passed
                ? "API 연결 · 합계 검증 정상"
                : "API 연결 정상 · 합계 확인 필요"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 22,
            flexWrap: "wrap",
          }}
        >
          <PeriodButton
            href="/admin/ads"
            active={period === "yesterday"}
          >
            어제
          </PeriodButton>

          <PeriodButton
            href="/admin/ads?period=7d"
            active={period === "7d"}
          >
            최근 7일
          </PeriodButton>

          <PeriodButton
            href="/admin/ads?period=30d"
            active={period === "30d"}
          >
            최근 30일
          </PeriodButton>
        </div>

        <div
          style={{
            marginBottom: 22,
          }}
        >
          <NaverAdsAnalysisCopyButton />
        </div>

        <AdAttributionSummary
          since={data.since}
          until={data.until}
        />

        <NaverAdsScopeReport
          details={scopeDetails}
        />
      </div>
    </main>
  );
}
