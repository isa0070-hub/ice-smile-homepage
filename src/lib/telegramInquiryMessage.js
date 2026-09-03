const TELEGRAM_MESSAGE_MAX_LENGTH = 3900;
const TELEGRAM_ADMIN_URL =
  "https://www.ismileagain.co.kr/admin/online-inquiries";
const TELEGRAM_UNSAFE_CONTROL_CHARACTERS =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u061c\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g;

function cleanTelegramText(value) {
  if (typeof value !== "string") {
    return "-";
  }

  return (
    value
      .replace(/\r\n?/g, "\n")
      .replace(/[\u2028\u2029]/g, "\n")
      .replace(TELEGRAM_UNSAFE_CONTROL_CHARACTERS, "")
      .trim() || "-"
  );
}

function telegramSingleLine(value) {
  return cleanTelegramText(value).replace(/\s+/g, " ");
}

function telegramMultiline(value) {
  return cleanTelegramText(value)
    .split("\n")
    .map((line) => `│ ${line}`)
    .join("\n");
}

function keepFooterWithinLimit(body, footer) {
  const completeMessage = `${body}\n\n${footer}`;

  if (Array.from(completeMessage).length <= TELEGRAM_MESSAGE_MAX_LENGTH) {
    return completeMessage;
  }

  const truncatedSuffix = `\n│ … (긴 내용 일부 생략)\n\n${footer}`;
  const availableBodyLength =
    TELEGRAM_MESSAGE_MAX_LENGTH - Array.from(truncatedSuffix).length;

  return `${Array.from(body).slice(0, availableBodyLength).join("").trimEnd()}${truncatedSuffix}`;
}

export function buildTelegramInquiryMessage(inquiry, inquiryId) {
  const body = [
    "🔔 새 온라인 접수",
    "",
    `접수번호: ${telegramSingleLine(String(inquiryId ?? "-"))}`,
    `성함: ${telegramSingleLine(inquiry.customer_name)}`,
    `연락처: ${telegramSingleLine(inquiry.phone)}`,
    `희망지점: ${telegramSingleLine(inquiry.preferred_branch)}`,
    `기기: ${telegramSingleLine(inquiry.device)}`,
    `모델: ${telegramSingleLine(inquiry.model)}`,
    `연락가능시간: ${telegramSingleLine(inquiry.contact_time)}`,
    "",
    "┌ 증상·문의 내용",
    telegramMultiline(inquiry.symptom),
    "└ 증상·문의 내용 끝",
    "",
    "┌ 추가 메모",
    telegramMultiline(inquiry.memo),
    "└ 추가 메모 끝",
  ].join("\n");

  return keepFooterWithinLimit(
    body,
    `관리자 확인: ${TELEGRAM_ADMIN_URL}`,
  );
}

export function buildTelegramInquiryLinkMessage(inquiryId) {
  return [
    "🔔 새 온라인 접수 1건이 등록되었습니다.",
    `접수번호: ${telegramSingleLine(String(inquiryId ?? "-"))}`,
    "고객 정보와 문의 내용은 관리자 화면에서 확인해 주세요.",
    TELEGRAM_ADMIN_URL,
  ].join("\n");
}
