import {
  getOpenAiAdsClickReference,
  isSeolleungSurfaceInquiry,
} from "./openAiAdsClick.js";

const WEB_SOURCE =
  "https://www.ismileagain.co.kr/contact?branch=seolleung&device=surface";

export function createOpenAiAdsLead(body, inquiry, submissionToken) {
  if (
    body.ads_measurement_consent !== true ||
    !isSeolleungSurfaceInquiry(inquiry.preferred_branch, inquiry.device)
  ) {
    return null;
  }

  const clickReference = getOpenAiAdsClickReference(body.openai_ads_oppref);
  if (!clickReference) return null;

  return {
    id: `seolleung-surface-lead-${submissionToken}`,
    type: "lead_created",
    timestamp_ms: Date.now(),
    oppref: clickReference,
    source_url: WEB_SOURCE,
    action_source: "web",
    opt_out: true,
    data: { type: "customer_action" },
  };
}

export async function sendOpenAiAdsLead(event) {
  const pixelId = process.env.NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID;
  const apiKey = process.env.OPENAI_ADS_CONVERSIONS_API_KEY;
  if (!pixelId || !apiKey) return;

  const url = new URL("https://bzr.openai.com/v1/events");
  url.searchParams.set("pid", pixelId);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        validate_only: process.env.OPENAI_ADS_CONVERSIONS_VALIDATE_ONLY === "1",
        events: [event],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });

    if (!response.ok) {
      console.warn("OpenAI Ads lead event was rejected:", response.status);
    }
  } catch {
    console.warn("OpenAI Ads lead event could not be delivered.");
  }
}
