/**
 * ===========================================================
 * Project : Good Morning AI
 * -----------------------------------------------------------
 * 파일명 : generate.js
 *
 * 역할
 * 분석 결과를 DB 및 화면 출력용 브리핑 구조로 변환한다.
 *
 * 주의
 * - 외부 데이터 수집 금지
 * - AI 판단 금지
 * - DB 저장 금지
 * ===========================================================
 */

import { logInfo, logSuccess } from "./logger";
import { getKoreaDateString } from "./time";

export async function generateMorningBrief(analyzedData) {
  logInfo("📝 Morning Brief 생성 시작");

  const today = getKoreaDateString();

  const briefing = {
    note_date: today,

    title: `${today} AI Morning Brief`,

    summary:
      analyzedData.aiOneLine ||
      "오늘의 주요 흐름을 분석하고 있습니다.",

    ai_one_line:
      analyzedData.aiOneLine ||
      "오늘의 주요 흐름을 함께 확인해 보세요.",

    ai_direction:
      analyzedData.aiDirection ||
      "관망",

    ai_confidence_score:
      Number(analyzedData.aiConfidenceScore) || 0,

    ai_market_mood:
      analyzedData.aiMarketMood ||
      "⚪ 확인 중",

    impact_top5: Array.isArray(analyzedData.impactTop5)
      ? analyzedData.impactTop5
      : [],

    ai_connection_flow:
      analyzedData.connectionFlow || "",

    ai_reasoning_summary:
      analyzedData.connectionFlow || "",

    exchange_market_analysis:
      analyzedData.exchangeMarketAnalysis || "",

    weather_summary:
      analyzedData.weatherSummary ||
      "날씨 데이터가 아직 연결되지 않았습니다.",

    news_summary:
      analyzedData.newsSummary ||
      "뉴스 데이터가 아직 연결되지 않았습니다.",

    market_summary:
      analyzedData.exchangeMarketAnalysis ||
      "시장 데이터가 아직 연결되지 않았습니다.",

    tech_summary:
      analyzedData.techSummary ||
      "AI·IT·기술 데이터가 아직 연결되지 않았습니다.",

    business_point:
      analyzedData.businessPoint ||
      "하나의 정보보다 여러 흐름을 연결해서 판단하는 것이 좋습니다.",

    blog_keywords:
      analyzedData.blogKeywords ||
      "AI 브리핑, 오늘의 흐름, 시장 인사이트",

    uncertainty_note:
      analyzedData.uncertaintyNote ||
      "현재 확인되지 않은 데이터가 포함될 수 있습니다.",

    detailed_analysis: [
      analyzedData.connectionFlow,
      analyzedData.exchangeMarketAnalysis,
      analyzedData.uncertaintyNote,
    ]
      .filter(Boolean)
      .join("\n\n"),

    content:
      analyzedData.content ||
      "Good Morning AI가 생성한 브리핑입니다.",

    is_published: true,
  };

  logSuccess("Morning Brief 생성 완료");

  return briefing;
}