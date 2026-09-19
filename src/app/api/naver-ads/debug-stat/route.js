import { requireAdminRequest } from "@/lib/adminApi";
import crypto from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request) {
  const authError = requireAdminRequest(request);
  if (authError) return authError;

  try {
    const customerId = process.env.NAVER_AD_CUSTOMER_ID;
    const accessLicense = process.env.NAVER_AD_ACCESS_LICENSE;
    const secretKey = process.env.NAVER_AD_SECRET_KEY;

    const timestamp = Date.now().toString();
    const method = "GET";
    const uri = "/stats";

    // 실제 활성 광고그룹: 선릉 아이폰수리
    const adgroupId = "grp-a001-01-000000071967372";

    const fields = JSON.stringify([
      "impCnt",
      "clkCnt",
      "salesAmt",
      "ccnt",
      "ctr",
      "cpc",
    ]);

    const timeRange = JSON.stringify({
      since: "2026-09-18",
      until: "2026-09-18",
    });

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(`${timestamp}.${method}.${uri}`)
      .digest("base64");

    const url =
      `https://api.searchad.naver.com${uri}` +
      `?id=${encodeURIComponent(adgroupId)}` +
      `&fields=${encodeURIComponent(fields)}` +
      `&timeRange=${encodeURIComponent(timeRange)}`;

    const response = await fetch(url, {
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": accessLicense,
        "X-Customer": customerId,
        "X-Signature": signature,
      },
      cache: "no-store",
    });

    const text = await response.text();

    return NextResponse.json({
      ok: response.ok,
      httpStatus: response.status,
      testAdgroup: "선릉 아이폰수리",
      testDate: "2026-09-18",
      rawNaverResponse: text,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
