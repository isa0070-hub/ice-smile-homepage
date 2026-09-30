import "server-only";

import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildPlaceMonitorDashboard } from "@/lib/placeMonitorDashboard";

export class PlaceMonitorStoreError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = "PlaceMonitorStoreError";
    this.status = status;
  }
}
const SELECT_FIELDS = [
  "measurement_id",
  "sensor_id",
  "query",
  "result_surface",
  "measured_at",
  "measurement_status",
  "observed_n",
  "target_found",
  "organic_rank",
  "error_summary",
  "checkpoint",
  "experiment_id",
  "source_version",
  "search_conditions",
  "synced_at",
].join(",");

const DASHBOARD_ROWS_CAP = 50;
const HISTORY_ROWS_CAP = 50;

function localFixturePath() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.PLACE_MONITOR_LOCAL_FIXTURE !== "1"
  ) {
    return null;
  }
  return path.join(process.cwd(), "work", "place-monitor-preview.json");
}

async function readLocalFixture() {
  const fixturePath = localFixturePath();
  if (!fixturePath) return null;
  try {
    const parsed = JSON.parse(await readFile(fixturePath, "utf8"));
    if (Array.isArray(parsed)) {
      return { rows: parsed, lastSyncAt: null, observerStatus: null };
    }
    return {
      rows: Array.isArray(parsed?.measurements) ? parsed.measurements : [],
      lastSyncAt: parsed?.last_sync_at || null,
      observerStatus: parsed?.observer_status || null,
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { rows: [], lastSyncAt: null, observerStatus: null };
    }
    throw error;
  }
}

async function writeLocalFixture(value) {
  const fixturePath = localFixturePath();
  if (!fixturePath) return false;
  const temporary = `${fixturePath}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporary, fixturePath);
  return true;
}

function throwStoreError(error, fallback) {
  console.error(fallback, error?.code || error?.message || error);
  throw new PlaceMonitorStoreError(fallback, 500);
}

export async function storePlaceMonitorPayload(items, observerStatus) {
  const localRows = await readLocalFixture();
  if (localRows) {
    const existing = new Set(localRows.rows.map((item) => item.measurement_id));
    const now = new Date().toISOString();
    const newRows = items
      .filter((item) => !existing.has(item.measurement_id))
      .map((item) => ({ ...item, synced_at: now, created_at: now }));
    await writeLocalFixture({
      measurements: [...localRows.rows, ...newRows],
      last_sync_at: now,
      observer_status: observerStatus,
    });
    return { stored: newRows.length, accepted: items.length };
  }

  let data = [];
  let error = null;
  if (items.length > 0) {
    const result = await supabaseAdmin
      .from("place_monitor_measurements")
      .upsert(items, {
        onConflict: "measurement_id",
        ignoreDuplicates: true,
      })
      .select("measurement_id");
    data = result.data || [];
    error = result.error;
  }

  if (error) {
    throwStoreError(error, "순위 측정 결과를 저장하지 못했습니다.");
  }

  const { error: observerStatusError } = await supabaseAdmin
    .from("place_monitor_observer_status")
    .upsert({
      ...observerStatus,
      synced_at: new Date().toISOString(),
    }, { onConflict: "source_id" });

  if (observerStatusError) {
    throwStoreError(observerStatusError, "관측기 예약 상태를 기록하지 못했습니다.");
  }

  const lastSyncAt = new Date().toISOString();
  const { error: syncStatusError } = await supabaseAdmin
    .from("place_monitor_sync_status")
    .upsert({
      source_id: "seolleung-place-observer-v13",
      last_sync_at: lastSyncAt,
      accepted_count: items.length,
      stored_count: data.length,
    }, { onConflict: "source_id" });

  if (syncStatusError) {
    throwStoreError(syncStatusError, "동기화 상태를 기록하지 못했습니다.");
  }

  return { stored: data.length, accepted: items.length };
}

export async function getPlaceMonitorDashboard() {
  const localRows = await readLocalFixture();
  if (localRows) {
    const dashboard = buildPlaceMonitorDashboard(
      localRows.rows.slice(-DASHBOARD_ROWS_CAP),
    );
    dashboard.last_sync_at = localRows.lastSyncAt;
    dashboard.observer_status = localRows.observerStatus;
    return dashboard;
  }

  const [measurementsResult, syncStatusResult, observerStatusResult] = await Promise.all([
    supabaseAdmin
      .from("place_monitor_measurements")
      .select(SELECT_FIELDS)
      .order("measured_at", { ascending: false })
      .limit(DASHBOARD_ROWS_CAP),
    supabaseAdmin
      .from("place_monitor_sync_status")
      .select("last_sync_at")
      .eq("source_id", "seolleung-place-observer-v13")
      .maybeSingle(),
    supabaseAdmin
      .from("place_monitor_observer_status")
      .select("source_id,source_version,generated_at,phase,schedule_tasks,synced_at")
      .eq("source_id", "seolleung-place-observer-v13")
      .maybeSingle(),
  ]);

  const { data, error } = measurementsResult;

  if (error) {
    throwStoreError(error, "최신 순위 측정 결과를 불러오지 못했습니다.");
  }

  if (syncStatusResult.error) {
    throwStoreError(syncStatusResult.error, "동기화 상태를 불러오지 못했습니다.");
  }
  if (observerStatusResult.error) {
    throwStoreError(observerStatusResult.error, "관측기 예약 상태를 불러오지 못했습니다.");
  }

  const dashboard = buildPlaceMonitorDashboard(data || []);
  dashboard.last_sync_at = syncStatusResult.data?.last_sync_at || null;
  dashboard.observer_status = observerStatusResult.data || null;
  return dashboard;
}

export async function getPlaceMonitorHistory({
  sensorId,
  before,
  from,
  to,
  limit,
}) {
  const safeLimit = Math.min(limit, HISTORY_ROWS_CAP);
  const localRows = await readLocalFixture();
  if (localRows) {
    return localRows.rows
      .filter((item) => !sensorId || item.sensor_id === sensorId)
      .filter((item) => !before || timeBefore(item.measured_at, before))
      .filter((item) => !from || !timeBefore(item.measured_at, from))
      .filter((item) => !to || !timeBefore(to, item.measured_at))
      .sort((a, b) => Date.parse(b.measured_at) - Date.parse(a.measured_at))
      .slice(0, safeLimit);
  }

  let query = supabaseAdmin
    .from("place_monitor_measurements")
    .select(SELECT_FIELDS)
    .order("measured_at", { ascending: false })
    .limit(safeLimit);

  if (sensorId) query = query.eq("sensor_id", sensorId);
  if (before) query = query.lt("measured_at", before);
  if (from) query = query.gte("measured_at", from);
  if (to) query = query.lte("measured_at", to);

  const { data, error } = await query;

  if (error) {
    throwStoreError(error, "과거 순위 측정 결과를 불러오지 못했습니다.");
  }

  return data || [];
}

function timeBefore(left, right) {
  return Date.parse(left) < Date.parse(right);
}
