/**
 * ===========================================================
 * Good Morning AI
 * /api/morning-ai/ask
 *
 * 역할
 * - 일반 사용자의 질문 수신
 * - 최신 Morning Brief 조회
 * - 질문 기준 개인화 결과 반환
 *
 * 관리자 생성 API와 완전히 분리한다.
 * ===========================================================
 */

import { NextResponse } from "next/server";
import { getLatestMorningBrief } from "@/lib/morning-ai/read";
import { personalizeMorningBrief } from "@/lib/morning-ai/personalize";
import { logInfo, logSuccess, logError } from "@/lib/morning-ai/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const question = String(body?.question || "").trim();

    if (!question) {
      return NextResponse.json(
        {
          ok: false,
          message: "질문을 입력해 주세요.",
        },
        { status: 400 }
      );
    }

    if (question.length > 300) {
      return NextResponse.json(
        {
          ok: false,
          message: "질문은 300자 이내로 입력해 주세요.",
        },
        { status: 400 }
      );
    }

    logInfo(`🙋 사용자 질문 분석 시작: ${question}`);

    const latestBrief = await getLatestMorningBrief();

    const result = personalizeMorningBrief(
      question,
      latestBrief
    );

    logSuccess("사용자 질문 분석 완료");

    return NextResponse.json({
      ok: true,
      message: "Morning AI 질문 분석 완료",
      result,
    });
  } catch (error) {
    logError("Morning AI 질문 API 오류", error);

    return NextResponse.json(
      {
        ok: false,
        message: "질문 분석 중 오류가 발생했습니다.",
        error:
          process.env.NODE_ENV === "development"
            ? error?.message || String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}