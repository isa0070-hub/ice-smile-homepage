"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  NAVER_AD_SCOPES,
  buildNaverAdScopeSummary,
} from "@/lib/naverAdsDashboard";
import {
  V2_CAMPAIGN_ID,
} from "@/lib/naverAdsReport";

function won(value = 0) {
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function num(value = 0) {
  return Number(value).toLocaleString("ko-KR");
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

function ScopeButton({
  active,
  children,
  onClick,
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: 10,
        border: active
          ? "1px solid #1e3a8a"
          : "1px solid #cbd5e1",
        background: active ? "#1e3a8a" : "#ffffff",
        color: active ? "#ffffff" : "#334155",
        fontWeight: 800,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function MetricCard({ title, value, sub }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 20,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#64748b",
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "#111827",
          fontSize: 25,
          fontWeight: 900,
        }}
      >
        {value}
      </div>

      {sub ? (
        <div
          style={{
            marginTop: 6,
            color: "#64748b",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
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
              ].map((heading) => (
                <th
                  key={heading}
                  style={{
                    padding: 13,
                    fontSize: 13,
                    color: "#6b7280",
                    textAlign:
                      heading === "구분"
                        ? "left"
                        : "right",
                  }}
                >
                  {heading}
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
                <td style={{ padding: 14 }}>{label}</td>
                <td style={{ padding: 14, textAlign: "right" }}>
                  {won(row.cost)}
                </td>
                <td style={{ padding: 14, textAlign: "right" }}>
                  {num(row.impressions)}
                </td>
                <td style={{ padding: 14, textAlign: "right" }}>
                  {num(row.clicks)}
                </td>
                <td style={{ padding: 14, textAlign: "right" }}>
                  {won(row.avgCpc)}
                </td>
                <td style={{ padding: 14, textAlign: "right" }}>
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

const BRANCHES = [
  ["seolleung", "선릉점"],
  ["gangbyeon", "강변점"],
  ["shared", "공통 · 미지정 지점"],
];

export default function NaverAdsScopeReport({
  details = [],
}) {
  const [scope, setScope] = useState(
    NAVER_AD_SCOPES.V2
  );

  const report = useMemo(
    () => buildNaverAdScopeSummary(details, scope),
    [details, scope]
  );

  const v2CampaignName =
    details.find(
      (row) => row.campaignId === V2_CAMPAIGN_ID
    )?.campaignName || "캠페인명 확인 불가";

  const scopeTitle =
    scope === NAVER_AD_SCOPES.V2
      ? `현재 V2 · ${v2CampaignName}`
      : scope === NAVER_AD_SCOPES.OTHER
      ? "기타 캠페인·계정"
      : "전체 캠페인·계정";

  const scopeDescription =
    scope === NAVER_AD_SCOPES.V2
      ? `캠페인 ID ${V2_CAMPAIGN_ID}와 정확히 일치하는 광고그룹만 표시합니다.`
      : scope === NAVER_AD_SCOPES.OTHER
      ? "현재 V2 캠페인을 제외한 캠페인과 별도 광고계정을 표시합니다."
      : "API 응답에 포함된 모든 캠페인과 광고계정을 표시합니다.";

  const visibleBranches = BRANCHES.filter(
    ([branch]) =>
      report.details.some(
        (row) =>
          row.branch === branch &&
          (row.adType === "keyword" ||
            row.adType === "place")
      )
  );

  const hasUnclassified = report.details.some(
    (row) =>
      row.adType !== "keyword" &&
      row.adType !== "place"
  );

  return (
    <section aria-labelledby="ad-scope-heading">
      <div
        style={{
          marginBottom: 18,
          padding: 20,
          background: "#ffffff",
          border: "1px solid #dbeafe",
          borderRadius: 16,
        }}
      >
        <h2
          id="ad-scope-heading"
          style={{
            margin: 0,
            color: "#111827",
            fontSize: 21,
          }}
        >
          광고 데이터 보기
        </h2>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 14,
          }}
        >
          <ScopeButton
            active={scope === NAVER_AD_SCOPES.V2}
            onClick={() => setScope(NAVER_AD_SCOPES.V2)}
          >
            현재 V2
          </ScopeButton>

          <ScopeButton
            active={scope === NAVER_AD_SCOPES.OTHER}
            onClick={() => setScope(NAVER_AD_SCOPES.OTHER)}
          >
            기타 캠페인·계정
          </ScopeButton>

          <ScopeButton
            active={scope === NAVER_AD_SCOPES.ALL}
            onClick={() => setScope(NAVER_AD_SCOPES.ALL)}
          >
            전체
          </ScopeButton>
        </div>

        <div
          aria-live="polite"
          style={{
            marginTop: 14,
            color: "#1e3a8a",
            fontWeight: 900,
          }}
        >
          {scopeTitle}
        </div>

        <div
          style={{
            marginTop: 5,
            color: "#64748b",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {scopeDescription} 기존 조회 결과를 재사용하므로 보기 전환 시 광고 API를 다시 호출하지 않습니다.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
          marginBottom: 22,
        }}
      >
        <MetricCard
          title="선택 범위 광고비"
          value={won(report.total.cost)}
        />
        <MetricCard
          title="노출"
          value={num(report.total.impressions)}
        />
        <MetricCard
          title="클릭"
          value={num(report.total.clicks)}
        />
        <MetricCard
          title="평균 CPC"
          value={won(report.total.avgCpc)}
          sub="선택 범위 총 광고비 ÷ 총 클릭"
        />
        <MetricCard
          title="네이버 전환"
          value={num(report.total.conversions)}
          sub="선택 범위 광고그룹 실적"
        />
      </div>

      {visibleBranches.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(480px, 1fr))",
            gap: 18,
            marginBottom: 22,
          }}
        >
          {visibleBranches.map(([branch, label]) => (
            <BranchTable
              key={branch}
              title={label}
              data={report.branches[branch]}
            />
          ))}
        </div>
      ) : null}

      {hasUnclassified ? (
        <div
          style={{
            marginBottom: 22,
            padding: 20,
            borderRadius: 16,
            background: "#fff7ed",
            border: "1px solid #fdba74",
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
            선택 범위 미분류 광고
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: 13,
              lineHeight: 1.6,
              marginBottom: 14,
            }}
          >
            지점 또는 광고 유형 규칙에 아직 연결되지 않은 실적입니다. 선택 범위 합계에는 포함됩니다.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            <MetricCard
              title="광고비"
              value={won(report.unclassified.cost)}
            />
            <MetricCard
              title="노출"
              value={num(report.unclassified.impressions)}
            />
            <MetricCard
              title="클릭"
              value={num(report.unclassified.clicks)}
            />
            <MetricCard
              title="전환"
              value={num(report.unclassified.conversions)}
            />
          </div>
        </div>
      ) : null}

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
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            광고그룹 상세
          </div>
          <div
            style={{
              marginTop: 5,
              color: "#64748b",
              fontSize: 13,
            }}
          >
            {scopeTitle} · {num(report.details.length)}개 그룹
          </div>
        </div>

        {report.details.length === 0 ? (
          <div
            style={{
              padding: 24,
              color: "#64748b",
              fontSize: 14,
            }}
          >
            선택 범위에 표시할 광고그룹이 없습니다.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 1160,
              }}
            >
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {[
                    "캠페인",
                    "지점",
                    "종류",
                    "광고그룹",
                    "상태",
                    "광고비",
                    "노출",
                    "클릭",
                    "CPC",
                    "전환",
                  ].map((heading) => (
                    <th
                      key={heading}
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
                        ].includes(heading)
                          ? "right"
                          : "left",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {report.details.map((row) => (
                  <tr
                    key={`${row.account}-${row.adgroupId}`}
                    style={{ borderTop: "1px solid #f1f5f9" }}
                  >
                    <td
                      style={{
                        padding: 12,
                        minWidth: 190,
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>
                        {row.campaignName || "캠페인명 없음"}
                      </div>
                      <div
                        style={{
                          marginTop: 3,
                          color: "#94a3b8",
                          fontSize: 11,
                        }}
                      >
                        {row.campaignId}
                      </div>
                    </td>
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
                    <td style={{ padding: 12, textAlign: "right" }}>
                      {won(row.cost)}
                    </td>
                    <td style={{ padding: 12, textAlign: "right" }}>
                      {num(row.impressions)}
                    </td>
                    <td style={{ padding: 12, textAlign: "right" }}>
                      {num(row.clicks)}
                    </td>
                    <td style={{ padding: 12, textAlign: "right" }}>
                      {won(row.avgCpc)}
                    </td>
                    <td style={{ padding: 12, textAlign: "right" }}>
                      {num(row.conversions)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
