export const PLACE_MONITOR_STATUSES = new Set([
  "VALID",
  "NOT_IN_OBSERVED_RANGE",
  "AUTO_PAN_DETECTED",
  "CONTEXT_CHANGED",
  "AMBIGUOUS_ENTITY",
  "UI_CHANGED",
  "CAPTCHA",
  "LOGIN_BLOCK",
  "MEASUREMENT_FAILED",
  "MANUAL_REVIEW_REQUIRED",
]);

const MEASUREMENT_ID_PATTERN = /^mea_[a-f0-9]{16,64}$/u;
const SENSOR_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/u;
const CHECKPOINTS = new Set(["D1", "D3", "D4", "D7"]);
const CALIBRATION_CHECKPOINT_PATTERN = /^CAL-\d{8}-\d{4}$/u;
const SCHEDULE_STATUSES = new Set(["PENDING", "RUNNING", "COMPLETED", "FAILED"]);
const MAX_CONDITIONS_BYTES = 2_048;
const MAX_OBSERVER_STATUS_BYTES = 12_000;

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) === Object.prototype,
  );
}
function optionalText(value, maxLength) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > maxLength) return undefined;
  return value;
}

function isIsoDate(value) {
  return (
    typeof value === "string" &&
    value.length <= 40 &&
    !Number.isNaN(Date.parse(value))
  );
}

function isAllowedCheckpoint(value) {
  return CHECKPOINTS.has(value) || CALIBRATION_CHECKPOINT_PATTERN.test(value);
}

export function normalizePlaceMonitorItem(value) {
  if (!isPlainObject(value)) return null;

  const measurementId = value.measurement_id;
  const sensorId = value.sensor_id;
  const query = value.query;
  const resultSurface = value.result_surface;
  const measuredAt = value.measured_at;
  const measurementStatus = value.measurement_status;
  const observedN = value.observed_n;
  const targetFound = value.target_found;
  const organicRank = value.organic_rank;
  const errorSummary = optionalText(value.error_summary, 300);
  const checkpoint = optionalText(value.checkpoint, 24);
  const experimentId = optionalText(value.experiment_id, 80);
  const sourceVersion = optionalText(value.source_version, 32);
  const searchConditions = value.search_conditions ?? {};

  if (
    typeof measurementId !== "string" ||
    !MEASUREMENT_ID_PATTERN.test(measurementId) ||
    typeof sensorId !== "string" ||
    !SENSOR_ID_PATTERN.test(sensorId) ||
    typeof query !== "string" ||
    query.length === 0 ||
    query.length > 120 ||
    typeof resultSurface !== "string" ||
    resultSurface.length === 0 ||
    resultSurface.length > 64 ||
    !isIsoDate(measuredAt) ||
    !PLACE_MONITOR_STATUSES.has(measurementStatus) ||
    !Number.isInteger(observedN) ||
    observedN < 0 ||
    observedN > 100 ||
    typeof targetFound !== "boolean" ||
    (organicRank !== null &&
      (!Number.isInteger(organicRank) || organicRank < 1 || organicRank > 100)) ||
    (targetFound && organicRank === null) ||
    (!targetFound && organicRank !== null) ||
    errorSummary === undefined ||
    checkpoint === undefined ||
    (checkpoint !== null && !isAllowedCheckpoint(checkpoint)) ||
    experimentId === undefined ||
    sourceVersion === undefined ||
    !isPlainObject(searchConditions) ||
    Buffer.byteLength(JSON.stringify(searchConditions), "utf8") >
      MAX_CONDITIONS_BYTES
  ) {
    return null;
  }

  return {
    measurement_id: measurementId,
    sensor_id: sensorId,
    query,
    result_surface: resultSurface,
    measured_at: new Date(measuredAt).toISOString(),
    measurement_status: measurementStatus,
    observed_n: observedN,
    target_found: targetFound,
    organic_rank: organicRank,
    error_summary: errorSummary,
    checkpoint,
    experiment_id: experimentId,
    source_version: sourceVersion,
    search_conditions: searchConditions,
  };
}

export function normalizePlaceMonitorBatch(value) {
  if (!isPlainObject(value) || !Array.isArray(value.items)) return null;
  if (value.items.length === 0 || value.items.length > 25) return null;

  const items = value.items.map(normalizePlaceMonitorItem);
  return items.every(Boolean) ? items : null;
}

export function normalizePlaceMonitorObserverStatus(value) {
  if (!isPlainObject(value)) return null;
  const sourceId = value.source_id;
  const sourceVersion = optionalText(value.source_version, 32);
  const generatedAt = value.generated_at;
  const phase = optionalText(value.phase, 64);
  const tasks = value.schedule_tasks;

  if (
    sourceId !== "seolleung-place-observer-v13" ||
    sourceVersion === undefined ||
    !isIsoDate(generatedAt) ||
    phase === undefined ||
    !Array.isArray(tasks) ||
    tasks.length > 25 ||
    Buffer.byteLength(JSON.stringify(value), "utf8") > MAX_OBSERVER_STATUS_BYTES
  ) return null;

  const normalizedTasks = tasks.map((task) => {
    if (!isPlainObject(task)) return null;
    const checkpoint = optionalText(task.checkpoint, 24);
    const measurementId = optionalText(task.measurement_id, 80);
    const completedAt = task.completed_at || null;
    if (
      typeof task.task_key !== "string" ||
      task.task_key.length > 160 ||
      checkpoint === null ||
      checkpoint === undefined ||
      !isAllowedCheckpoint(checkpoint) ||
      typeof task.sensor_id !== "string" ||
      !SENSOR_ID_PATTERN.test(task.sensor_id) ||
      !isIsoDate(task.due_at) ||
      !isIsoDate(task.window_start) ||
      !isIsoDate(task.window_end) ||
      !SCHEDULE_STATUSES.has(task.status) ||
      measurementId === undefined ||
      (completedAt !== null && !isIsoDate(completedAt))
    ) return null;
    return {
      task_key: task.task_key,
      checkpoint,
      sensor_id: task.sensor_id,
      due_at: new Date(task.due_at).toISOString(),
      window_start: new Date(task.window_start).toISOString(),
      window_end: new Date(task.window_end).toISOString(),
      status: task.status,
      measurement_id: measurementId,
      completed_at: completedAt ? new Date(completedAt).toISOString() : null,
    };
  });
  if (!normalizedTasks.every(Boolean)) return null;
  return {
    source_id: sourceId,
    source_version: sourceVersion,
    generated_at: new Date(generatedAt).toISOString(),
    phase,
    schedule_tasks: normalizedTasks,
  };
}

export function normalizePlaceMonitorSyncPayload(value) {
  if (!isPlainObject(value) || !Array.isArray(value.items)) return null;
  if (value.items.length > 25) return null;
  const items = value.items.map(normalizePlaceMonitorItem);
  const observerStatus = normalizePlaceMonitorObserverStatus(value.observer_status);
  if (!items.every(Boolean) || !observerStatus) return null;
  return { items, observerStatus };
}
