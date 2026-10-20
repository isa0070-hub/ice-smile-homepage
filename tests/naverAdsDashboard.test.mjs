import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  NAVER_AD_SCOPES,
  buildNaverAdScopeSummary,
  filterNaverAdRows,
} from "../src/lib/naverAdsDashboard.js";
import {
  V2_CAMPAIGN_ID,
} from "../src/lib/naverAdsReport.js";

function row(overrides = {}) {
  return {
    account: "main",
    branch: "shared",
    adType: "keyword",
    campaignId: V2_CAMPAIGN_ID,
    campaignName: "검색광고 V2",
    adgroupId: "grp-v2",
    adgroupName: "아이폰 일반수리",
    impressions: 100,
    clicks: 4,
    cost: 10_001,
    conversions: 2,
    avgCpc: 2_500,
    ...overrides,
  };
}

const rows = [
  row(),
  row({
    campaignId: "cmp-old",
    campaignName: "이전 캠페인",
    adgroupId: "grp-old",
    branch: "seolleung",
    impressions: 50,
    clicks: 2,
    cost: 5_000,
    conversions: 1,
  }),
  row({
    account: "seolleung",
    campaignId: "cmp-place",
    campaignName: "플레이스 캠페인",
    adgroupId: "grp-place",
    branch: "seolleung",
    adType: "place",
    impressions: 25,
    clicks: 1,
    cost: 1_999,
    conversions: 0,
  }),
  row({
    campaignId: "cmp-unknown",
    campaignName: "미분류 캠페인",
    adgroupId: "grp-unknown",
    branch: "unknown",
    adType: "other",
    impressions: 5,
    clicks: 0,
    cost: 900,
    conversions: 0,
  }),
];

test("V2 is the default and exact campaign-id scope", () => {
  assert.deepEqual(
    filterNaverAdRows(rows).map(
      (item) => item.adgroupId
    ),
    ["grp-v2"]
  );
});

test("other and all scopes reuse the same rows without overlap", () => {
  assert.deepEqual(
    filterNaverAdRows(
      rows,
      NAVER_AD_SCOPES.OTHER
    ).map((item) => item.adgroupId),
    ["grp-old", "grp-place", "grp-unknown"]
  );

  assert.equal(
    filterNaverAdRows(
      rows,
      NAVER_AD_SCOPES.ALL
    ).length,
    rows.length
  );
});

test("filtered totals and branch totals come from the same rows", () => {
  const summary = buildNaverAdScopeSummary(
    rows,
    NAVER_AD_SCOPES.OTHER
  );

  assert.deepEqual(summary.total, {
    impressions: 80,
    clicks: 3,
    cost: 7_899,
    conversions: 1,
    avgCpc: 2_633,
  });

  assert.deepEqual(
    summary.branches.seolleung.total,
    {
      impressions: 75,
      clicks: 3,
      cost: 6_999,
      conversions: 1,
      avgCpc: 2_333,
    }
  );

  assert.deepEqual(summary.unclassified, {
    impressions: 5,
    clicks: 0,
    cost: 900,
    conversions: 0,
    avgCpc: 0,
  });
});

test("average CPC is recomputed from total cost and clicks", () => {
  const summary = buildNaverAdScopeSummary(
    [
      row({ cost: 1_001, clicks: 1 }),
      row({
        adgroupId: "grp-v2-2",
        cost: 2_000,
        clicks: 2,
      }),
    ],
    NAVER_AD_SCOPES.V2
  );

  assert.equal(summary.total.cost, 3_001);
  assert.equal(summary.total.clicks, 3);
  assert.equal(summary.total.avgCpc, 1_000);
});

test("scope changes are client-only and do not fetch another report", async () => {
  const source = await readFile(
    new URL(
      "../src/components/NaverAdsScopeReport.jsx",
      import.meta.url
    ),
    "utf8"
  );

  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.match(
    source,
    /useState\(\s*NAVER_AD_SCOPES\.V2\s*\)/
  );
  assert.match(
    source,
    /buildNaverAdScopeSummary\(details, scope\)/
  );
});
