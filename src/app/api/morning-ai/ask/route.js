import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/adminSession";
import { getLatestMorningBrief } from "@/lib/morning-ai/read";
import { personalizeMorningBrief } from "@/lib/morning-ai/personalize";
import {
  logInfo,
  logSuccess,
  logError,
} from "@/lib/morning-ai/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_SIZE = 2048;
const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

function jsonResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: RESPONSE_HEADERS,
  });
}

async function readLimitedJson(request) {
  if (!request.body) {
    return { error: true };
  }

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > MAX_BODY_SIZE) {
        await reader.cancel();
        return { tooLarge: true };
      }

      chunks.push(value);
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const text = new TextDecoder("utf-8", { fatal: true }).decode(combined);
    return { value: JSON.parse(text) };
  } catch {
    return { error: true };
  }
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) {
    return jsonResponse(
      { ok: false, message: "허용되지 않은 요청입니다." },
      403,
    );
  }

  const mediaType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();

  if (mediaType !== "application/json") {
    return jsonResponse(
      { ok: false, message: "JSON 형식의 요청만 허용됩니다." },
      415,
    );
  }

  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_SIZE) {
    return jsonResponse(
      { ok: false, message: "요청 데이터가 너무 큽니다." },
      413,
    );
  }

  try {
    const parsedBody = await readLimitedJson(request);

    if (parsedBody.tooLarge) {
      return jsonResponse(
        { ok: false, message: "요청 데이터가 너무 큽니다." },
        413,
      );
    }

    const body = parsedBody.value;

    if (
      parsedBody.error ||
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      typeof body.question !== "string"
    ) {
      return jsonResponse(
        { ok: false, message: "요청 형식이 올바르지 않습니다." },
        400,
      );
    }

    const question = body.question
      .normalize("NFKC")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!question) {
      return jsonResponse(
        {
          ok: false,
          message: "질문을 입력해 주세요.",
        },
        400,
      );
    }

    if (question.length > 300) {
      return jsonResponse(
        {
          ok: false,
          message: "질문은 300자 이내로 입력해 주세요.",
        },
        400,
      );
    }

    // 질문에는 개인적인 내용이 포함될 수 있으므로 원문을 서버 로그에 남기지 않습니다.
    logInfo("🙋 사용자 질문 분석 시작");

    const latestBrief = await getLatestMorningBrief();

    const result = personalizeMorningBrief(
      question,
      latestBrief
    );

    logSuccess("사용자 질문 분석 완료");

    return jsonResponse({
      ok: true,
      message: "Morning AI 질문 분석 완료",
      result,
    });
  } catch (error) {
    logError("Morning AI 질문 API 오류", error);

    return jsonResponse(
      {
        ok: false,
        message: "질문 분석 중 오류가 발생했습니다.",
        error:
          process.env.NODE_ENV === "development"
            ? error?.message || String(error)
            : undefined,
      },
      500,
    );
  }
}
