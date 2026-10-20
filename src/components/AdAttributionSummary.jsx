"use client";

import {
  useEffect,
  useState,
} from "react";

function num(value = 0) {
  return Number(value || 0)
    .toLocaleString("ko-KR");
}

export default function AdAttributionSummary({
  since,
  until,
}) {
  const rangeKey = `${since}:${until}`;

  const [result, setResult] = useState({
    rangeKey: "",
    data: null,
    error: "",
  });

  useEffect(() => {
    let active = true;

    fetch(
      `/api/admin/ad-attribution?since=${encodeURIComponent(
        since
      )}&until=${encodeURIComponent(
        until
      )}`,
      {
        cache: "no-store",
        credentials: "same-origin",
      }
    )
      .then(async (response) => {
        const result =
          await response.json();

        if (
          !response.ok ||
          result?.success === false
        ) {
          throw new Error(
            result?.message ||
              "조회 실패"
          );
        }

        return result;
      })
      .then((result) => {
        if (!active) return;

        setResult({
          rangeKey,
          data:
            result?.data ||
            result,
          error: "",
        });
      })
      .catch((e) => {
        if (!active) return;

        setResult({
          rangeKey,
          data: null,
          error:
            e?.message ||
            "조회 실패",
        });
      });

    return () => {
      active = false;
    };
  }, [since, until, rangeKey]);

  const current =
    result.rangeKey === rangeKey
      ? result
      : {
          data: null,
          error: "",
        };

  const { data, error } = current;

  if (error) {
    return null;
  }

  if (!data) {
    return (
      <div
        style={{
          marginBottom: 22,
          fontSize: 13,
          color: "#64748b",
        }}
      >
        홈페이지 광고 문의행동을 확인하는 중...
      </div>
    );
  }

  const summary =
    data.summary || {};

  return (
    <section
      style={{
        marginBottom: 22,
        padding: "18px 20px",
        background: "#ffffff",
        border:
          "1px solid #e5e7eb",
        borderRadius: 16,
      }}
    >
      <div
        style={{
          fontWeight: 900,
          fontSize: 17,
          color: "#111827",
          marginBottom: 12,
        }}
      >
        홈페이지 실측 문의행동 · 전체 캠페인
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 20px",
          color: "#334155",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        <span>
          📞 전화 {num(summary.phone)}건
        </span>

        <span>
          💬 톡톡 {num(summary.naverTalk)}건
        </span>

        <span>
          📝 온라인접수 {num(summary.onlineInquiry)}건
        </span>

        <span>
          문의행동 총 {num(summary.inquiryActions)}건
        </span>
      </div>

      <div
        style={{
          marginTop: 8,
          color: "#64748b",
          fontSize: 12,
        }}
      >
        광고그룹 보기 필터와 무관하게 전체 홈페이지 광고 유입에서 실제 발생한 행동만 집계 · 배포 이후 데이터부터 누적
      </div>

      {data.keywords?.length > 0 ? (
        <details
          style={{
            marginTop: 14,
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              color: "#1e3a8a",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            문의가 발생한 키워드 상세보기
          </summary>

          <div
            style={{
              marginTop: 10,
              display: "grid",
              gap: 7,
            }}
          >
            {data.keywords
              .slice(0, 10)
              .map((item) => (
                <div
                  key={`${item.adgroupId}-${item.keywordId}-${item.keyword}`}
                  style={{
                    padding: "8px 10px",
                    background:
                      "#f8fafc",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#475569",
                  }}
                >
                  <strong>
                    {item.keyword}
                  </strong>
                  {" · "}
                  전화 {num(item.phone)}
                  {" · "}
                  톡톡 {num(item.naverTalk)}
                  {" · "}
                  접수 {num(item.onlineInquiry)}
                </div>
              ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
