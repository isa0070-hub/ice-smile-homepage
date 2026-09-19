"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  conversionMetrics,
  getConversionRange,
} from "@/lib/naverConversionClient";

function won(value = 0) {
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function num(value = 0) {
  return Number(value).toLocaleString("ko-KR");
}

function Metric({
  label,
  value,
  sub,
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 22,
        minWidth: 0,
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: 14,
          marginBottom: 9,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#111827",
          fontSize: 27,
          fontWeight: 900,
        }}
      >
        {value}
      </div>

      {sub ? (
        <div
          style={{
            marginTop: 7,
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

export default function NaverAdsCoreMetrics({
  since,
  until,
  total,
  branches,
}) {
  const [conversion, setConversion] =
    useState(null);

  const [progress, setProgress] =
    useState("");

  const [error, setError] =
    useState("");

  const keywordTotals =
    useMemo(() => {
      const seolleung =
        branches?.seolleung?.keyword || {};

      const gangbyeon =
        branches?.gangbyeon?.keyword || {};

      return {
        impressions:
          Number(seolleung.impressions || 0) +
          Number(gangbyeon.impressions || 0),

        clicks:
          Number(seolleung.clicks || 0) +
          Number(gangbyeon.clicks || 0),

        cost:
          Number(seolleung.cost || 0) +
          Number(gangbyeon.cost || 0),
      };
    }, [branches]);

  const placeTotals =
    useMemo(() => {
      const seolleung =
        branches?.seolleung?.place || {};

      const gangbyeon =
        branches?.gangbyeon?.place || {};

      return {
        impressions:
          Number(seolleung.impressions || 0) +
          Number(gangbyeon.impressions || 0),

        clicks:
          Number(seolleung.clicks || 0) +
          Number(gangbyeon.clicks || 0),

        cost:
          Number(seolleung.cost || 0) +
          Number(gangbyeon.cost || 0),
      };
    }, [branches]);

  useEffect(() => {
    let active = true;

    setConversion(null);
    setError("");
    setProgress("");

    getConversionRange(
      since,
      until,
      (done, all) => {
        if (active) {
          setProgress(`${done}/${all}`);
        }
      }
    )
      .then((result) => {
        if (!active) return;

        setConversion(result);
        setProgress("");
      })
      .catch((err) => {
        if (!active) return;

        setError(
          err?.message ||
            "문의 데이터를 불러오지 못했습니다."
        );

        setProgress("");
      });

    return () => {
      active = false;
    };
  }, [since, until]);

  const metrics =
    conversion
      ? conversionMetrics(
          conversion,
          keywordTotals.clicks,
          keywordTotals.cost
        )
      : null;

  const inquirySub =
    conversion
      ? `전화 ${num(
          conversion.phoneTotal
        )} · 톡톡 ${num(
          conversion.naverTalk
        )} · 온라인접수 ${num(
          conversion.onlineInquiry
        )}`
      : progress
      ? `문의 데이터 집계 중 ${progress}`
      : error
      ? "문의 데이터 확인 필요"
      : "문의 데이터 준비 중";

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 10,
        }}
      >
        <Metric
          label="키워드 광고비"
          value={won(keywordTotals.cost)}
        />

        <Metric
          label="키워드 클릭"
          value={`${num(keywordTotals.clicks)}회`}
        />

        <Metric
          label="문의행동"
          value={
            metrics
              ? `${num(
                  metrics.inquiryActions
                )}건`
              : "..."
          }
          sub={inquirySub}
        />

        <Metric
          label="문의전환율"
          value={
            metrics
              ? `${metrics.inquiryCvr.toFixed(
                  1
                )}%`
              : "..."
          }
        />

        <Metric
          label="문의당 비용"
          value={
            metrics
              ? won(metrics.inquiryCpa)
              : "..."
          }
        />
      </div>

      <div
        style={{
          marginBottom: 22,
          color: "#64748b",
          fontSize: 12,
          lineHeight: 1.7,
        }}
      >
        <div>
          문의행동은 전화 · 네이버 톡톡 · 온라인접수 완료를 기준으로 집계합니다.
        </div>

        <div
          style={{
            marginTop: 5,
            color: "#475569",
            fontWeight: 700,
          }}
        >
          플레이스 광고 · {won(placeTotals.cost)} · {num(placeTotals.clicks)}클릭
        </div>
      </div>
    </>
  );
}
