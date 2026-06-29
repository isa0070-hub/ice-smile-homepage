/**
 * ===========================================================
 * Project : Good Morning AI
 * -----------------------------------------------------------
 * 파일명 : analyze.js
 *
 * 역할(Role)
 * 수집된 데이터를 분석하고, 오늘의 핵심 흐름을 판단한다.
 *
 * 책임(Responsibility)
 * - 수집 데이터 해석
 * - 중요도 판단
 * - 연결 흐름 구성
 * - 불확실성 표시
 *
 * 절대 하지 말아야 할 일
 * - 외부 데이터 직접 수집
 * - DB 저장
 * - 화면 출력
 *
 * 개발 원칙
 * 1. 빠른 결론보다 정확한 추론을 우선한다.
 * 2. 불확실하면 불확실하다고 표시한다.
 * 3. 단일 뉴스가 아니라 여러 정보를 연결해서 판단한다.
 * 4. 분석 로직이 200줄을 넘기면 analyze 폴더로 분리한다.
 *
 * 작성
 * 오광윤 + 똑순이
 * ===========================================================
 */

import { logInfo, logSuccess } from "./logger";

export async function analyzeMorningData(collectedData) {
  logInfo("🧠 Morning AI 분석 시작");

  const analyzedData = {
    analyzedAt: new Date().toISOString(),
    source: collectedData,

    aiOneLine:
      "오늘은 단일 뉴스보다 환율, 증시, 유가 흐름을 함께 보며 전체 분위기를 판단하는 것이 좋아 보입니다.",

    aiDirection: "관망",

    aiConfidenceScore: 83,

    aiMarketMood: "🟡 보통",

    impactTop5: [
      {
        title: "환율",
        score: 93,
        reason: "국내 증시와 물가 흐름에 동시에 영향을 줄 수 있는 핵심 변수입니다.",
      },
      {
        title: "미국증시",
        score: 88,
        reason: "밤사이 투자심리가 국내 시장에도 이어질 가능성이 있습니다.",
      },
      {
        title: "국내증시",
        score: 84,
        reason: "외국인 수급과 환율 움직임을 함께 확인해야 합니다.",
      },
      {
        title: "국제유가",
        score: 76,
        reason: "물가와 운송비 부담에 영향을 줄 수 있습니다.",
      },
      {
        title: "날씨",
        score: 63,
        reason: "외부 활동과 이동 흐름에 참고할 변수입니다.",
      },
    ],

    connectionFlow:
      "미국증시 흐름 → 달러 움직임 → 원달러 환율 → 외국인 수급 → 국내증시 분위기 → 소비심리 순서로 연결해서 보는 것이 좋습니다.",

    exchangeMarketAnalysis:
      "환율 상승은 국내 증시에 부담 요인이 될 수 있습니다. 특히 외국인 수급이 약해질 경우 코스피와 코스닥 모두 조심스러운 흐름이 나올 수 있습니다. 다만 변동폭이 크지 않다면 단기적으로는 관망 심리가 더 강할 가능성이 있습니다.",

    uncertaintyNote:
      "현재는 실제 데이터가 연결되기 전 테스트 분석입니다. 실제 뉴스, 환율, 증시 데이터가 연결되면 판단 근거와 신뢰도가 더 정확해집니다.",
  };

  logSuccess("Morning AI 분석 완료");

  return analyzedData;
}