import crypto from "crypto";
import { requireAdminRequest } from "@/lib/adminApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL =
  "https://api.searchad.naver.com";

function makeSignature(
  timestamp,
  method,
  uri,
  secretKey
) {
  return crypto
    .createHmac(
      "sha256",
      secretKey
    )
    .update(
      `${timestamp}.${method}.${uri}`
    )
    .digest("base64");
}

function getCredentials(account) {
  const credentials =
    account === "seolleung"
      ? {
          customerId:
            process.env
              .NAVER_AD_SEOLLEUNG_CUSTOMER_ID,

          accessLicense:
            process.env
              .NAVER_AD_SEOLLEUNG_ACCESS_LICENSE,

          secretKey:
            process.env
              .NAVER_AD_SEOLLEUNG_SECRET_KEY,
        }
      : {
          customerId:
            process.env
              .NAVER_AD_CUSTOMER_ID,

          accessLicense:
            process.env
              .NAVER_AD_ACCESS_LICENSE,

          secretKey:
            process.env
              .NAVER_AD_SECRET_KEY,
        };

  if (
    !credentials.customerId ||
    !credentials.accessLicense ||
    !credentials.secretKey
  ) {
    throw new Error(
      `${account} 광고계정 API 환경변수가 부족합니다.`
    );
  }

  return credentials;
}

function authHeaders(
  method,
  uri,
  account,
  json = false
) {
  const credentials =
    getCredentials(account);

  const timestamp =
    Date.now().toString();

  return {
    ...(json
      ? {
          "Content-Type":
            "application/json; charset=UTF-8",
        }
      : {}),

    "X-Timestamp":
      timestamp,

    "X-API-KEY":
      credentials.accessLicense,

    "X-Customer":
      credentials.customerId,

    "X-Signature":
      makeSignature(
        timestamp,
        method,
        uri,
        credentials.secretKey
      ),
  };
}

async function apiJson(
  method,
  uri,
  account,
  body
) {
  const response =
    await fetch(
      `${BASE_URL}${uri}`,
      {
        method,

        headers:
          authHeaders(
            method,
            uri,
            account,
            Boolean(body)
          ),

        body:
          body
            ? JSON.stringify(body)
            : undefined,

        cache: "no-store",
      }
    );

  const text =
    await response.text();

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

function yesterdayKst() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const out = {};

  for (const part of parts) {
    out[part.type] =
      part.value;
  }

  const today =
    `${out.year}-${out.month}-${out.day}`;

  const date =
    new Date(
      `${today}T12:00:00Z`
    );

  date.setUTCDate(
    date.getUTCDate() - 1
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function normalizeDate(value) {
  const date =
    value || yesterdayKst();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      date
    )
  ) {
    throw new Error(
      "date는 YYYY-MM-DD 형식이어야 합니다."
    );
  }

  return date;
}

async function downloadReport(
  downloadUrl,
  account
) {
  const parsed =
    new URL(
      downloadUrl,
      BASE_URL
    );

  const token =
    parsed.searchParams.get(
      "authtoken"
    );

  if (!token) {
    throw new Error(
      "전환 보고서 authtoken이 없습니다."
    );
  }

  const uri =
    "/report-download";

  const url =
    `${BASE_URL}${uri}` +
    `?authtoken=${encodeURIComponent(
      token
    )}`;

  const response =
    await fetch(
      url,
      {
        method: "GET",

        headers:
          authHeaders(
            "GET",
            uri,
            account
          ),

        cache: "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      `보고서 다운로드 실패 (${response.status})`
    );
  }

  return response.text();
}

export async function GET(request) {
  const authError =
    requireAdminRequest(request);

  if (authError) {
    return authError;
  }

  try {
    const { searchParams } =
      new URL(request.url);

    const account =
      searchParams.get(
        "account"
      ) === "seolleung"
        ? "seolleung"
        : "main";

    const jobId =
      searchParams.get(
        "jobId"
      );

    if (!jobId) {
      const date =
        normalizeDate(
          searchParams.get(
            "date"
          )
        );

      const created =
        await apiJson(
          "POST",
          "/stat-reports",
          account,
          {
            reportTp:
              "AD_CONVERSION_DETAIL",

            statDt:
              date.replaceAll(
                "-",
                ""
              ),
          }
        );

      if (
        !created.reportJobId
      ) {
        throw new Error(
          "reportJobId를 받지 못했습니다."
        );
      }

      return Response.json({
        ok: true,
        step: "created",
        account,
        date,

        reportJobId:
          created.reportJobId,

        status:
          created.status,

        nextUrl:
          `/api/naver-ads/conversion-detail` +
          `?account=${account}` +
          `&jobId=${encodeURIComponent(
            created.reportJobId
          )}`,
      });
    }

    if (
      !/^\d+$/.test(jobId)
    ) {
      throw new Error(
        "잘못된 reportJobId입니다."
      );
    }

    const report =
      await apiJson(
        "GET",
        `/stat-reports/${jobId}`,
        account
      );

    if (
      report.status !==
      "BUILT"
    ) {
      return Response.json({
        ok: true,
        step: "waiting",
        account,
        reportJobId:
          jobId,
        status:
          report.status,

        message:
          report.status === "NONE"
            ? "해당 날짜에 전환 데이터가 없습니다."
            : report.status === "ERROR"
            ? "전환 보고서 생성에 실패했습니다."
            : "보고서 생성 중입니다. 몇 초 뒤 새로고침하세요.",
      });
    }

    if (
      !report.downloadUrl
    ) {
      throw new Error(
        "downloadUrl이 없습니다."
      );
    }

    const raw =
      await downloadReport(
        report.downloadUrl,
        account
      );

    const lines =
      raw
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .filter(Boolean);

    return Response.json({
      ok: true,
      step: "built",
      account,
      reportJobId:
        jobId,
      status:
        report.status,

      lineCount:
        lines.length,

      previewLines:
        lines.slice(0, 15),
    });
  } catch (error) {
    console.error(
      "NAVER CONVERSION DETAIL ERROR:",
      error
    );

    return Response.json(
      {
        ok: false,
        error:
          error.message,
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "private, no-store",
        },
      }
    );
  }
}
