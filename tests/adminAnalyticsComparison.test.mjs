import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdTrafficComparison,
  getKstPeriodRange,
} from "../src/lib/adminAnalyticsComparison.js";

test("yesterday uses one complete KST calendar day", () => {
  const range = getKstPeriodRange(
    "yesterday",
    new Date("2026-10-20T07:00:00.000Z")
  );

  assert.equal(
    range.start.toISOString(),
    "2026-10-18T15:00:00.000Z"
  );
  assert.equal(
    range.end.toISOString(),
    "2026-10-19T14:59:59.999Z"
  );
  assert.equal(range.label, "전일");
});

test("GA4 paid sessions and website visits remain separate values", () => {
  const result = buildAdTrafficComparison({
    ga4PaidSessions: 0,
    ga4PeriodKey: "yesterday",
    websiteAnalysis: {
      periodKey: "yesterday",
      visits: Array.from({ length: 9 }, (_, id) => ({ id })),
      duplicateVisitCount: 2,
    },
    websiteError: null,
  });

  assert.equal(result.ga4PaidSessions, 0);
  assert.equal(result.ga4Available, true);
  assert.equal(result.websiteAdVisits, 9);
  assert.equal(result.duplicateVisitCount, 2);
  assert.equal(result.samePeriod, true);
  assert.equal(result.showAttributionWarning, true);
  assert.equal("combinedTotal" in result, false);
});

test("website visits are unknown when their source cannot be read", () => {
  const result = buildAdTrafficComparison({
    ga4PaidSessions: 4,
    ga4PeriodKey: "7d",
    websiteAnalysis: null,
    websiteError: new Error("unavailable"),
  });

  assert.equal(result.websiteAvailable, false);
  assert.equal(result.websiteAdVisits, null);
  assert.equal(result.duplicateVisitCount, null);
  assert.equal(result.samePeriod, false);
  assert.equal(result.showAttributionWarning, false);
});

test("missing source fields stay unknown instead of becoming zero", () => {
  const result = buildAdTrafficComparison({
    ga4PaidSessions: undefined,
    ga4PeriodKey: "7d",
    websiteAnalysis: {
      periodKey: "7d",
      duplicateVisitCount: 0,
    },
    websiteError: null,
  });

  assert.equal(result.ga4Available, false);
  assert.equal(result.ga4PaidSessions, null);
  assert.equal(result.websiteAvailable, false);
  assert.equal(result.websiteAdVisits, null);
  assert.equal(result.showAttributionWarning, false);
});

test("a period mismatch is shown instead of silently comparing values", () => {
  const result = buildAdTrafficComparison({
    ga4PaidSessions: 3,
    ga4PeriodKey: "7d",
    websiteAnalysis: {
      periodKey: "30d",
      visits: [],
      duplicateVisitCount: 0,
    },
    websiteError: null,
  });

  assert.equal(result.samePeriod, false);
});
