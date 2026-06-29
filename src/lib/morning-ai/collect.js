/**
 * ===========================================================
 * Good Morning AI
 * collect.js
 *
 * 역할
 * -------------------------
 * 모든 외부 데이터를 수집한다.
 *
 * 아직 AI 분석은 하지 않는다.
 *
 * 수집 대상
 * - 날씨
 * - 환율
 * - 국내증시
 * - 미국증시
 * - 국제유가
 * - 금
 * - 비트코인
 * - AI뉴스
 * - IT뉴스
 * - 애플뉴스
 * - 경제일정
 *
 * 작성
 * 오광윤 + 똑순이
 * ===========================================================
 */

export async function collectMorningData() {
    console.log("📥 Morning Data Collect 시작");
  
    const collectedData = {
      collectedAt: new Date().toISOString(),
  
      weather: null,
  
      exchange: null,
  
      usMarket: null,
  
      koreaMarket: null,
  
      oil: null,
  
      gold: null,
  
      bitcoin: null,
  
      aiNews: [],
  
      appleNews: [],
  
      itNews: [],
  
      economyNews: [],
  
      schedule: [],
    };
  
    console.log("✅ Morning Data Collect 완료");
  
    return collectedData;
  }