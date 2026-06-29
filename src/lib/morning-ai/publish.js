/**
 * ===========================================================
 * Project : Good Morning AI
 * -----------------------------------------------------------
 * 파일명 : publish.js
 *
 * 역할(Role)
 * 생성된 Morning Brief를 Supabase DB에 저장한다.
 *
 * 책임(Responsibility)
 * - gm_morning_notes 테이블에 저장
 * - 같은 날짜 브리핑이 있으면 업데이트
 * - 저장 결과 반환
 *
 * 절대 하지 말아야 할 일
 * - 외부 데이터 수집
 * - AI 분석 판단
 * - 브리핑 문장 생성
 * - 화면 출력
 *
 * 개발 원칙
 * 1. DB 저장은 publish.js에서만 담당한다.
 * 2. 기존 홈페이지 테이블은 절대 건드리지 않는다.
 * 3. gm_ prefix가 붙은 Good Morning AI 전용 테이블만 사용한다.
 * 4. 200줄을 넘기면 publish 폴더로 분리한다.
 *
 * 작성
 * 오광윤 + 똑순이
 * ===========================================================
 */

import { supabase } from "@/lib/supabase";
import { logInfo, logSuccess, logError } from "./logger";

export async function publishMorningBrief(briefing) {
  logInfo("💾 Morning Brief DB 저장 시작");

  const { data, error } = await supabase
    .from("gm_morning_notes")
    .upsert(briefing, { onConflict: "note_date" })
    .select()
    .single();

  if (error) {
    logError("Morning Brief DB 저장 실패", error);
    throw error;
  }

  logSuccess("Morning Brief DB 저장 완료");

  return {
    ok: true,
    message: "Morning Brief 저장 완료",
    note: data,
  };
}