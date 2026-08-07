import {
  adminErrorResponse,
  adminSuccessResponse,
  requireAdminRequest,
} from "@/lib/adminApi";
import {
  readLimitedJson,
  validateInquiryId,
  validateInquiryStatus,
} from "@/lib/onlineInquiries";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPDATE_BODY_SIZE = 1024;

async function getValidatedId(context) {
  const { id } = await context.params;
  return validateInquiryId(id) ? id : null;
}

export async function PATCH(request, context) {
  const authError = requireAdminRequest(request, {
    requireSameOrigin: true,
  });

  if (authError) {
    return authError;
  }

  const id = await getValidatedId(context);

  if (!id) {
    return adminErrorResponse("잘못된 접수 번호입니다.", 400);
  }

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return adminErrorResponse("JSON 형식의 요청만 허용됩니다.", 415);
  }

  if (
    Number(request.headers.get("content-length") || 0) >
    MAX_UPDATE_BODY_SIZE
  ) {
    return adminErrorResponse("요청 데이터가 너무 큽니다.", 413);
  }

  const parsedBody = await readLimitedJson(request, MAX_UPDATE_BODY_SIZE);

  if (parsedBody.tooLarge) {
    return adminErrorResponse("요청 데이터가 너무 큽니다.", 413);
  }

  if (parsedBody.error) {
    return adminErrorResponse("잘못된 요청입니다.", 400);
  }

  if (!validateInquiryStatus(parsedBody.value?.status)) {
    return adminErrorResponse("접수 상태를 다시 선택해 주세요.", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("online_inquiries")
    .update({ status: parsedBody.value.status })
    .eq("id", id)
    .select("id,status")
    .maybeSingle();

  if (error) {
    console.error("Failed to update an online inquiry.");
    return adminErrorResponse("상태를 변경하지 못했습니다.");
  }

  if (!data) {
    return adminErrorResponse("접수 내역을 찾을 수 없습니다.", 404);
  }

  return adminSuccessResponse({ item: data });
}

export async function DELETE(request, context) {
  const authError = requireAdminRequest(request, {
    requireSameOrigin: true,
  });

  if (authError) {
    return authError;
  }

  const id = await getValidatedId(context);

  if (!id) {
    return adminErrorResponse("잘못된 접수 번호입니다.", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("online_inquiries")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to delete an online inquiry.");
    return adminErrorResponse("접수 내역을 삭제하지 못했습니다.");
  }

  if (!data) {
    return adminErrorResponse("접수 내역을 찾을 수 없습니다.", 404);
  }

  return adminSuccessResponse();
}
