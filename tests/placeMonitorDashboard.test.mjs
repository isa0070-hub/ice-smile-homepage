import assert from "node:assert/strict";
import test from "node:test";

import { buildPlaceMonitorDashboard } from "../src/lib/placeMonitorDashboard.js";

function row(overrides = {}) {
  return {
    measurement_id: "mea_0123456789abcdef",
    sensor_id: "unified-iphone",
    query: "선릉 아이폰수리",
    result_surface: "unified_search_place",
    measured_at: "2026-09-27T11:33:00+09:00",
    measurement_status: "VALID",
    observed_n: 5,
    target_found: true,
    organic_rank: 2,
    error_summary: null,
    checkpoint: null,
    experiment_id: null,
    source_version: "0.13.0",
    search_conditions: {},
    synced_at: "2026-09-30T09:00:00+09:00",
    ...overrides,
  };
}

test("failed latest attempt is separate from a stale successful measurement", () => {
  const dashboard = buildPlaceMonitorDashboard([
    row(),
    row({
      measurement_id: "mea_1111111111111111",
      measured_at: "2026-09-30T10:00:00+09:00",
      measurement_status: "MEASUREMENT_FAILED",
      target_found: false,
      organic_rank: null,
      error_summary: "browser unavailable",
    }),
  ], new Date("2026-09-30T11:00:00+09:00"));

  assert.equal(dashboard.sensors[0].last_attempt.measurement_status, "MEASUREMENT_FAILED");
  assert.equal(dashboard.sensors[0].last_successful.measurement_status, "VALID");
  assert.equal(dashboard.sensors[0].last_successful_is_today, false);
});

test("D3 absence and D1 UNKNOWN/PROMPT limitations are explicit", () => {
  const dashboard = buildPlaceMonitorDashboard([
    row({
      checkpoint: "D1",
      experiment_id: "SURFACE-PHOTO-001",
      measurement_status: "UI_CHANGED",
      target_found: false,
      organic_rank: null,
      search_conditions: {
        login_state: "UNKNOWN",
        location_permission: "PROMPT",
      },
    }),
  ], new Date("2026-09-30T11:00:00+09:00"));

  assert.equal(dashboard.warnings.d3_missing, true);
  assert.equal(dashboard.warnings.d1_unknown_login, true);
  assert.equal(dashboard.warnings.d1_location_prompt, true);
  assert.equal(dashboard.warnings.d1_context_mismatch, true);
});

test("dashboard response stays compact at its 50-row query cap", () => {
  const rows = Array.from({ length: 50 }, (_, index) => row({
    measurement_id: `mea_${index.toString(16).padStart(16, "0")}`,
    sensor_id: `sensor-${index % 5}`,
    error_summary: "x".repeat(300),
  }));
  const dashboard = buildPlaceMonitorDashboard(rows, new Date("2026-09-30T11:00:00+09:00"));
  assert.ok(Buffer.byteLength(JSON.stringify(dashboard), "utf8") < 25_000);
});
