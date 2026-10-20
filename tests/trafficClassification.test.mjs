import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyPaidPortal,
  classifyPortal,
  isOrganicTraffic,
  isPaidTraffic,
} from "../src/lib/trafficClassification.js";

test("naver cpc is paid Naver traffic without a powerlink campaign name", () => {
  assert.equal(isPaidTraffic("Paid Search", "cpc"), true);
  assert.equal(
    classifyPaidPortal({
      source: "naver",
      medium: "cpc",
      campaign: "renamed-v2-campaign",
    }),
    "naver"
  );
  assert.equal(
    classifyPaidPortal({ source: "search.naver.com", medium: "ppc" }),
    "naver"
  );
});

test("organic Naver traffic remains organic and is not paid", () => {
  assert.equal(isOrganicTraffic("Organic Search", "organic"), true);
  assert.equal(isPaidTraffic("Organic Search", "organic"), false);
  assert.equal(classifyPortal("m.search.naver.com"), "naver");
  assert.equal(
    classifyPaidPortal({
      source: "naver",
      channel: "Organic Search",
      medium: "organic",
    }),
    "other"
  );
});

test("Google Paid Search and unrelated sources keep their prior buckets", () => {
  assert.equal(
    classifyPaidPortal({
      source: "google",
      channel: "Paid Search",
      medium: "cpc",
    }),
    "google"
  );
  assert.equal(
    classifyPaidPortal({
      source: "bing",
      channel: "Paid Search",
      medium: "cpc",
    }),
    "other"
  );
  assert.equal(classifyPortal("daum"), "other");
});
