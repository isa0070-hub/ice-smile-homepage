import { headers } from "next/headers";
import NaverAdsAnalysisCopyButton from "@/components/NaverAdsAnalysisCopyButton";
import NaverAdsCoreMetrics from "@/components/NaverAdsCoreMetrics";
import AdAttributionSummary from "@/components/AdAttributionSummary";
export const dynamic = "force-dynamic";

function won(value = 0) {
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function num(value = 0) {
  return Number(value).toLocaleString("ko-KR");
}

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

function branchLabel(branch) {
  if (branch === "seolleung") return "선릉점";
  if (branch === "gangbyeon") return "강변점";
  if (branch === "shared") return "공통 · 미지정";
  return "미분류";
}

function adTypeLabel(adType) {
  if (adType === "keyword") return "키워드";
  if (adType === "place") return "플레이스";
  return "미분류";
}

function MetricCard({ title, value }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 22,
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: "#6b7280",
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
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

function BranchTable({ title, data }) {
  const rows = [
    ["키워드 광고", data.keyword],
    ["플레이스 광고", data.place],
    ["지점 합계", data.total],
  ];

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "18px 20px",
          fontSize: 20,
          fontWeight: 800,
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {title}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 620,
          }}
        >
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {[
                "구분",
                "광고비",
                "노출",
                "클릭",
                "평균 CPC",
                "전환",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: 13,
                    fontSize: 13,
                    color: "#6b7280",
                    textAlign:
                      h === "구분" ? "left" : "right",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map(([label, row], index) => (
              <tr
                key={label}
                style={{
                  borderTop: "1px solid #f1f5f9",
                  fontWeight: index === 2 ? 800 : 500,
                  background:
                    index === 2 ? "#f9fafb" : "#fff",
                }}
              >
                <td style={{ padding: 14 }}>
                  {label}
                </td>

                <td
                  style={{
                    padding: 14,
                    textAlign: "right",
                  }}
                >
                  {won(row.cost)}
                </td>

                <td
                  style={{
                    padding: 14,
                    textAlign: "right",
                  }}
                >
                  {num(row.impressions)}
                </td>

                <td
                  style={{
                    padding: 14,
                    textAlign: "right",
                  }}
                >
                  {num(row.clicks)}
                </td>

                <td
                  style={{
                    padding: 14,
                    textAlign: "right",
                  }}
                >
                  {won(row.avgCpc)}
                </td>

                <td
                  style={{
                    padding: 14,
                    textAlign: "right",
                  }}
                >
                  {num(row.conversions)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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

  const {
    total,
    branches,
    unclassified,
    validation,
  } = data;

  const visibleDetails = data.details;

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

        <NaverAdsCoreMetrics
          since={data.since}
          until={data.until}
          total={total}
          branches={branches}
          unclassified={unclassified}
        />

        <AdAttributionSummary
          since={data.since}
          until={data.until}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(480px, 1fr))",
            gap: 18,
            marginBottom: 22,
          }}
        >
          <BranchTable
            title="선릉점"
            data={branches.seolleung}
          />

          <BranchTable
            title="강변점"
            data={branches.gangbyeon}
          />

          <BranchTable
            title="공통 · 미지정 지점"
            data={branches.shared}
          />
        </div>

        <div
          style={{
            marginBottom: 22,
            padding: 20,
            borderRadius: 16,
            background: unclassified.cost > 0
              ? "#fff7ed"
              : "#f8fafc",
            border: unclassified.cost > 0
              ? "1px solid #fdba74"
              : "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#111827",
              marginBottom: 6,
            }}
          >
            미분류 광고 (항상 표시)
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: 13,
              lineHeight: 1.6,
              marginBottom: 14,
            }}
          >
            지점 또는 광고 유형 규칙에 아직 연결되지 않은 실적입니다. 전체 합계에는 포함되며 숨기지 않습니다.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            <MetricCard title="광고비" value={won(unclassified.cost)} />
            <MetricCard title="노출" value={num(unclassified.impressions)} />
            <MetricCard title="클릭" value={num(unclassified.clicks)} />
            <MetricCard title="전환" value={num(unclassified.conversions)} />
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "18px 20px",
              fontSize: 20,
              fontWeight: 800,
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            광고그룹 상세
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 950,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f9fafb",
                  }}
                >
                  {[
                    "지점",
                    "종류",
                    "광고그룹",
                    "상태",
                    "광고비",
                    "노출",
                    "클릭",
                    "CPC",
                    "전환",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: 12,
                        fontSize: 13,
                        color: "#6b7280",
                        textAlign: [
                          "광고비",
                          "노출",
                          "클릭",
                          "CPC",
                          "전환",
                        ].includes(h)
                          ? "right"
                          : "left",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleDetails.map((row) => (
                  <tr
                    key={`${row.account}-${row.adgroupId}`}
                    style={{
                      borderTop:
                        "1px solid #f1f5f9",
                    }}
                  >
                    <td style={{ padding: 12 }}>
                      {branchLabel(row.branch)}
                    </td>

                    <td style={{ padding: 12 }}>
                      {adTypeLabel(row.adType)}
                    </td>

                    <td
                      style={{
                        padding: 12,
                        fontWeight: 600,
                      }}
                    >
                      {row.adgroupName}
                    </td>

                    <td style={{ padding: 12 }}>
                      {row.status === "ELIGIBLE"
                        ? "운영중"
                        : row.status === "PAUSED"
                        ? "중지"
                        : row.status}
                    </td>

                    <td
                      style={{
                        padding: 12,
                        textAlign: "right",
                      }}
                    >
                      {won(row.cost)}
                    </td>

                    <td
                      style={{
                        padding: 12,
                        textAlign: "right",
                      }}
                    >
                      {num(row.impressions)}
                    </td>

                    <td
                      style={{
                        padding: 12,
                        textAlign: "right",
                      }}
                    >
                      {num(row.clicks)}
                    </td>

                    <td
                      style={{
                        padding: 12,
                        textAlign: "right",
                      }}
                    >
                      {won(row.avgCpc)}
                    </td>

                    <td
                      style={{
                        padding: 12,
                        textAlign: "right",
                      }}
                    >
                      {num(row.conversions)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
