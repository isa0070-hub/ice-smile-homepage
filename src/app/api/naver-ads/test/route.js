import crypto from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const customerId = process.env.NAVER_AD_CUSTOMER_ID;
    const accessLicense = process.env.NAVER_AD_ACCESS_LICENSE;
    const secretKey = process.env.NAVER_AD_SECRET_KEY;

    if (!customerId || !accessLicense || !secretKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "NAVER_AD 환경변수가 설정되지 않았습니다.",
        },
        { status: 500 }
      );
    }

    const timestamp = Date.now().toString();
    const method = "GET";
    const uri = "/ncc/campaigns";

    const message = `${timestamp}.${method}.${uri}`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(message)
      .digest("base64");

    const response = await fetch(`https://api.searchad.naver.com${uri}`, {
      method,
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": accessLicense,
        "X-Customer": customerId,
        "X-Signature": signature,
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "네이버 검색광고 API 연결 성공",
      campaignCount: Array.isArray(data) ? data.length : 0,
      campaigns: Array.isArray(data)
        ? data.map((campaign) => ({
            nccCampaignId: campaign.nccCampaignId,
            name: campaign.name,
            campaignTp: campaign.campaignTp,
            status: campaign.status,
          }))
        : [],
    });
  } catch (error) {
    console.error("NAVER ADS API ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
