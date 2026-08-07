import {
  adminErrorResponse,
  adminSuccessResponse,
  requireAdminRequest,
} from "@/lib/adminApi";
import {
  AdminContentError,
  getAdminDashboardData,
} from "@/lib/adminContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const authError = requireAdminRequest(request);
  if (authError) return authError;

  try {
    const dashboard = await getAdminDashboardData();
    return adminSuccessResponse(dashboard);
  } catch (error) {
    if (error instanceof AdminContentError) {
      return adminErrorResponse(error.message, error.status);
    }

    console.error("관리자 현황 API 오류:", error);
    return adminErrorResponse("관리자 현황을 불러오지 못했습니다.", 500);
  }
}
