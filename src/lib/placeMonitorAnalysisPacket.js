const KST_TIME_ZONE = "Asia/Seoul";

const GOOD_STATUSES = new Set(["VALID", "NOT_IN_OBSERVED_RANGE"]);

const STATUS_LABELS = {
  VALID: "정상 측정",
  NOT_IN_OBSERVED_RANGE: "확인 범위 내 미발견",
  AUTO_PAN_DETECTED: "지도 자동 이동 감지",
  CONTEXT_CHANGED: "검색 조건 변경 감지",
  AMBIGUOUS_ENTITY: "업체 식별 확인 필요",
  UI_CHANGED: "검색 화면 변경 감지",
  CAPTCHA: "캡차 감지",
  LOGIN_BLOCK: "로그인 차단",
  MEASUREMENT_FAILED: "측정 실패",
  MANUAL_REVIEW_REQUIRED: "수동 확인 필요",
};

const SAFE_CONDITION_KEYS = [
  ["device_mode", "기기"],
  ["phase", "프로그램 단계"],
  ["login_state", "로그인"],
  ["location_permission", "위치권한"],
  ["intended_map_center_label", "지도 중심 식별자"],
  ["intended_map_center_tolerance_meters", "지도 중심 허용오차(m)"],
];

function timeValue(value) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? null : parsed;
}

function formatKst(value) {
  const parsed = timeValue(value);
  if (parsed === null) return "미수신";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: KST_TIME_ZONE,
    timeZoneName: "short",
  }).format(new Date(parsed));
}

function safeText(value, fallback = "미수신") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).replace(/[\r\n]+/gu, " ").trim() || fallback;
}

function safeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function safeErrorSummary(value) {
  const text = safeText(value, "");
  if (!text) return "";
  if (
    /(?:\/Users\/|[A-Za-z]:\\|https?:\/\/|token|cookie|secret|password|session)/iu.test(text)
  ) {
    return "상세 오류 내용 제외(상태 코드 참조)";
  }
  return text.slice(0, 160);
}

function rankText(item) {
  if (!item) return "판정 자료 없음";
  if (item.target_found === true && safeNumber(item.organic_rank) !== null) {
    return `${Number(item.organic_rank)}위`;
  }
  if (item.measurement_status === "NOT_IN_OBSERVED_RANGE") {
    const observed = safeNumber(item.observed_n);
    if (observed === 0) return "관측 자료 0건";
    return observed === null
      ? "실제 확인 범위 내 미발견(범위 미수신)"
      : `TOP ${observed} 내 미발견`;
  }
  return "판정 보류";
}

function discoveryText(item) {
  if (!item) return "확인 불가";
  if (
    item.measurement_status === "VALID" &&
    item.target_found === true &&
    safeNumber(item.organic_rank) !== null
  ) {
    return "발견";
  }
  if (
    item.measurement_status === "NOT_IN_OBSERVED_RANGE" &&
    safeNumber(item.observed_n) > 0
  ) {
    return "확인 범위 내 미발견";
  }
  return "확인 불가";
}

function syncDelayText(measuredAt, syncedAt) {
  const measured = timeValue(measuredAt);
  const synced = timeValue(syncedAt);
  if (measured === null || synced === null || synced < measured) return "미수신";
  const totalSeconds = Math.round((synced - measured) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes ? `${minutes}분 ${seconds}초` : `${seconds}초`;
}

function observationKind(item) {
  const checkpoint = safeText(item?.checkpoint, "");
  if (!checkpoint) return "일반 측정(세부 종류 미수신)";
  if (checkpoint.startsWith("CAL-")) return `추가관측·판독 교정 (${checkpoint})`;
  if (["D1", "D3", "D4", "D7"].includes(checkpoint)) {
    return `공식 체크포인트 (${checkpoint})`;
  }
  return `관측 (${checkpoint})`;
}

function safeConditions(item) {
  const conditions = item?.search_conditions;
  if (!conditions || typeof conditions !== "object" || Array.isArray(conditions)) {
    return "미수신";
  }
  const parts = SAFE_CONDITION_KEYS.flatMap(([key, label]) => {
    const value = conditions[key];
    return value === null || value === undefined || value === ""
      ? []
      : [`${label}=${safeText(value)}`];
  });
  return parts.length ? parts.join(" | ") : "미수신";
}

function conditionIdentifier(item) {
  const conditions = item?.search_conditions;
  if (!conditions || typeof conditions !== "object" || Array.isArray(conditions)) {
    return "미수신";
  }
  const values = [
    item?.result_surface,
    conditions.device_mode,
    conditions.login_state,
    conditions.location_permission,
    conditions.intended_map_center_label,
  ].map((value) => safeText(value, "UNKNOWN"));
  return values.join(" / ");
}

function safeMeasurement(item) {
  if (!item || typeof item !== "object") return null;
  const measurementId = safeText(item.measurement_id, "");
  if (!measurementId.startsWith("mea_")) return null;
  return {
    measurement_id: measurementId,
    sensor_id: safeText(item.sensor_id),
    query: safeText(item.query),
    result_surface: safeText(item.result_surface),
    measured_at: safeText(item.measured_at, ""),
    synced_at: safeText(item.synced_at, ""),
    measurement_status: safeText(item.measurement_status),
    observed_n: safeNumber(item.observed_n),
    target_found: item.target_found === true,
    organic_rank: safeNumber(item.organic_rank),
    error_summary: safeErrorSummary(item.error_summary),
    checkpoint: safeText(item.checkpoint, ""),
    experiment_id: safeText(item.experiment_id, ""),
    source_version: safeText(item.source_version, ""),
    search_conditions:
      item.search_conditions && typeof item.search_conditions === "object"
        ? Object.fromEntries(
            SAFE_CONDITION_KEYS.flatMap(([key]) =>
              item.search_conditions[key] === undefined
                ? []
                : [[key, item.search_conditions[key]]],
            ),
          )
        : {},
  };
}

function safeScheduleTask(task) {
  if (!task || typeof task !== "object") return null;
  return {
    checkpoint: safeText(task.checkpoint),
    sensor_id: safeText(task.sensor_id),
    due_at: safeText(task.due_at, ""),
    window_start: safeText(task.window_start, ""),
    window_end: safeText(task.window_end, ""),
    status: safeText(task.status),
    measurement_id: safeText(task.measurement_id, ""),
    completed_at: safeText(task.completed_at, ""),
  };
}

function uniqueMeasurements(items) {
  const seen = new Set();
  return items.flatMap((item) => {
    const safe = safeMeasurement(item);
    if (!safe || seen.has(safe.measurement_id)) return [];
    seen.add(safe.measurement_id);
    return [safe];
  });
}

function newest(items) {
  return [...items].sort(
    (left, right) => (timeValue(right.measured_at) || 0) - (timeValue(left.measured_at) || 0),
  )[0] || null;
}

function oldest(items) {
  return [...items].sort(
    (left, right) => (timeValue(left.measured_at) || 0) - (timeValue(right.measured_at) || 0),
  )[0] || null;
}

function latestSensorSection(sensor) {
  const attempt = safeMeasurement(sensor?.last_attempt);
  const success = safeMeasurement(sensor?.last_successful);
  const lines = [
    `- 센서 ID: ${safeText(sensor?.sensor_id)}`,
    `  검색어: ${attempt?.query || success?.query || "미수신"}`,
    `  검색 화면: ${attempt?.result_surface || success?.result_surface || "미수신"}`,
  ];

  if (!attempt) {
    lines.push("  마지막 시도: 미수신", "  마지막 정상 측정: 미수신");
    return lines.join("\n");
  }

  lines.push(
    `  마지막 시도: ${formatKst(attempt.measured_at)} | ${STATUS_LABELS[attempt.measurement_status] || attempt.measurement_status}`,
    `  광고 제외 자연순위: ${rankText(attempt)}`,
    `  요청 범위: 미수신 | 실제 확인 범위: ${attempt.observed_n === null ? "미수신" : attempt.observed_n === 0 ? "관측 자료 0건" : `TOP ${attempt.observed_n}`}`,
    `  발견 상태: ${discoveryText(attempt)}`,
    `  원본 판독 상태: ${attempt.measurement_status}`,
    `  동기화 시각: ${formatKst(attempt.synced_at)} | 측정→동기화 간격: ${syncDelayText(attempt.measured_at, attempt.synced_at)}`,
    `  measurement ID: ${attempt.measurement_id}`,
    `  관측 종류: ${observationKind(attempt)}`,
    `  검색조건: ${safeConditions(attempt)}`,
    `  조건 식별자: ${conditionIdentifier(attempt)}`,
    `  판독기 버전: ${attempt.source_version || "미수신"}`,
  );
  if (attempt.error_summary) lines.push(`  안전한 오류 요약: ${attempt.error_summary}`);

  if (!success) {
    lines.push("  마지막 정상 측정: 없음");
  } else if (success.measurement_id === attempt.measurement_id) {
    lines.push("  마지막 정상 측정: 위 마지막 시도와 동일");
  } else {
    lines.push(
      `  마지막 정상 측정: ${formatKst(success.measured_at)} | ${rankText(success)} | ${STATUS_LABELS[success.measurement_status] || success.measurement_status} | ${success.measurement_id}`,
      "  비교 제한: 최근 시도와 마지막 정상 측정이 다르므로 최근 실패·보류를 정상 순위로 대체하지 않음",
    );
  }
  return lines.join("\n");
}

function historyChanges(history) {
  if (!history.length) return "- 사용자가 불러온 이력 없음: 최신 센서 요약 밖의 변화는 판단할 수 없음";
  const bySensor = new Map();
  for (const item of history) {
    if (!bySensor.has(item.sensor_id)) bySensor.set(item.sensor_id, []);
    bySensor.get(item.sensor_id).push(item);
  }
  return [...bySensor.entries()].map(([sensorId, items]) => {
    const ordered = [...items].sort(
      (left, right) => (timeValue(right.measured_at) || 0) - (timeValue(left.measured_at) || 0),
    );
    const current = ordered[0];
    const comparable = ordered.slice(1).find((candidate) =>
      GOOD_STATUSES.has(candidate.measurement_status) &&
      candidate.result_surface === current.result_surface &&
      conditionIdentifier(candidate) === conditionIdentifier(current),
    );
    if (!comparable || !GOOD_STATUSES.has(current.measurement_status)) {
      return `- ${sensorId}: 같은 검색조건의 비교 가능한 정상 결과를 확인할 수 없음`;
    }
    return `- ${sensorId}: ${formatKst(comparable.measured_at)} ${rankText(comparable)} → ${formatKst(current.measured_at)} ${rankText(current)} (같은 조건 식별자 범위에서만 비교)`;
  }).join("\n");
}

function experimentSection(items) {
  const experiments = new Map();
  for (const item of items) {
    if (!item.experiment_id) continue;
    if (!experiments.has(item.experiment_id)) experiments.set(item.experiment_id, []);
    experiments.get(item.experiment_id).push(item);
  }
  if (!experiments.size) {
    return "- 개선 이력 미연결: 화면 자료에 실험·변경 ID가 없음";
  }
  return [...experiments.entries()].map(([id, rows]) => {
    const sensors = [...new Set(rows.map((row) => row.sensor_id))].join(", ");
    const checkpoints = [...new Set(rows.map((row) => row.checkpoint || "미수신"))].join(", ");
    return [
      `- 실험·변경 ID: ${id}`,
      `  관측 단계: ${checkpoints}`,
      `  목표 센서: ${sensors}`,
      "  제안·승인·적용·공개 반영 확인: 미수신",
      "  실제 적용시각: 미수신",
      "  변경 중첩 여부: 미수신",
      "  검증 상태: 측정 자료만 수신됨; 개선 적용 완료를 뜻하지 않음",
    ].join("\n");
  }).join("\n");
}

function d3EvidenceSection(items) {
  const d3Rows = items.filter((item) => item.checkpoint === "D3");
  const latestD3 = newest(d3Rows);
  if (!latestD3) {
    return "- D3 상태: 수신 자료에서 D3 확인 불가. 센서별 요약과 사용자가 불러온 최대 50건만으로 전체 D3 누락을 확정하지 않음\n- D3 허용창·전체 작업 상태·동기화 지연: 미수신";
  }
  return [
    `- D3 상태: 수신 확인 / 측정 ${formatKst(latestD3.measured_at)} / 원본 상태 ${latestD3.measurement_status}`,
    `- D3 동기화: ${formatKst(latestD3.synced_at)} / 측정→동기화 간격 ${syncDelayText(latestD3.measured_at, latestD3.synced_at)}`,
    "- D3 허용창·전체 작업 상태: 미수신. 측정 후 늦게 동기화됐다는 이유만으로 누락 처리하지 않음",
  ].join("\n");
}

function automationSection({ sensors, lastSyncAt, observerStatus, copiedAt }) {
  const attempts = sensors.flatMap((sensor) => safeMeasurement(sensor.last_attempt) || []);
  const successes = sensors.flatMap((sensor) => safeMeasurement(sensor.last_successful) || []);
  const tasks = Array.isArray(observerStatus?.schedule_tasks)
    ? observerStatus.schedule_tasks.map(safeScheduleTask).filter(Boolean)
    : [];
  const copyTime = timeValue(copiedAt) || Date.now();
  const upcoming = [...tasks]
    .filter((task) => (timeValue(task.window_end) || 0) > copyTime && task.status !== "COMPLETED")
    .sort((left, right) => (timeValue(left.due_at) || 0) - (timeValue(right.due_at) || 0))[0];
  const failures = attempts.filter((item) => !GOOD_STATUSES.has(item.measurement_status));

  return [
    `- 마지막 측정 시도: ${formatKst(newest(attempts)?.measured_at)}`,
    `- 마지막 정상 측정: ${formatKst(newest(successes)?.measured_at)}`,
    `- 홈페이지 마지막 동기화: ${formatKst(lastSyncAt)}`,
    `- 관측기 상태 생성시각: ${formatKst(observerStatus?.generated_at)}`,
    `- 관측기 단계: ${safeText(observerStatus?.phase)}`,
    upcoming
      ? `- 관측기 보고 예정 작업: ${upcoming.checkpoint} / ${upcoming.sensor_id} / 예정 ${formatKst(upcoming.due_at)} / 허용창 ${formatKst(upcoming.window_start)} 이상~${formatKst(upcoming.window_end)} 미만 / 상태 ${upcoming.status}`
      : "- 관측기 보고 예정 작업: 화면 보유 자료에서 확인되지 않음",
    "- 실행 트리거 등록 확인: 미수신",
    `- 예정 작업 확인 기준시각: 관측기 상태 생성시각 ${formatKst(observerStatus?.generated_at)}`,
    failures.length
      ? `- 최신 오류·보류: ${failures.map((item) => `${item.sensor_id}=${item.measurement_status}`).join(", ")}`
      : "- 최신 오류·보류: 화면 보유 최신 시도에는 없음",
    "- 주의: 계획·등록·실행·저장은 별도 상태이며, 이 자료만으로 프로그램이 현재 실행 중이라고 단정하지 않음",
  ].join("\n");
}

export function createPlaceMonitorPacketSnapshot({
  dashboard = {},
  history = [],
  selectedSensorFilter = "",
  historyScope = "",
  question = "",
  copiedAt = new Date(),
} = {}) {
  const sensors = Array.isArray(dashboard.sensors)
    ? dashboard.sensors.map((sensor) => ({
        sensor_id: safeText(sensor.sensor_id),
        last_attempt: safeMeasurement(sensor.last_attempt),
        last_successful: safeMeasurement(sensor.last_successful),
      }))
    : [];
  const safeHistory = uniqueMeasurements(Array.isArray(history) ? history : []);
  const heldMeasurements = uniqueMeasurements([
    ...sensors.flatMap((sensor) => [sensor.last_attempt, sensor.last_successful]),
    ...safeHistory,
  ]);
  const observerStatus = dashboard.observer_status && typeof dashboard.observer_status === "object"
    ? {
        source_version: safeText(dashboard.observer_status.source_version, ""),
        generated_at: safeText(dashboard.observer_status.generated_at, ""),
        phase: safeText(dashboard.observer_status.phase, ""),
        schedule_tasks: Array.isArray(dashboard.observer_status.schedule_tasks)
          ? dashboard.observer_status.schedule_tasks.map(safeScheduleTask).filter(Boolean)
          : [],
      }
    : null;

  return {
    copied_at: new Date(copiedAt).toISOString(),
    question: safeText(question, ""),
    selected_sensor_filter: safeText(selectedSensorFilter, "전체 센서"),
    history_scope: safeText(historyScope, "이력 미조회"),
    sensors,
    history: safeHistory,
    held_measurements: heldMeasurements,
    last_sync_at: safeText(dashboard.last_sync_at, ""),
    limits: {
      latest_rows_scanned: safeNumber(dashboard.limits?.latest_rows_scanned),
      latest_rows_cap: safeNumber(dashboard.limits?.latest_rows_cap),
      history_rows_cap: safeNumber(dashboard.limits?.history_rows_cap),
    },
    observer_status: observerStatus,
    warnings: {
      d3_missing: dashboard.warnings?.d3_missing === true,
      d1_unknown_login: dashboard.warnings?.d1_unknown_login === true,
      d1_location_prompt: dashboard.warnings?.d1_location_prompt === true,
      d1_context_mismatch: dashboard.warnings?.d1_context_mismatch === true,
    },
  };
}

export function buildPlaceMonitorAnalysisPacket(input = {}) {
  const snapshot = input.held_measurements
    ? input
    : createPlaceMonitorPacketSnapshot(input);
  const held = snapshot.held_measurements || [];
  const history = snapshot.history || [];
  const earliest = oldest(held);
  const latest = newest(held);
  const latestCapReached =
    snapshot.limits.latest_rows_cap !== null &&
    snapshot.limits.latest_rows_scanned !== null &&
    snapshot.limits.latest_rows_scanned >= snapshot.limits.latest_rows_cap;
  const omission = latestCapReached
    ? `최신 조회가 ${snapshot.limits.latest_rows_cap}행 상한에 도달함. 그 밖의 생략 건수는 미확인`
    : "서버의 전체 보유 건수와 화면 밖 생략 건수는 미확인";
  const warningLines = [
    snapshot.warnings?.d1_unknown_login ? "D1 로그인 상태 UNKNOWN" : null,
    snapshot.warnings?.d1_location_prompt ? "D1 위치 권한 PROMPT" : null,
    snapshot.warnings?.d1_context_mismatch ? "D1 검색 컨텍스트 불일치" : null,
  ].filter(Boolean);

  const sensorSections = snapshot.sensors.length
    ? snapshot.sensors.map(latestSensorSection).join("\n\n")
    : "- 최신 센서 결과 미수신";

  const defaultRequest = `이 자료만으로 현재 상태를 설명하고,
프로그램 판독 문제와 실제 자연노출 문제를 분리해 분석해 주세요.

자연 상위노출, 지역 확대, 문의 연결을 위해
우선 진행할 작업을 최대 3개 제시해 주세요.

각 작업에는 근거, 필요한 추가 자료, 실제 변경안,
검증 방법, 기존 상위노출 보호, 무료 사용량 영향을 포함해 주세요.

채팅에서 할 수 있는 분석·문안 작업과
Work에서 프로그램으로 수행할 작업을 구분해 주세요.

측정 자료가 부족하면 무엇을 어떤 조건으로 추가 확보할지 제시하되,
같은 오류를 둔 무한 재측정이나 D7까지 무조건 대기를 권하지 마세요.

데이터에 없는 결과·적용 이력·정상 상태를 만들어내지 마세요.
변경 제안과 실제 승인·적용을 구분해 주세요.

상황 설명과 실행할 개선 작업까지 한 번에 이어 주세요.`;

  return `[i smile again 선릉 플레이스 자연순위 분석 패킷 / v1]

==============================
1. 분석 목적
==============================
- 자연순위 상위노출 개선
- 강남·서초·잠실·송파 등 지역 노출 확대
- 실제 수리 서비스와 문의·방문·접수 연결
- 측정만 반복하거나 D7까지 무조건 기다리는 방식이 아님
- 관측 → 판독 검증 → 개선안 → 승인된 반영 → 재관측으로 연결

==============================
2. 운영 원칙
==============================
- 사용량 증가로 인한 유료화 방지가 최우선
- 기존 상위노출 항목 보호
- 실제 순위 측정은 기존 프로그램으로만 수행
- Work 직접 검색으로 프로그램 결과를 대신하지 않음
- 공개 정보 변경은 구체적인 수정 전후와 승인 상태를 구분
- 이 전문을 붙여넣는 행위가 외부 변경·배포 승인은 아님

==============================
3. 자료 기준과 범위
==============================
- 복사 시각: ${formatKst(snapshot.copied_at)}
- 자료의 실제 측정시각: ${formatKst(earliest?.measured_at)} ~ ${formatKst(latest?.measured_at)}
- 홈페이지 마지막 동기화시각: ${formatKst(snapshot.last_sync_at)}
- 화면이 보유한 자료: 센서별 최신 요약 ${snapshot.sensors.length}개, 사용자가 불러온 이력 ${history.length}건, measurement ID 중복 제거 후 ${held.length}건
- 포함된 센서: ${snapshot.sensors.length ? snapshot.sensors.map((sensor) => sensor.sensor_id).join(", ") : "미수신"}
- 현재 선택된 센서 필터: ${snapshot.selected_sensor_filter || "전체 센서"}
- 사용자가 실제 불러온 이력 범위: ${snapshot.history_scope || "이력 미조회"}
- 최신 조회 내부 스캔: ${snapshot.limits.latest_rows_scanned ?? "미수신"}행 / 상한 ${snapshot.limits.latest_rows_cap ?? "미수신"}행
- 이력 조회 상한: ${snapshot.limits.history_rows_cap ?? "미수신"}행
- 생략·미수신 범위: ${omission}. 센서별 최신 요약은 전체 원본 행을 뜻하지 않음
- 중복 처리: 같은 measurement ID는 한 번만 집계

==============================
4. 최신 센서 결과
==============================
${sensorSections}

==============================
5. 이전 정상 결과와 비교 제한
==============================
${historyChanges(history)}
- 로그인·위치권한·지도 중심·기기·관측 범위가 다르거나 조건이 UNKNOWN이면 같은 조건의 연속 자료로 합산하지 않음
- 오류·미판독·관측 공백은 실제 순위 하락으로 해석하지 않음
- NULL·오류는 0위로 변환하지 않음

==============================
6. 실험·개선 이력
==============================
${experimentSection(held)}

==============================
7. 자동화·오류 상태
==============================
${automationSection({
    sensors: snapshot.sensors,
    lastSyncAt: snapshot.last_sync_at,
    observerStatus: snapshot.observer_status,
    copiedAt: snapshot.copied_at,
  })}
${d3EvidenceSection(held)}
- 관측 공백·비교 경고: ${warningLines.length ? warningLines.join(" | ") : "화면 보유 경고 없음"}

==============================
8. 해석 규칙
==============================
- AMBIGUOUS_ENTITY: 업체 식별이 불확실하므로 순위 판독 보류다. 미노출이나 순위 하락으로 판단하지 않는다.
- 측정 0건: 관측 자료가 없는 상태다. 실제 작업 상태와 허용창 근거가 확인된 경우 누락으로 구분하며, 순위 변화 없음으로 바꾸지 않는다.
- NOT_IN_OBSERVED_RANGE: 실제 확인 범위 안에서 대상을 찾지 못한 것이다. 전체 검색 미노출이나 정확한 범위 밖 순위로 해석하지 않는다.
- TOP8 내 미발견: 확인한 8개 안에서 미발견이다. TOP9까지 확인한 것으로 확대하지 않는다.
- COMPLETED: 작업 실행이 끝났다는 뜻이다. 판독 VALID나 순위 확정과 같은 의미가 아니다.
- 오류·차단·식별 불명·검색조건 변화는 실제 순위 하락을 입증하는 자료로 사용하지 않는다.
- 서로 다른 검색조건은 같은 조건의 연속 자료처럼 합산·비교하지 않는다. UNKNOWN 문자열이 같아도 동일 조건이 확인된 것은 아니다.
- 재판독은 기존 증거를 다시 해석한 것이며 새로운 시점의 실측이 아니다.
- 변경 중첩 기간의 결과를 하나의 변경만의 효과로 확정하지 않는다.
- 플레이스광고·파워링크·블로그·웹문서 순위를 플레이스 자연순위와 혼합하지 않는다.

==============================
9. GPT 분석 요청
==============================
${defaultRequest}

==============================
10. 이번에 궁금한 점
==============================
${snapshot.question || "별도 우선 질문 없음. 위 기본 분석 요청을 그대로 수행해 주세요."}`;
}

export async function writePacketToClipboard(text, clipboard) {
  if (!clipboard || typeof clipboard.writeText !== "function") {
    throw new Error("CLIPBOARD_UNAVAILABLE");
  }
  await clipboard.writeText(text);
}
