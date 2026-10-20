import assert from "node:assert/strict";
import test from "node:test";

import {
  V2_CAMPAIGN_ID,
  V2_SHARED_ADGROUPS,
  classifyNaverAdgroup,
  combineNaverAdStats,
  sameNaverAdStat,
} from "../src/lib/naverAdsReport.js";

function group(overrides = {}) {
  return {
    id: "grp-test",
    name: "일반수리",
    campaignId: "cmp-test",
    campaignName: "테스트 캠페인",
    campaignType: "WEB_SITE",
    ...overrides,
  };
}

test("the five confirmed V2 general groups are shared keyword traffic", () => {
  for (const [id, name] of V2_SHARED_ADGROUPS) {
    assert.deepEqual(
      classifyNaverAdgroup(
        "main",
        group({
          id,
          name,
          campaignId: V2_CAMPAIGN_ID,
        })
      ),
      { branch: "shared", adType: "keyword" }
    );
  }
});

test("an identical group id outside the confirmed campaign is not force-mapped", () => {
  const [id, name] = V2_SHARED_ADGROUPS.entries().next().value;

  assert.deepEqual(
    classifyNaverAdgroup(
      "main",
      group({ id, name, campaignId: "cmp-other" })
    ),
    { branch: "unknown", adType: "other" }
  );
});

test("existing branch and place classifications remain intact", () => {
  assert.deepEqual(
    classifyNaverAdgroup(
      "main",
      group({ name: "강변 아이폰", campaignName: "파워링크" })
    ),
    { branch: "gangbyeon", adType: "keyword" }
  );
  assert.deepEqual(
    classifyNaverAdgroup(
      "main",
      group({ name: "선릉 서피스", campaignName: "파워링크" })
    ),
    { branch: "seolleung", adType: "keyword" }
  );
  assert.deepEqual(
    classifyNaverAdgroup(
      "seolleung",
      group({ campaignType: "PLACE" })
    ),
    { branch: "seolleung", adType: "place" }
  );
});

test("tracked and unclassified totals reconcile without hiding either side", () => {
  const tracked = {
    impressions: 127,
    clicks: 4,
    cost: 3_398,
    conversions: 0,
  };
  const unclassified = {
    impressions: 1_105,
    clicks: 8,
    cost: 21_271,
    conversions: 3,
  };
  const total = combineNaverAdStats(tracked, unclassified);

  assert.deepEqual(total, {
    impressions: 1_232,
    clicks: 12,
    cost: 24_669,
    conversions: 3,
    avgCpc: 2_056,
  });
  assert.equal(
    sameNaverAdStat(total, combineNaverAdStats(tracked, unclassified)),
    true
  );
});
