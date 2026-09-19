"use client";

import { useState } from "react";

function number(value = 0) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function won(value = 0) {
  return `${number(value)}원`;
}

function percent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function cvr(stat = {}) {
  const clicks = Number(stat.clicks || 0);
  const conversions = Number(stat.conversions || 0);

  return clicks > 0
    ? (conversions / clicks) * 100
    : 0;
}

function cpa(stat = {}) {
  const cost = Number(stat.cost || 0);
  const conversions = Number(stat.conversions || 0);

  return conversions > 0
    ? Math.round(cost / conversions)
    : 0;
}

function statLine(label, stat = {}) {
  return [
    `${label}`,
    `광고비 ${won(stat.cost)}`,
    `노출 ${number(stat.impressions)}`,
    `클릭 ${number(stat.clicks)}`,
    `네이버 raw전환 ${number(stat.conversions)}`,
    `raw CVR ${percent(cvr(stat))}`,
    `raw CPA ${won(cpa(stat))}`,
    `평균 CPC ${won(stat.avgCpc)}`,
  ].join(" | ");
}

function reportSummary(title, report) {
  const s = report?.branches?.seolleung || {};
  const g = report?.branches?.gangbyeon || {};

  return `
[${title}]
기간: ${report.since} ~ ${report.until}

${statLine("전체", report.total)}

선릉점
${statLine("키워드", s.keyword)}
${statLine("플레이스", s.place)}
${statLine("선릉 합계", s.total)}

강변점
${statLine("키워드", g.keyword)}
${statLine("플레이스", g.place)}
${statLine("강변 합계", g.total)}
`.trim();
}

function groupDetail(report) {
  const rows = Array.isArray(report?.details)
    ? report.details
    : [];

  if (!rows.length) {
    return "광고그룹 상세 데이터 없음";
  }

  return rows
    .map((row) =>
      statLine(
        `${row.branch === "seolleung" ? "선릉점" : row.branch === "gangbyeon" ? "강변점" : "미분류"} / ${row.adType === "keyword" ? "키워드" : row.adType === "place" ? "플레이스" : "기타"} / ${row.adgroupName}`,
        row
      )
    )
    .join("\n");
}

function dailyDetail(report) {
  const rows = Array.isArray(report?.daily)
    ? report.daily
    : [];

  if (!rows.length) {
    return "일별 데이터 없음";
  }

  return rows
    .map((row) =>
      statLine(row.date, row.total)
    )
    .join("\n");
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  document.execCommand("copy");
  textarea.remove();
}

export default function NaverAdsAnalysisCopyButton() {
  const [status, setStatus] = useState("idle");

  async function handleCopy() {
    if (status === "loading") return;

    setStatus("loading");

    try {
      const periods = [
        ["어제", "yesterday"],
        ["최근 7일", "7d"],
        ["최근 30일", "30d"],
      ];

      const responses = await Promise.all(
        periods.map(async ([label, period]) => {
          const response = await fetch(
            `/api/naver-ads/report?period=${period}`,
            {
              cache: "no-store",
              credentials: "same-origin",
            }
          );

          if (!response.ok) {
            throw new Error(
              `${label} 광고 데이터 조회 실패 (${response.status})`
            );
          }

          const data = await response.json();

          if (!data.ok) {
            throw new Error(
              data.error || `${label} 데이터 조회 실패`
            );
          }

          return {
            label,
            period,
            data,
          };
        })
      );

      const yesterday =
        responses.find((item) => item.period === "yesterday")?.data;

      const seven =
        responses.find((item) => item.period === "7d")?.data;

      const thirty =
        responses.find((item) => item.period === "30d")?.data;

      const packet = `
[i smile again 네이버 광고 분석 패킷]

이 텍스트는 i smile again 네이버 광고 대시보드에서 자동 생성한 분석용 데이터다.
이 대화를 처음 보는 경우에도 아래 맥락을 그대로 사용해서 분석해줘.
사용자에게 이전 설명을 다시 요구하지 말고 바로 분석을 시작해줘.

==============================
1. 분석 목적
==============================

가장 중요한 목표는 광고 클릭수를 늘리는 것이 아니라
'광고 클릭 → 실제 문의 가능성이 높은 행동'으로 이어지는 비율을 높이는 것이다.

사용자는 클릭만 발생하면 광고비가 지출된 단계로 보고,
전화·네이버 톡톡·온라인 접수 등 실제 문의 행동이 발생해야
매출로 이어질 가능성이 생긴다고 본다.

따라서 다음 지표를 중요하게 본다.

- 클릭수
- 유효 전환수
- 유효 전환율(CVR)
- 유효 전환당 비용(CPA)
- 광고그룹별 차이
- 최근 7일 변화
- 최근 30일 추세

==============================
2. 사업/광고 구조
==============================

브랜드: i smile again 아이스마일어게인

주요 분석 지점:
- 선릉점
- 강변점

광고 종류:
- 네이버 키워드 광고
- 네이버 플레이스 광고

네이버 광고계정은 2개지만 이 분석에서는 하나의 통합 광고 데이터로 본다.

네이버 톡톡:
- 홈페이지의 대표 네이버 톡톡은 강변 대표 톡톡 하나로 운영한다.
- 분석에서는 '네이버 톡톡'을 공통 문의 채널로 본다.
- 톡톡을 선릉/강변에 억지로 배분하지 않는다.

==============================
3. 매우 중요한 전환 주의사항
==============================

현재 아래 데이터의 'conversions'는
네이버 /stats API의 ccnt 값이다.

따라서 이것을 곧바로
'실제 고객 문의수' 또는 '실제 매출 전환수'라고 판단하면 안 된다.

현재 홈페이지의 네이버 전환 이벤트에는 다음 종류가 존재한다.

- custom001: 강변점 전화 클릭
- custom002: 선릉점 전화 클릭
- custom003: 신도림점 전화 클릭
- custom005: 네이버 톡톡 클릭
- custom006: 온라인 문의 페이지 클릭
- custom007: 전화번호 목록 열기
- lead: 실제 온라인 접수 저장 완료

한 사용자가 보조전환과 실제 문의성 전환을 여러 번 발생시킬 수도 있다.

그러므로 아래 표의 CVR/CPA는 아직 'raw CVR / raw CPA'다.
유효전환 상세 분리가 완료되기 전에는 절대 실제 문의율로 단정하지 말 것.

향후 핵심 유효전환은 주로:
- 실제 전화 클릭
- 네이버 톡톡 클릭
- 온라인 접수 완료
로 정의한다.

전화목록 열기와 온라인문의 페이지 진입은 보조전환으로 본다.

==============================
4. 광고 데이터
==============================

${reportSummary("어제", yesterday)}

------------------------------

${reportSummary("최근 7일", seven)}

------------------------------

${reportSummary("최근 30일", thirty)}

==============================
5. 최근 7일 일별 추이
==============================

${dailyDetail(seven)}

==============================
6. 최근 7일 광고그룹 상세
==============================

${groupDetail(seven)}

==============================
7. 최근 30일 광고그룹 상세
==============================

${groupDetail(thirty)}

==============================
8. 분석 방법
==============================

단순히 숫자를 읽어주지 말고 다음 순서로 진단해줘.

1) 광고비는 많이 쓰는데 클릭 대비 전환이 약한 광고그룹을 찾는다.
2) 적은 비용/클릭으로 상대적으로 전환이 잘 발생하는 광고그룹도 찾는다.
3) 하루의 우연이 아닌지 7일과 30일을 함께 비교한다.
4) 문제가 광고 자체인지, 검색 의도인지, 랜딩페이지/홈페이지인지, 문의 동선인지 구분해서 원인 후보를 제시한다.
5) 데이터만으로 확정할 수 없는 원인은 '가능성'이라고 명확히 표시한다.
6) 한 번에 너무 많은 것을 바꾸지 않는다.
7) 가장 효과가 클 가능성이 높은 수정 1~3개만 우선순위로 제시한다.
8) 가능하면 한 번에 한 가지 실험을 추천한다.
9) 수정 후 7일 뒤 무엇을 비교해야 하는지 수치 기준을 제시한다.
10) 잘되는 광고의 성공 패턴도 찾아서 다른 광고/랜딩페이지에 적용할 수 있는지 제안한다.

==============================
9. 답변 형식
==============================

복잡한 보고서 대신 아래처럼 간결하게 답해줘.

[현재 상태]
핵심 상황 2~4줄

[가장 먼저 볼 문제]
1순위 문제와 근거

[잘되고 있는 부분]
유지하거나 확대할 후보

[이번에 할 일]
최대 3개

[이번 주 실험]
한 가지

[7일 후 확인]
CVR / CPA / 클릭 / 유효전환 중 무엇을 비교할지

[추가 데이터가 필요한 경우]
정말 필요한 데이터만 말해줘.

이 분석의 목적은 데이터를 많이 설명하는 것이 아니라
i smile again의 광고 클릭 대비 실제 문의 가능성을 높이는 것이다.
`.trim();

      await copyText(packet);

      setStatus("done");

      window.setTimeout(() => {
        setStatus("idle");
      }, 1800);
    } catch (error) {
      console.error(error);
      setStatus("error");

      window.setTimeout(() => {
        setStatus("idle");
      }, 2500);
    }
  }

  const label =
    status === "loading"
      ? "분석 데이터 준비 중..."
      : status === "done"
      ? "✓ 분석용 데이터 복사 완료"
      : status === "error"
      ? "복사 실패 · 다시 시도"
      : "✨ 똑순이 분석용 복사";

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={status === "loading"}
      style={{
        border: 0,
        borderRadius: 10,
        padding: "11px 17px",
        background:
          status === "done"
            ? "#047857"
            : "#111827",
        color: "#ffffff",
        fontSize: 14,
        fontWeight: 800,
        cursor:
          status === "loading"
            ? "wait"
            : "pointer",
      }}
    >
      {label}
    </button>
  );
}
