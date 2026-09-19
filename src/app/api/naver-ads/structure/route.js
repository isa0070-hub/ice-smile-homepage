import { requireAdminRequest } from "@/lib/adminApi";
import crypto from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function makeSignature(timestamp, method, uri, secretKey) {
  return crypto
    .createHmac("sha256", secretKey)
    .update(`${timestamp}.${method}.${uri}`)
    .digest("base64");
}

async function naverGet(uri, credentials, query = "") {
  const timestamp = Date.now().toString();
  const method = "GET";

  const signature = makeSignature(
    timestamp,
    method,
    uri,
    credentials.secretKey
  );

  const response = await fetch(
    `https://api.searchad.naver.com${uri}${query}`,
    {
      method,
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": credentials.accessLicense,
        "X-Customer": credentials.customerId,
        "X-Signature": signature,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `NAVER API ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function getAccountStructure(label, credentials) {
  const campaigns = await naverGet(
    "/ncc/campaigns",
    credentials
  );

  const result = [];

  for (const campaign of campaigns) {
    let adgroups = [];

    try {
      adgroups = await naverGet(
        "/ncc/adgroups",
        credentials,
        `?nccCampaignId=${encodeURIComponent(
          campaign.nccCampaignId
        )}`
      );
    } catch (error) {
      adgroups = [
        {
          error: error.message,
        },
      ];
    }

    result.push({
      campaignId: campaign.nccCampaignId,
      campaignName: campaign.name,
      campaignType: campaign.campaignTp,
      status: campaign.status,

      adgroups: Array.isArray(adgroups)
        ? adgroups.map((group) => ({
            adgroupId: group.nccAdgroupId ?? null,
            adgroupName: group.name ?? null,
            status: group.status ?? null,
            error: group.error ?? null,
          }))
        : [],
    });
  }

  return {
    account: label,
    campaignCount: result.length,
    campaigns: result,
  };
}

export async function GET(request) {
  const authError = requireAdminRequest(request);
  if (authError) return authError;

  try {
    const main = {
      customerId: process.env.NAVER_AD_CUSTOMER_ID,
      accessLicense: process.env.NAVER_AD_ACCESS_LICENSE,
      secretKey: process.env.NAVER_AD_SECRET_KEY,
    };

    const seolleung = {
      customerId: process.env.NAVER_AD_SEOLLEUNG_CUSTOMER_ID,
      accessLicense: process.env.NAVER_AD_SEOLLEUNG_ACCESS_LICENSE,
      secretKey: process.env.NAVER_AD_SEOLLEUNG_SECRET_KEY,
    };

    if (
      !main.customerId ||
      !main.accessLicense ||
      !main.secretKey ||
      !seolleung.customerId ||
      !seolleung.accessLicense ||
      !seolleung.secretKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "네이버 광고 API 환경변수가 부족합니다.",
        },
        { status: 500 }
      );
    }

    const [mainResult, seolleungResult] =
      await Promise.all([
        getAccountStructure("main", main),
        getAccountStructure("seolleung", seolleung),
      ]);

    return NextResponse.json({
      ok: true,
      message: "두 네이버 광고계정 구조 조회 성공",
      accounts: [mainResult, seolleungResult],
    });
  } catch (error) {
    console.error("NAVER ADS STRUCTURE ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
