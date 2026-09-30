import {
  adminErrorResponse,
  adminSuccessResponse,
  requireAdminRequest,
} from "@/lib/adminApi";
import {
  getPlaceMonitorDashboard,
  getPlaceMonitorHistory,
  PlaceMonitorStoreError,
} from "@/lib/placeMonitorStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SENSOR_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/u;

function optionalIsoDate(value) {
  if (!value) return null;
  if (value.length > 40 || Number.isNaN(Date.parse(value))) return undefined;
  return new Date(value).toISOString();
}
export async function GET(request) {
  const authError = requireAdminRequest(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") || "latest";

  try {
    if (mode === "latest") {
      const dashboard = await getPlaceMonitorDashboard();
      return adminSuccessResponse({ dashboard });
    }

    if (mode !== "history") {
      return adminErrorResponse("지원하지 않는 조회 방식입니다.", 400);
    }

    const sensorId = url.searchParams.get("sensor") || null;
    const before = optionalIsoDate(url.searchParams.get("before"));
    const from = optionalIsoDate(url.searchParams.get("from"));
    const to = optionalIsoDate(url.searchParams.get("to"));
    const requestedLimit = Number(url.searchParams.get("limit") || 50);
    const limit = Number.isInteger(requestedLimit)
      ? Math.max(1, Math.min(requestedLimit, 50))
      : 50;

    if (
      (sensorId && !SENSOR_PATTERN.test(sensorId)) ||
      before === undefined ||
      from === undefined ||
      to === undefined
    ) {
      return adminErrorResponse("조회 조건이 올바르지 않습니다.", 400);
    }

    const items = await getPlaceMonitorHistory({
      sensorId,
      before,
      from,
      to,
      limit,
    });
    return adminSuccessResponse({ items, limit });
  } catch (error) {
    if (error instanceof PlaceMonitorStoreError) {
      return adminErrorResponse(error.message, error.status);
    }
    console.error("플레이스 순위 조회 오류:", error);
    return adminErrorResponse("순위 측정 결과를 불러오지 못했습니다.", 500);
  }
}
