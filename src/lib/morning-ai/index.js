/**
 * ===========================================================
 * Project : Good Morning AI
 * -----------------------------------------------------------
 * 파일명 : index.js
 *
 * 역할(Role)
 * Morning AI Engine의 시작점
 *
 * 책임(Responsibility)
 * - 데이터 수집 호출
 * - AI 분석 호출
 * - 브리핑 생성 호출
 * - DB 저장 호출
 *
 * 절대 하지 말아야 할 일
 * - AI 분석 로직 작성
 * - DB 직접 접근
 * - 프롬프트 작성
 * - 데이터 가공
 *
 * 개발 원칙
 * 1. 하나의 파일은 하나의 책임만 가진다.
 * 2. 파일이 200줄 이상 커지면 분리한다.
 * 3. 유지보수하기 쉬운 구조를 우선한다.
 * 4. 기존 홈페이지 기능과 완전히 분리한다.
 * 5. AI는 '정답'보다 '근거 있는 추론'을 제공한다.
 *
 * 작성
 * 오광윤 + 똑순이
 * ===========================================================
 */

import { collectMorningData } from "./collect";
import { analyzeMorningData } from "./analyze";
import { generateMorningBrief } from "./generate";
import { publishMorningBrief } from "./publish";
import { logInfo, logSuccess, logError } from "./logger";

export async function runMorningAI() {
  try {
    logInfo("🌅 Morning AI 시작");

    const collectedData = await collectMorningData();
    const analyzedData = await analyzeMorningData(collectedData);
    const briefing = await generateMorningBrief(analyzedData);
    const result = await publishMorningBrief(briefing);

    logSuccess("Morning AI 완료");

    return result;
  } catch (error) {
    logError("Morning AI 실행 중 오류 발생", error);
    throw error;
  }
}