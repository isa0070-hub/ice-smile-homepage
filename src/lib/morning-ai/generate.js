/**
 * ===========================================================
 * Project : Good Morning AI
 * -----------------------------------------------------------
 * 파일명 : generate.js
 *
 * 역할(Role)
 * 분석 결과를 최종 브리핑 데이터로 생성한다.
 *
 * 책임(Responsibility)
 * - DB 저장용 데이터 구조 생성
 * - 화면 출력에 맞는 문장 정리
 * - 날짜, 제목, 요약, 상세 분석 구성
 *
 * 절대 하지 말아야 할 일
 * - 외부 데이터 직접 수집
 * - AI 분석 판단
 * - DB 저장
 *
 * 개발 원칙
 * 1. 분석은 analyze.js에서만 한다.
 * 2. generate.js는 보여줄 형태로 정리만 한다.
 * 3. 화면과 DB 구조가 바뀌면 이 파일에서 조정한다.
 * 4. 200줄을 넘기면 generate 폴더로 분리한다.
 *
 * 작성
 * 오광윤 + 똑순이
 * ===========================================================
 */

import { logInfo, logSuccess } from "./logger";

export async function generateMorningBrief(analyzedData) {
  logInfo("📝 Morning Brief 생성 시작");

  const today = new Date().toISOString().slice(0, 10);

  const briefing = {
    note_date: today,
    title: "AI Morning Brief",

    summary: analyzedData.aiOneLine,

    ai_one_line: analyzedData.aiOneLine,
    ai_direction: analyzedData.aiDirection,
    ai_confidence_score: analyzedData.aiConfidenceScore,
    ai_market_mood: analyzedData.aiMarketMood,

    impact_top5: analyzedData.impactTop5,

    ai_connection_flow: analyzedData.connectionFlow,
    ai_reasoning_summary: analyzedData.connectionFlow,

    exchange_market_analysis: analyzedData.exchangeMarketAnalysis,

    weather_summary:
      "오늘 날씨는 실제 날씨 API 연결 전까지 테스트 데이터로 표시됩니다.",

    news_summary:
      "밤사이 주요 뉴스는 실제 뉴스 API 연결 전까지 테스트 데이터로 표시됩니다.",

    market_summary:
      analyzedData.exchangeMarketAnalysis,

    tech_summary:
      "AI·IT·기술 뉴스는 이후 데이터 수집 단계에서 연결할 예정입니다.",

    business_point:
      "오늘은 하나의 정보만 보지 말고 여러 지표를 함께 보며 판단하는 것이 좋습니다.",

    blog_keywords:
      "AI 브리핑, 오늘의 흐름, 시장 인사이트",

    uncertainty_note: analyzedData.uncertaintyNote,

    detailed_analysis:
      `${analyzedData.connectionFlow}\n\n${analyzedData.exchangeMarketAnalysis}\n\n${analyzedData.uncertaintyNote}`,

    content:
      "Good Morning AI가 생성한 테스트용 브리핑입니다.",

    is_published: true,
  };

  logSuccess("Morning Brief 생성 완료");

  return briefing;
}