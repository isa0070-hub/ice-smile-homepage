import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { normalizePlaceMonitorSyncPayload } from "@/lib/placeMonitorContract";
import {
  PlaceMonitorStoreError,
  storePlaceMonitorPayload,
} from "@/lib/placeMonitorStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 100_000;
const NO_STORE_HEADERS = { "Cache-Control": "private, no-store, max-age=0" };

function response(payload, status) {
  return NextResponse.json(payload, {
    status,
    headers: NO_STORE_HEADERS,
  });
}
function secureEqual(actual, expected) {
  if (typeof actual !== "string" || typeof expected !== "string") return false;
  const actualDigest = createHash("sha256").update(actual).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualDigest, expectedDigest);
}

function hasValidSyncToken(request) {
  const configured = process.env.PLACE_MONITOR_SYNC_TOKEN;
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  return (
    typeof configured === "string" &&
    Buffer.byteLength(configured, "utf8") >= 32 &&
    secureEqual(supplied, configured)
  );
}

async function readLimitedJson(request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) return { tooLarge: true };
  if (!request.body) return { invalid: true };

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return { tooLarge: true };
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { value: JSON.parse(text) };
  } catch {
    return { invalid: true };
  }
}

export async function POST(request) {
  if (!hasValidSyncToken(request)) {
    return response({ success: false, message: "인증되지 않은 동기화 요청입니다." }, 401);
  }

  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    return response({ success: false, message: "JSON 요청만 허용됩니다." }, 415);
  }

  const parsed = await readLimitedJson(request);
  if (parsed.tooLarge) {
    return response({ success: false, message: "동기화 데이터가 너무 큽니다." }, 413);
  }
  if (parsed.invalid) {
    return response({ success: false, message: "잘못된 동기화 요청입니다." }, 400);
  }

  const payload = normalizePlaceMonitorSyncPayload(parsed.value);
  if (!payload) {
    return response({ success: false, message: "측정 요약 형식이 올바르지 않습니다." }, 400);
  }

  try {
    const result = await storePlaceMonitorPayload(
      payload.items,
      payload.observerStatus,
    );
    return response({ success: true, ...result }, 200);
  } catch (error) {
    if (error instanceof PlaceMonitorStoreError) {
      return response({ success: false, message: error.message }, error.status);
    }
    console.error("플레이스 순위 동기화 오류:", error);
    return response({ success: false, message: "측정 결과를 동기화하지 못했습니다." }, 500);
  }
}
