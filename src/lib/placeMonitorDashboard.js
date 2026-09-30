export const PLACE_MONITOR_GOOD_STATUSES = new Set([
  "VALID",
  "NOT_IN_OBSERVED_RANGE",
]);

const D3_WINDOW_END = "2026-09-29T13:45:30+09:00";

function timeValue(value) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function kstDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function buildPlaceMonitorDashboard(rows, now = new Date()) {
  const ordered = [...rows].sort(
    (a, b) => timeValue(b.measured_at) - timeValue(a.measured_at),
  );
  const bySensor = new Map();
  let lastSyncAt = null;

  for (const row of ordered) {
    if (!bySensor.has(row.sensor_id)) {
      bySensor.set(row.sensor_id, {
        sensor_id: row.sensor_id,
        last_attempt: row,
        last_successful: null,
        last_successful_is_today: false,
      });
    }
    const sensor = bySensor.get(row.sensor_id);
    if (!sensor.last_successful && PLACE_MONITOR_GOOD_STATUSES.has(row.measurement_status)) {
      sensor.last_successful = row;
      sensor.last_successful_is_today = kstDateKey(row.measured_at) === kstDateKey(now);
    }
    if (!lastSyncAt || timeValue(row.synced_at) > timeValue(lastSyncAt)) {
      lastSyncAt = row.synced_at;
    }
  }

  const d1Rows = ordered.filter(
    (row) => row.experiment_id === "SURFACE-PHOTO-001" && row.checkpoint === "D1",
  );
  const d3Rows = ordered.filter(
    (row) => row.experiment_id === "SURFACE-PHOTO-001" && row.checkpoint === "D3",
  );
  const hasUnknownLogin = d1Rows.some(
    (row) => row.search_conditions?.login_state === "UNKNOWN",
  );
  const hasPromptLocation = d1Rows.some(
    (row) => row.search_conditions?.location_permission === "PROMPT",
  );

  return {
    sensors: [...bySensor.values()].sort((a, b) =>
      a.sensor_id.localeCompare(b.sensor_id),
    ),
    last_sync_at: lastSyncAt,
    warnings: {
      d3_missing:
        now.getTime() > Date.parse(D3_WINDOW_END) && d3Rows.length === 0,
      d1_unknown_login: hasUnknownLogin,
      d1_location_prompt: hasPromptLocation,
      d1_context_mismatch: d1Rows.some((row) =>
        ["CONTEXT_CHANGED", "UI_CHANGED"].includes(row.measurement_status),
      ),
    },
    limits: {
      latest_rows_scanned: rows.length,
      latest_rows_cap: 50,
      history_rows_cap: 50,
    },
  };
}
