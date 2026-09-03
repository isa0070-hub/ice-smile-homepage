import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  buildTelegramInquiryLinkMessage,
  buildTelegramInquiryMessage,
} from "@/lib/telegramInquiryMessage";

export const INQUIRY_MAX_BODY_SIZE = 16 * 1024;

const IP_RATE_LIMIT = 5;
const IP_RATE_WINDOW_MS = 10 * 60 * 1000;
const GLOBAL_RATE_LIMIT = 30;
const GLOBAL_RATE_WINDOW_MS = 60 * 1000;
const MAX_RATE_LIMIT_ENTRIES = 10_000;
const ALLOWED_BRANCHES = new Set(["강변점", "선릉점", "신도림점"]);
const ALLOWED_STATUSES = new Set([
  "접수대기",
  "확인중",
  "연락완료",
  "처리완료",
]);
const SUBMISSION_TOKEN_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PRIVACY_NOTICE_VERSION = "2026-09-03";

const rateLimitStore =
  globalThis.__ismileInquiryRateLimitStore || new Map();

if (!globalThis.__ismileInquiryRateLimitStore) {
  globalThis.__ismileInquiryRateLimitStore = rateLimitStore;
}

function normalizeSingleLine(value, maxLength) {
  if (typeof value !== "string" || value.length > maxLength * 4) {
    return null;
  }

  const normalized = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length <= maxLength ? normalized : null;
}

function normalizeMultiline(value, maxLength) {
  if (typeof value !== "string" || value.length > maxLength * 4) {
    return null;
  }

  const normalized = value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim();

  return normalized.length <= maxLength ? normalized : null;
}

function getClientIp(request) {
  const candidates = [
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  ];

  for (const candidate of candidates) {
    let value = candidate?.split(",")[0]?.trim() || "";

    if (value.startsWith("::ffff:")) {
      value = value.slice(7);
    }

    if (isIP(value)) {
      return value;
    }
  }

  return "unknown";
}

function makeInquiryRateLimitKey(request) {
  const secret =
    process.env.INQUIRY_RATE_LIMIT_SECRET ||
    process.env.SUPABASE_SECRET_KEY;

  if (
    typeof secret !== "string" ||
    Buffer.byteLength(secret, "utf8") < 32
  ) {
    throw new Error(
      "Inquiry rate-limit secret must contain at least 32 bytes.",
    );
  }

  return createHmac("sha256", secret)
    .update(`online-inquiry-ip\0${getClientIp(request)}`)
    .digest("hex");
}

function consumeRateLimit(key, limit, windowMs, now) {
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function pruneRateLimits(now) {
  if (rateLimitStore.size < MAX_RATE_LIMIT_ENTRIES) {
    return;
  }

  for (const [key, value] of rateLimitStore) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function consumeInquiryIpRateLimit(request, now = Date.now()) {
  pruneRateLimits(now);

  const requestedKey = `ip:${makeInquiryRateLimitKey(request)}`;
  const key =
    rateLimitStore.has(requestedKey) ||
    rateLimitStore.size < MAX_RATE_LIMIT_ENTRIES
      ? requestedKey
      : "ip:overflow";

  return consumeRateLimit(key, IP_RATE_LIMIT, IP_RATE_WINDOW_MS, now);
}

export function consumeInquiryGlobalRateLimit(now = Date.now()) {
  return consumeRateLimit(
    "global",
    GLOBAL_RATE_LIMIT,
    GLOBAL_RATE_WINDOW_MS,
    now,
  );
}

export async function consumeInquiryDistributedRateLimit(request) {
  const { data, error } = await supabaseAdmin
    .rpc("consume_online_inquiry_rate_limit", {
      p_ip_hash: makeInquiryRateLimitKey(request),
    })
    .maybeSingle();

  if (
    error ||
    !data ||
    typeof data.allowed !== "boolean"
  ) {
    throw error || new Error("Invalid inquiry rate-limit response.");
  }

  const retryAfter = Number(data.retry_after);

  return {
    allowed: data.allowed,
    retryAfter:
      Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.ceil(retryAfter)
        : 1,
  };
}

export async function readLimitedJson(request, maxBytes) {
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

      if (totalBytes > maxBytes) {
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

export function validateInquirySubmission(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "잘못된 요청입니다." };
  }

  const website = normalizeSingleLine(body.website ?? "", 200);

  if (website === null) {
    return { error: "잘못된 요청입니다." };
  }

  if (website) {
    return { bot: true };
  }

  if (body.privacy_consent !== true) {
    return { error: "개인정보 수집·이용에 동의해 주세요." };
  }

  if (
    body.telegram_consent !== undefined &&
    body.telegram_consent !== true
  ) {
    return {
      error: "수리 상담 및 접수 알림을 위한 개인정보 처리에 동의해 주세요.",
    };
  }

  const customerName = normalizeSingleLine(body.customer_name, 40);
  const phone = normalizeSingleLine(body.phone, 30);
  const device = normalizeSingleLine(body.device ?? "", 80);
  const model = normalizeSingleLine(body.model ?? "", 100);
  const contactTime = normalizeSingleLine(body.contact_time ?? "", 80);
  const symptom = normalizeMultiline(body.symptom, 2000);
  const memo = normalizeMultiline(body.memo ?? "", 1000);
  const preferredBranch = normalizeSingleLine(body.preferred_branch, 20);

  if (
    customerName === null ||
    phone === null ||
    device === null ||
    model === null ||
    contactTime === null ||
    symptom === null ||
    memo === null ||
    preferredBranch === null
  ) {
    return { error: "입력값이 허용된 길이를 초과했습니다." };
  }

  if (!customerName || !phone || !symptom) {
    return { error: "성함, 연락처, 고장 증상을 모두 입력해 주세요." };
  }

  if (!/^[0-9+().\-\s]{7,30}$/.test(phone)) {
    return { error: "연락처 형식을 확인해 주세요." };
  }

  if (!ALLOWED_BRANCHES.has(preferredBranch)) {
    return { error: "희망 지점을 다시 선택해 주세요." };
  }

  return {
    telegramConsent: body.telegram_consent === true,
    inquiry: {
      customer_name: customerName,
      phone,
      preferred_branch: preferredBranch,
      device,
      model,
      contact_time: contactTime,
      symptom,
      memo,
      status: "접수대기",
    },
  };
}

export function validateSubmissionToken(value) {
  return typeof value === "string" && SUBMISSION_TOKEN_PATTERN.test(value);
}

export function validateInquiryStatus(value) {
  return typeof value === "string" && ALLOWED_STATUSES.has(value);
}

export function validateInquiryId(value) {
  if (typeof value !== "string") {
    return false;
  }

  return (
    /^[1-9][0-9]{0,18}$/.test(value) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export async function insertInquiryOnce(
  inquiry,
  submissionToken,
  telegramConsent,
) {
  const consentedAt = telegramConsent ? new Date().toISOString() : null;
  const { data, error } = await supabaseAdmin
    .from("online_inquiries")
    .insert([
      {
        ...inquiry,
        submission_token: submissionToken,
        telegram_consent: telegramConsent,
        telegram_consent_at: consentedAt,
        privacy_notice_version: telegramConsent
          ? PRIVACY_NOTICE_VERSION
          : null,
      },
    ])
    .select("id")
    .maybeSingle();

  if (error) {
    const duplicateDetails = `${error.message || ""} ${error.details || ""}`;

    if (
      error.code === "23505" &&
      (duplicateDetails.includes("submission_token") ||
        duplicateDetails.includes("online_inquiries_submission_token_key"))
    ) {
      return { inserted: false, id: null };
    }

    throw error;
  }

  return {
    inserted: data?.id != null,
    id: data?.id ?? null,
  };
}

export async function sendTelegramInquiryAlert(inquiry, inquiryId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error("Telegram notification is not configured.");
  }

  const message = inquiry
    ? buildTelegramInquiryMessage(inquiry, inquiryId)
    : buildTelegramInquiryLinkMessage(inquiryId);

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        protect_content: true,
        link_preview_options: { is_disabled: true },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new Error("Telegram notification failed.");
  }
}
