import assert from "node:assert/strict";
import test from "node:test";

import {
  UTM_ATTRIBUTION_SCOPES,
  V2_UTM_CAMPAIGN,
  buildUtmAttribution,
  filterUtmAttributionRows,
  getKstDateRange,
  summarizeUtmAttribution,
} from "../src/lib/utmAttribution.js";

function visit(id, overrides = {}) {
  return {
    id,
    clicked_at: "2026-10-21T01:31:00.000Z",
    traffic_source: "naver",
    traffic_medium: "cpc",
    campaign: V2_UTM_CAMPAIGN,
    query_params: {
      utm_source: "naver",
      utm_medium: "cpc",
      utm_campaign: V2_UTM_CAMPAIGN,
      utm_content: "general_iphone_basic",
    },
    ...overrides,
  };
}

test("KST date boundaries are exact and end-exclusive", () => {
  assert.deepEqual(
    getKstDateRange("2026-10-20", "2026-10-21"),
    {
      startIso: "2026-10-19T15:00:00.000Z",
      endExclusiveIso: "2026-10-21T15:00:00.000Z",
    }
  );
});

test("visits and action rows aggregate without join multiplication", () => {
  const rows = buildUtmAttribution(
    [
      visit("v1"),
      visit("v2", {
        clicked_at: "2026-10-21T02:45:00.000Z",
      }),
    ],
    [
      { visit_id: "v1", event_type: "phone_click" },
      { visit_id: "v1", event_type: "naver_talk_click" },
      { visit_id: "v2", event_type: "online_inquiry_click" },
      { visit_id: "v2", event_type: "phone_list_open" },
    ]
  );

  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    source: "naver",
    medium: "cpc",
    campaign: V2_UTM_CAMPAIGN,
    content: "general_iphone_basic",
    visits: 2,
    uniqueActionVisits: 2,
    lastVisitAt: "2026-10-21T02:45:00.000Z",
    actionEvents: 3,
    phoneClicks: 1,
    naverTalkClicks: 1,
    onlineInquiryClicks: 1,
    submittedLeads: 0,
  });
});

test("content variants and missing UTM remain separate visible rows", () => {
  const rows = buildUtmAttribution([
    visit("v1"),
    visit("v2", {
      query_params: {
        utm_content: "general_surface_basic",
      },
    }),
    visit("v3", {
      traffic_source: null,
      traffic_medium: null,
      campaign: null,
      query_params: {},
    }),
  ]);

  assert.equal(rows.length, 3);
  assert.equal(
    rows.some(
      (row) => row.content === "general_surface_basic"
    ),
    true
  );
  assert.equal(
    rows.some(
      (row) =>
        row.source === null &&
        row.medium === null &&
        row.campaign === null &&
        row.content === null
    ),
    true
  );
});

test("V2, other and all use exact campaign scope", () => {
  const rows = buildUtmAttribution([
    visit("v1"),
    visit("v2", { campaign: "legacy_campaign" }),
    visit("v3", { campaign: null, query_params: {} }),
  ]);

  assert.equal(filterUtmAttributionRows(rows).length, 1);
  assert.equal(
    filterUtmAttributionRows(
      rows,
      UTM_ATTRIBUTION_SCOPES.OTHER
    ).length,
    2
  );
  assert.equal(
    filterUtmAttributionRows(
      rows,
      UTM_ATTRIBUTION_SCOPES.ALL
    ).length,
    3
  );
});

test("summary keeps event rows and unique action visits distinct", () => {
  const rows = buildUtmAttribution(
    [visit("v1"), visit("v2")],
    [
      { visit_id: "v1", event_type: "phone_click" },
      { visit_id: "v1", event_type: "generate_lead" },
    ]
  );
  const summary = summarizeUtmAttribution(rows);

  assert.equal(summary.visits, 2);
  assert.equal(summary.actionEvents, 2);
  assert.equal(summary.uniqueActionVisits, 1);
  assert.equal(summary.submittedLeads, 1);
});
