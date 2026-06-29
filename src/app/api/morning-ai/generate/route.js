/**
 * ===========================================================
 * Project : Good Morning AI
 * -----------------------------------------------------------
 * 파일명 : route.js
 *
 * 역할(Role)
 * Morning AI 생성 API
 *
 * 책임(Responsibility)
 * - 관리자 페이지 또는 자동 스케줄러에서 호출
 * - runMorningAI 엔진 실행
 * - 실행 결과 반환
 *
 * 절대 하지 말아야 할 일
 * - AI 분석 로직 직접 작성
 * - DB 저장 로직 직접 작성
 * - 화면 출력 로직 작성
 *
 * 작성
 * 오광윤 + 똑순이
 * ===========================================================
 */

import { NextResponse } from "next/server";
import { runMorningAI } from "@/lib/morning-ai";

export async function POST() {
  try {
    const result = await runMorningAI();

    return NextResponse.json({
      ok: true,
      message: "Morning AI 브리핑 생성 완료",
      result,
    });
  } catch (error) {
    console.error("Morning AI API Error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Morning AI 브리핑 생성 중 오류가 발생했습니다.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}