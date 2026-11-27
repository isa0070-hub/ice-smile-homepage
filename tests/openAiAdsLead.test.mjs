import assert from "node:assert/strict";
import test from "node:test";

import {
  getOpenAiAdsClickReference,
  isSeolleungSurfaceInquiry,
} from "../src/lib/openAiAdsClick.js";
import {
  createOpenAiAdsLead,
  sendOpenAiAdsLead,
} from "../src/lib/openAiAdsLead.js";

const reference = "gAAAAA_example-signed_ref=";
const token = "9b5aef7b-c0a3-4fb9-9394-f1f0f975bee2";
const inquiry = {
  preferred_branch: "선릉점",
  device: "서피스",
  customer_name: "test customer",
  phone: "010-0000-0000",
  symptom: "Private test symptom",
};

test("ad click references are handled without rewriting or passing previews", () => {
  assert.equal(getOpenAiAdsClickReference(reference), reference);
  assert.equal(getOpenAiAdsClickReference("preview_mock"), "");
  assert.equal(getOpenAiAdsClickReference("ref\n"), "");
  assert.equal(getOpenAiAdsClickReference("r".repeat(513)), "");
});

test("a customer can fill in a Surface model without disabling measurement", () => {
  assert.equal(isSeolleungSurfaceInquiry("선릉점", "Surface Pro 8"), true);
  assert.equal(isSeolleungSurfaceInquiry("선릉점", "서피스북2"), true);
});

test("no ad measurement without consent, an ad reference, and the relevant repair", () => {
  const consent = { ads_measurement_consent: true, openai_ads_oppref: reference };
  assert.equal(createOpenAiAdsLead({}, inquiry, token), null);
  assert.equal(
    createOpenAiAdsLead({ ads_measurement_consent: true }, inquiry, token),
    null,
  );
  assert.equal(
    createOpenAiAdsLead(consent, { ...inquiry, preferred_branch: "강변점" }, token),
    null,
  );
  assert.equal(
    createOpenAiAdsLead(consent, { ...inquiry, device: "레노버" }, token),
    null,
  );
});

test("CAPI sends only the consented conversion with a stable event ID", async (t) => {
  const env = {
    NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID: "test-pixel",
    OPENAI_ADS_CONVERSIONS_API_KEY: "test-key",
    OPENAI_ADS_CONVERSIONS_VALIDATE_ONLY: "1",
  };
  for (const [name, value] of Object.entries(env)) {
    const original = process.env[name];
    process.env[name] = value;
    t.after(() => {
      if (original === undefined) delete process.env[name];
      else process.env[name] = original;
    });
  }

  const fakeFetch = t.mock.method(globalThis, "fetch", async () => ({ ok: true }));
  const event = createOpenAiAdsLead(
    { ads_measurement_consent: true, openai_ads_oppref: reference },
    inquiry,
    token,
  );
  await sendOpenAiAdsLead(event);

  assert.equal(fakeFetch.mock.callCount(), 1);
  const [url, request] = fakeFetch.mock.calls[0].arguments;
  assert.equal(String(url), "https://bzr.openai.com/v1/events?pid=test-pixel");
  assert.deepEqual(JSON.parse(request.body), {
    validate_only: true,
    events: [{
      id: `seolleung-surface-lead-${token}`,
      type: "lead_created",
      timestamp_ms: event.timestamp_ms,
      oppref: reference,
      source_url: "https://www.ismileagain.co.kr/contact?branch=seolleung&device=surface",
      action_source: "web",
      opt_out: true,
      data: { type: "customer_action" },
    }],
  });
});
