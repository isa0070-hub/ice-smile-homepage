import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizePlaceMonitorBatch,
  normalizePlaceMonitorItem,
  normalizePlaceMonitorSyncPayload,
} from "../src/lib/placeMonitorContract.js";

function validItem() {
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
    checkpoint: "D1",
    experiment_id: "SURFACE-PHOTO-001",
    source_version: "0.13.0",
    search_conditions: { device_mode: "desktop" },
  };
}

test("valid local summary is normalized for the append-only cloud table", () => {
  const result = normalizePlaceMonitorItem(validItem());
  assert.equal(result.measurement_id, "mea_0123456789abcdef");
  assert.equal(result.measured_at, "2026-09-27T02:33:00.000Z");
  assert.equal(result.organic_rank, 2);
});

test("rank and target-found state must agree", () => {
  const item = validItem();
  item.target_found = false;
  assert.equal(normalizePlaceMonitorItem(item), null);
});

test("batch size is capped to keep requests under the usage budget", () => {
  assert.equal(normalizePlaceMonitorBatch({ items: [] }), null);
  assert.equal(
    normalizePlaceMonitorBatch({ items: Array.from({ length: 26 }, validItem) }),
    null,
  );
  assert.equal(normalizePlaceMonitorBatch({ items: [validItem()] }).length, 1);
});

test("large or unexpected search-condition payloads are rejected", () => {
  const item = validItem();
  item.search_conditions = { unexpected: "x".repeat(2_100) };
  assert.equal(normalizePlaceMonitorItem(item), null);
});

test("the explicitly named D4 additional observation is accepted", () => {
  const item = validItem();
  item.checkpoint = "D4";
  assert.equal(normalizePlaceMonitorItem(item)?.checkpoint, "D4");
});

test("status-only sync accepts five D4 reservations", () => {
  const tasks = Array.from({ length: 5 }, (_, index) => ({
    task_key: `SURFACE-PHOTO-001:D4:sensor-${index}`,
    checkpoint: "D4",
    sensor_id: `sensor-${index}`,
    due_at: "2026-09-30T11:00:00+09:00",
    window_start: "2026-09-30T11:00:00+09:00",
    window_end: "2026-09-30T12:00:00+09:00",
    status: "PENDING",
    measurement_id: null,
    completed_at: null,
  }));
  const result = normalizePlaceMonitorSyncPayload({
    items: [],
    observer_status: {
      source_id: "seolleung-place-observer-v13",
      source_version: "0.13.0",
      generated_at: "2026-09-30T09:00:00+09:00",
      phase: "AUTO_OBSERVATION_ENABLED",
      schedule_tasks: tasks,
    },
  });
  assert.equal(result.items.length, 0);
  assert.equal(result.observerStatus.schedule_tasks.length, 5);
});
