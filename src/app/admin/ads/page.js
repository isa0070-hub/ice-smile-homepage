import { headers } from "next/headers";
import NaverAdsAnalysisCopyButton from "@/components/NaverAdsAnalysisCopyButton";
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

  const baseUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL
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

  const { total, branches } = data;

  const visibleDetails = data.details.filter(
    (row) =>
      row.adType === "keyword" ||
      row.adType === "place"
  );

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
              API 연결 정상
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <MetricCard
            title="총 광고비"
            value={won(total.cost)}
          />

          <MetricCard
            title="총 노출수"
            value={num(total.impressions)}
          />

          <MetricCard
            title="총 클릭수"
            value={num(total.clicks)}
          />

          <MetricCard
            title="평균 CPC"
            value={won(total.avgCpc)}
          />

          <MetricCard
            title="전환수"
            value={num(total.conversions)}
          />
        </div>

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
                      {row.branch === "seolleung"
                        ? "선릉점"
                        : "강변점"}
                    </td>

                    <td style={{ padding: 12 }}>
                      {row.adType === "keyword"
                        ? "키워드"
                        : "플레이스"}
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
