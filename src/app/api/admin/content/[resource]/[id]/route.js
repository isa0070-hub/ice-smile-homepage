import {
  adminErrorResponse,
  adminSuccessResponse,
  requireAdminRequest,
} from "@/lib/adminApi";
import {
  AdminContentError,
  deleteAdminResource,
  getAdminResource,
  updateAdminResource,
} from "@/lib/adminContent";
import { revalidateAdminResource } from "@/lib/adminRevalidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_JSON_BODY_SIZE = 1024 * 1024;

function handleError(error) {
  if (error instanceof AdminContentError) {
    return adminErrorResponse(error.message, error.status);
  }

  console.error("관리자 콘텐츠 상세 API 오류:", error);
  return adminErrorResponse("관리자 요청을 처리하지 못했습니다.", 500);
}

export async function GET(request, context) {
  const authError = requireAdminRequest(request);
  if (authError) return authError;

  try {
    const { resource, id } = await context.params;
    const data = await getAdminResource(resource, id);

    return adminSuccessResponse({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request, context) {
  const authError = requireAdminRequest(request, { requireSameOrigin: true });
  if (authError) return authError;

  if (Number(request.headers.get("content-length") || 0) > MAX_JSON_BODY_SIZE) {
    return adminErrorResponse("요청 데이터가 너무 큽니다.", 413);
  }

  try {
    const { resource, id } = await context.params;
    const payload = await request.json();
    const data = await updateAdminResource(resource, id, payload);
    revalidateAdminResource(resource);

    return adminSuccessResponse({ data });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return adminErrorResponse("요청 형식이 올바르지 않습니다.", 400);
    }

    return handleError(error);
  }
}

export async function DELETE(request, context) {
  const authError = requireAdminRequest(request, { requireSameOrigin: true });
  if (authError) return authError;

  try {
    const { resource, id } = await context.params;
    await deleteAdminResource(resource, id);
    revalidateAdminResource(resource);

    return adminSuccessResponse();
  } catch (error) {
    return handleError(error);
  }
}
