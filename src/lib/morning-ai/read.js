/**
 * ===========================================================
 * Good Morning AI
 * read.js
 *
 * 역할
 * - 저장된 Morning Brief 조회
 * - 최신 공개 브리핑 반환
 *
 * 주의
 * - gm_ 전용 테이블만 사용
 * - 기존 홈페이지 테이블 접근 금지
 * ===========================================================
 */

import { supabase } from "@/lib/supabase";
import { logInfo, logSuccess, logError } from "./logger";

export async function getLatestMorningBrief() {
  logInfo("📖 최신 Morning Brief 조회 시작");

  const { data, error } = await supabase
    .from("gm_morning_notes")
    .select("*")
    .eq("is_published", true)
    .order("note_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logError("최신 Morning Brief 조회 실패", error);
    throw error;
  }

  if (!data) {
    logInfo("저장된 Morning Brief가 없습니다.");
    return null;
  }

  logSuccess("최신 Morning Brief 조회 완료");

  return data;
}