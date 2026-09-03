import {
  adminErrorResponse,
  adminSuccessResponse,
  requireAdminRequest,
} from "@/lib/adminApi";
import { isSameOriginRequest } from "@/lib/adminSession";
import {
  consumeInquiryDistributedRateLimit,
  consumeInquiryGlobalRateLimit,
  consumeInquiryIpRateLimit,
  INQUIRY_MAX_BODY_SIZE,
  insertInquiryOnce,
  readLimitedJson,
  sendTelegramInquiryAlert,
  validateInquirySubmission,
  validateSubmissionToken,
} from "@/lib/onlineInquiries";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

function publicResponse(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      ...PUBLIC_HEADERS,
      ...headers,
    },
  });
}

function rateLimitResponse(retryAfter) {
  return publicResponse(
    {
      ok: false,
      message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
    },
    429,
    { "Retry-After": String(retryAfter) },
  );
}

export async function GET(request) {
  const authError = requireAdminRequest(request);

  if (authError) {
    return authError;
  }

  const { data, error } = await supabaseAdmin
    .from("online_inquiries")
    .select(
      "id,created_at,customer_name,phone,preferred_branch,device,model,symptom,contact_time,memo,status",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Failed to load online inquiries.");
    return adminErrorResponse("온라인 접수 목록을 불러오지 못했습니다.");
  }

  return adminSuccessResponse({ items: data || [] });
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) {
    return publicResponse(
      { ok: false, message: "허용되지 않은 요청입니다." },
      403,
    );
  }

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return publicResponse(
      { ok: false, message: "JSON 형식의 요청만 허용됩니다." },
      415,
    );
  }

  if (
    Number(request.headers.get("content-length") || 0) >
    INQUIRY_MAX_BODY_SIZE
  ) {
    return publicResponse(
      { ok: false, message: "요청 데이터가 너무 큽니다." },
      413,
    );
  }

  let ipLimit;

  try {
    ipLimit = consumeInquiryIpRateLimit(request);
  } catch {
    console.error("Local inquiry rate-limit configuration failed.");
    return publicResponse(
      {
        ok: false,
        message: "접수 보호 기능을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      },
      503,
      { "Retry-After": "60" },
    );
  }

  if (!ipLimit.allowed) {
    return rateLimitResponse(ipLimit.retryAfter);
  }

  const parsedBody = await readLimitedJson(request, INQUIRY_MAX_BODY_SIZE);

  if (parsedBody.tooLarge) {
    return publicResponse(
      { ok: false, message: "요청 데이터가 너무 큽니다." },
      413,
    );
  }

  if (parsedBody.error) {
    return publicResponse(
      { ok: false, message: "잘못된 요청입니다." },
      400,
    );
  }

  const validation = validateInquirySubmission(parsedBody.value);

  if (validation.bot) {
    return publicResponse({ ok: true, inserted: false });
  }

  if (validation.error) {
    return publicResponse(
      { ok: false, message: validation.error },
      400,
    );
  }

  const submissionToken = request.headers.get("idempotency-key");

  if (!validateSubmissionToken(submissionToken)) {
    return publicResponse(
      { ok: false, message: "접수 확인값이 올바르지 않습니다." },
      400,
    );
  }

  const globalLimit = consumeInquiryGlobalRateLimit();

  if (!globalLimit.allowed) {
    return rateLimitResponse(globalLimit.retryAfter);
  }

  let distributedLimit;

  try {
    distributedLimit = await consumeInquiryDistributedRateLimit(request);
  } catch {
    console.error("Distributed inquiry rate limit failed.");
    return publicResponse(
      {
        ok: false,
        message: "접수 보호 기능을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      },
      503,
      { "Retry-After": "60" },
    );
  }

  if (!distributedLimit.allowed) {
    return rateLimitResponse(distributedLimit.retryAfter);
  }

  let insertion;

  try {
    insertion = await insertInquiryOnce(
      validation.inquiry,
      submissionToken,
      validation.telegramConsent,
    );
  } catch {
    console.error("Failed to save an online inquiry.");
    return publicResponse(
      {
        ok: false,
        message: "접수 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      },
      500,
    );
  }

  if (!insertion.inserted) {
    return publicResponse({ ok: true, inserted: false, duplicate: true });
  }

  try {
    await sendTelegramInquiryAlert(
      validation.telegramConsent ? validation.inquiry : null,
      insertion.id,
    );
  } catch (error) {
    console.error(
      "Online inquiry was saved, but Telegram notification failed:",
      error?.name || "unknown",
    );
  }

  return publicResponse({ ok: true, inserted: true }, 201);
}
