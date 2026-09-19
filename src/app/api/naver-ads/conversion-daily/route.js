import crypto from "crypto";
import { requireAdminRequest } from "@/lib/adminApi";
import { isSameOriginRequest } from "@/lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = "https://api.searchad.naver.com";

const VALID_TYPES = new Set([
  "custom001", // 강변 전화
  "custom002", // 선릉 전화
  "custom003", // 신도림 전화
  "custom005", // 네이버 톡톡
  "lead",      // 온라인 접수 완료
]);

const ASSIST_TYPES = new Set([
  "custom006", // 온라인 문의 페이지 클릭
  "custom007", // 전화번호 목록 열기
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeSignature(timestamp, method, uri, secretKey) {
  return crypto
    .createHmac("sha256", secretKey)
    .update(`${timestamp}.${method}.${uri}`)
    .digest("base64");
}

function credentials() {
  const value = {
    customerId: process.env.NAVER_AD_CUSTOMER_ID,
    accessLicense: process.env.NAVER_AD_ACCESS_LICENSE,
    secretKey: process.env.NAVER_AD_SECRET_KEY,
  };

  if (
    !value.customerId ||
    !value.accessLicense ||
    !value.secretKey
  ) {
    throw new Error("네이버 광고 API 환경변수가 부족합니다.");
  }

  return value;
}

function authHeaders(method, uri, json = false) {
  const auth = credentials();
  const timestamp = Date.now().toString();

  return {
    ...(json
      ? { "Content-Type": "application/json; charset=UTF-8" }
      : {}),

    "X-Timestamp": timestamp,
    "X-API-KEY": auth.accessLicense,
    "X-Customer": auth.customerId,
    "X-Signature": makeSignature(
      timestamp,
      method,
      uri,
      auth.secretKey
    ),
  };
}

async function apiJson(method, uri, body) {
  const response = await fetch(
    `${BASE_URL}${uri}`,
    {
      method,
      headers: authHeaders(
        method,
        uri,
        Boolean(body)
      ),
      body: body
        ? JSON.stringify(body)
        : undefined,
      cache: "no-store",
    }
  );

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `NAVER API ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function downloadReport(downloadUrl) {
  const parsed = new URL(
    downloadUrl,
    BASE_URL
  );

  if (
    parsed.hostname !== "api.searchad.naver.com" ||
    parsed.pathname !== "/report-download"
  ) {
    throw new Error(
      "예상하지 못한 네이버 보고서 주소입니다."
    );
  }

  const response = await fetch(
    parsed.toString(),
    {
      method: "GET",
      headers: authHeaders(
        "GET",
        "/report-download"
      ),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `보고서 다운로드 실패 (${response.status}): ${text.slice(0, 300)}`
    );
  }

  return response.text();
}

function normalizeDate(value) {
  const date = String(value || "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(
      "date는 YYYY-MM-DD 형식이어야 합니다."
    );
  }

  return date;
}

function emptyBreakdown() {
  return {
    phoneGangbyeon: 0,
    phoneSeolleung: 0,
    phoneSindorim: 0,
    phoneTotal: 0,
    naverTalk: 0,
    onlineInquiry: 0,
    inquiryActions: 0,

    assistInquiryClick: 0,
    assistPhoneListOpen: 0,
    assistTotal: 0,

    rawConversions: 0,
  };
}

function addToObject(target, key, count) {
  target[key] =
    Number(target[key] || 0) + count;
}

function parseReport(raw, date) {
  const summary = emptyBreakdown();
  const byAdgroup = {};
  const byKeyword = {};
  const byType = {};

  const lines = raw
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean);

  for (const line of lines) {
    const columns = line.split("\t");

    // 실제 AD_CONVERSION_DETAIL 응답에서 확인한 위치
    if (columns.length < 15) {
      continue;
    }

    const campaignId = columns[2] || "-";
    const adgroupId = columns[3] || "-";
    const keywordId = columns[4] || "-";

    const conversionType =
      String(columns[12] || "").trim();

    const count =
      Number(columns[13] || 0);

    if (
      !conversionType ||
      !Number.isFinite(count) ||
      count <= 0
    ) {
      continue;
    }

    addToObject(
      byType,
      conversionType,
      count
    );

    summary.rawConversions += count;

    let category = "other";

    if (conversionType === "custom001") {
      summary.phoneGangbyeon += count;
      summary.phoneTotal += count;
      summary.inquiryActions += count;
      category = "valid";
    }

    if (conversionType === "custom002") {
      summary.phoneSeolleung += count;
      summary.phoneTotal += count;
      summary.inquiryActions += count;
      category = "valid";
    }

    if (conversionType === "custom003") {
      summary.phoneSindorim += count;
      summary.phoneTotal += count;
      summary.inquiryActions += count;
      category = "valid";
    }

    if (conversionType === "custom005") {
      summary.naverTalk += count;
      summary.inquiryActions += count;
      category = "valid";
    }

    if (conversionType === "lead") {
      summary.onlineInquiry += count;
      summary.inquiryActions += count;
      category = "valid";
    }

    if (conversionType === "custom006") {
      summary.assistInquiryClick += count;
      summary.assistTotal += count;
      category = "assist";
    }

    if (conversionType === "custom007") {
      summary.assistPhoneListOpen += count;
      summary.assistTotal += count;
      category = "assist";
    }

    const entity = {
      campaignId,
      rawConversions: count,
      valid: category === "valid" ? count : 0,
      assist: category === "assist" ? count : 0,
    };

    if (!byAdgroup[adgroupId]) {
      byAdgroup[adgroupId] = {
        rawConversions: 0,
        valid: 0,
        assist: 0,
      };
    }

    byAdgroup[adgroupId].rawConversions +=
      entity.rawConversions;

    byAdgroup[adgroupId].valid +=
      entity.valid;

    byAdgroup[adgroupId].assist +=
      entity.assist;

    if (keywordId !== "-") {
      if (!byKeyword[keywordId]) {
        byKeyword[keywordId] = {
          rawConversions: 0,
          valid: 0,
          assist: 0,
        };
      }

      byKeyword[keywordId].rawConversions +=
        entity.rawConversions;

      byKeyword[keywordId].valid +=
        entity.valid;

      byKeyword[keywordId].assist +=
        entity.assist;
    }
  }

  return {
    date,
    ...summary,
    byType,
    byAdgroup,
    byKeyword,
  };
}

async function createAndDownload(date) {
  const created = await apiJson(
    "POST",
    "/stat-reports",
    {
      reportTp: "AD_CONVERSION_DETAIL",
      statDt: date.replaceAll("-", ""),
    }
  );

  const jobId = created.reportJobId;

  if (!jobId) {
    throw new Error(
      "네이버 전환 보고서 ID를 받지 못했습니다."
    );
  }

  let report = created;

  for (let attempt = 0; attempt < 16; attempt += 1) {
    if (report.status === "BUILT") {
      break;
    }

    if (report.status === "NONE") {
      return {
        date,
        ...emptyBreakdown(),
        byType: {},
        byAdgroup: {},
        byKeyword: {},
      };
    }

    if (report.status === "ERROR") {
      throw new Error(
        "네이버 전환 보고서 생성에 실패했습니다."
      );
    }

    await sleep(600);

    report = await apiJson(
      "GET",
      `/stat-reports/${jobId}`
    );
  }

  if (report.status !== "BUILT") {
    throw new Error(
      "전환 보고서 생성 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요."
    );
  }

  if (!report.downloadUrl) {
    throw new Error(
      "전환 보고서 다운로드 주소가 없습니다."
    );
  }

  const raw = await downloadReport(
    report.downloadUrl
  );

  return parseReport(
    raw,
    date
  );
}

export async function POST(request) {
  const authError =
    requireAdminRequest(request);

  if (authError) {
    return authError;
  }

  if (!isSameOriginRequest(request)) {
    return Response.json(
      {
        ok: false,
        error: "허용되지 않은 요청입니다.",
      },
      { status: 403 }
    );
  }

  try {
    const body =
      await request.json();

    const date =
      normalizeDate(body?.date);

    const data =
      await createAndDownload(date);

    return Response.json(
      {
        ok: true,
        ...data,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "NAVER CONVERSION DAILY ERROR:",
      error
    );

    return Response.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
