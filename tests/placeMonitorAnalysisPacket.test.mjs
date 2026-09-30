import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildPlaceMonitorAnalysisPacket,
  createPlaceMonitorPacketSnapshot,
  writePacketToClipboard,
} from "../src/lib/placeMonitorAnalysisPacket.js";

function measurement(overrides = {}) {
  return {
    measurement_id: "mea_0123456789abcdef",
    sensor_id: "unified-iphone",
    query: "선릉 아이폰수리",
    result_surface: "unified_search_place",
    measured_at: "2026-09-30T14:02:00+09:00",
    measurement_status: "VALID",
    observed_n: 5,
    target_found: true,
    organic_rank: 2,
    error_summary: null,
    checkpoint: "CAL-20260930-1400",
    experiment_id: "CLASSIFIER-CAL-001",
    source_version: "0.13.1",
    search_conditions: {
      device_mode: "desktop",
      login_state: "UNKNOWN",
      location_permission: "PROMPT",
      intended_map_center_label: "seolleung-area",
      precise_latitude: 37.123456,
      cookie: "secret-cookie",
    },
    synced_at: "2026-09-30T14:05:00+09:00",
    ...overrides,
  };
}

function dashboardFixture() {
  const staleSuccess = measurement({
    measurement_id: "mea_1111111111111111",
    sensor_id: "map-surface-seolleung",
    query: "서피스수리",
    result_surface: "map_web",
    measured_at: "2026-09-29T11:00:00+09:00",
    organic_rank: 4,
    checkpoint: "D1",
    experiment_id: "SURFACE-PHOTO-001",
  });
  const failedAttempt = measurement({
    measurement_id: "mea_2222222222222222",
    sensor_id: "map-surface-seolleung",
    query: "서피스수리",
    result_surface: "map_web",
    measured_at: "2026-09-30T17:00:00+09:00",
    measurement_status: "MEASUREMENT_FAILED",
    observed_n: 0,
    target_found: false,
    organic_rank: null,
    error_summary: "browser unavailable",
    checkpoint: "CAL-20260930-1700",
    experiment_id: "CLASSIFIER-CAL-001",
  });
  const notFound = measurement({
    measurement_id: "mea_3333333333333333",
    sensor_id: "unified-surface",
    query: "선릉 서피스수리",
    measured_at: "2026-09-30T17:04:00+09:00",
    measurement_status: "NOT_IN_OBSERVED_RANGE",
    observed_n: 8,
    target_found: false,
    organic_rank: null,
  });

  return {
    sensors: [
      {
        sensor_id: "map-surface-seolleung",
        last_attempt: failedAttempt,
        last_successful: staleSuccess,
      },
      {
        sensor_id: "unified-surface",
        last_attempt: notFound,
        last_successful: notFound,
      },
    ],
    last_sync_at: "2026-09-30T17:05:00+09:00",
    limits: {
      latest_rows_scanned: 50,
      latest_rows_cap: 50,
      history_rows_cap: 50,
    },
    observer_status: {
      source_version: "0.13.1",
      generated_at: "2026-09-30T17:05:00+09:00",
      phase: "AUTO_OBSERVATION_ENABLED",
      schedule_tasks: [
        {
          checkpoint: "D7",
          sensor_id: "unified-surface",
          due_at: "2026-10-03T11:00:00+09:00",
          window_start: "2026-10-03T10:45:00+09:00",
          window_end: "2026-10-03T11:45:00+09:00",
          status: "PENDING",
          measurement_id: null,
          completed_at: null,
        },
      ],
    },
    warnings: {
      d3_missing: true,
      d1_unknown_login: true,
      d1_location_prompt: true,
      d1_context_mismatch: false,
    },
  };
}

test("packet uses one safe snapshot, deduplicates IDs, and states range limits", () => {
  const dashboard = dashboardFixture();
  const duplicate = dashboard.sensors[1].last_attempt;
  const snapshot = createPlaceMonitorPacketSnapshot({
    dashboard,
    history: [duplicate, measurement()],
    selectedSensorFilter: "서피스 지도검색",
    historyScope: "전체 센서",
    question: "서피스 개선 우선순위는?",
    copiedAt: new Date("2026-09-30T17:10:00+09:00"),
  });
  const packet = buildPlaceMonitorAnalysisPacket(snapshot);

  assert.match(packet, /^\[i smile again 선릉 플레이스 자연순위 분석 패킷 \/ v1\]/u);
  assert.match(packet, /measurement ID 중복 제거 후 4건/u);
  assert.equal(packet.match(/mea_3333333333333333/gu)?.length, 1);
  assert.match(packet, /최신 조회가 50행 상한에 도달함/u);
  assert.match(packet, /현재 선택된 센서 필터: 서피스 지도검색/u);
  assert.match(packet, /사용자가 실제 불러온 이력 범위: 전체 센서/u);
  assert.match(packet, /이번에 궁금한 점[\s\S]*서피스 개선 우선순위는\?/u);
});

test("failed attempt stays separate from stale success and TOP8 is not expanded", () => {
  const packet = buildPlaceMonitorAnalysisPacket({
    dashboard: dashboardFixture(),
    history: [],
    copiedAt: new Date("2026-09-30T17:10:00+09:00"),
  });

  assert.match(packet, /마지막 시도: .*측정 실패/u);
  assert.match(packet, /발견 상태: 확인 불가/u);
  assert.match(packet, /실제 확인 범위: 관측 자료 0건/u);
  assert.doesNotMatch(packet, /실제 확인 범위: TOP 0/u);
  assert.match(packet, /마지막 정상 측정: .*4위/u);
  assert.match(packet, /최근 실패·보류를 정상 순위로 대체하지 않음/u);
  assert.match(packet, /TOP 8 내 미발견/u);
  assert.match(packet, /발견 상태: 확인 범위 내 미발견/u);
  assert.doesNotMatch(packet, /TOP 9/u);
  assert.match(packet, /요청 범위: 미수신/u);
  assert.match(packet, /UNKNOWN 문자열이 같아도 동일 조건이 확인된 것은 아니다/u);
  assert.match(packet, /수신 자료에서 D3 확인 불가/u);
  assert.match(packet, /전체 D3 누락을 확정하지 않음/u);
  assert.match(packet, /D1 로그인 상태 UNKNOWN/u);
  assert.match(packet, /관측기 보고 예정 작업/u);
  assert.match(packet, /실행 트리거 등록 확인: 미수신/u);
  assert.doesNotMatch(packet, /실제 등록된 다음 예약/u);
});

test("zero observations, ambiguous identity, and COMPLETED keep their meanings", () => {
  const ambiguous = measurement({
    measurement_id: "mea_4444444444444444",
    measurement_status: "AMBIGUOUS_ENTITY",
    observed_n: 0,
    target_found: false,
    organic_rank: null,
  });
  const dashboard = {
    sensors: [{ sensor_id: ambiguous.sensor_id, last_attempt: ambiguous, last_successful: null }],
    observer_status: {
      generated_at: "2026-09-30T14:10:00+09:00",
      phase: "AUTO_OBSERVATION_ENABLED",
      schedule_tasks: [{
        checkpoint: "D4",
        sensor_id: ambiguous.sensor_id,
        due_at: "2026-09-30T11:00:00+09:00",
        window_start: "2026-09-30T10:45:00+09:00",
        window_end: "2026-09-30T11:45:00+09:00",
        status: "COMPLETED",
        measurement_id: ambiguous.measurement_id,
        completed_at: "2026-09-30T11:05:00+09:00",
      }],
    },
    limits: {},
  };
  const packet = buildPlaceMonitorAnalysisPacket({ dashboard, history: [] });

  assert.match(packet, /업체 식별이 불확실하므로 순위 판독 보류/u);
  assert.match(packet, /측정 0건: 관측 자료가 없는 상태/u);
  assert.match(packet, /COMPLETED: 작업 실행이 끝났다는 뜻/u);
  assert.doesNotMatch(packet, /광고 제외 자연순위: 0위/u);
  assert.match(packet, /발견 상태: 확인 불가/u);
});

test("received D3 stays received even when a bounded warning says missing", () => {
  const d3 = measurement({
    measurement_id: "mea_6666666666666666",
    checkpoint: "D3",
    measured_at: "2026-09-29T13:30:00+09:00",
    synced_at: "2026-09-29T15:00:00+09:00",
  });
  const packet = buildPlaceMonitorAnalysisPacket({
    dashboard: {
      sensors: [{ sensor_id: d3.sensor_id, last_attempt: d3, last_successful: d3 }],
      warnings: { d3_missing: true },
      limits: {},
    },
    history: [d3],
  });

  assert.match(packet, /D3 상태: 수신 확인/u);
  assert.match(packet, /측정→동기화 간격 90분 0초/u);
  assert.match(packet, /늦게 동기화됐다는 이유만으로 누락 처리하지 않음/u);
  assert.doesNotMatch(packet, /전체 D3 누락/u);
});

test("valid identified result is reported as found", () => {
  const valid = measurement();
  const packet = buildPlaceMonitorAnalysisPacket({
    dashboard: {
      sensors: [{ sensor_id: valid.sensor_id, last_attempt: valid, last_successful: valid }],
      limits: {},
    },
  });
  assert.match(packet, /발견 상태: 발견/u);
  assert.match(packet, /원본 판독 상태: VALID/u);
});

test("packet excludes secret and precise-location fields", () => {
  const packet = buildPlaceMonitorAnalysisPacket({
    dashboard: dashboardFixture(),
    history: [measurement()],
  });

  assert.doesNotMatch(packet, /secret-cookie/u);
  assert.doesNotMatch(packet, /37\.123456/u);
  assert.doesNotMatch(packet, /cookie/u);
  assert.match(packet, /지도 중심 식별자=seolleung-area/u);
});

test("unsafe error details and null numbers are not exposed or changed to zero", () => {
  const unsafe = measurement({
    measurement_id: "mea_5555555555555555",
    measurement_status: "MEASUREMENT_FAILED",
    observed_n: null,
    target_found: false,
    organic_rank: null,
    error_summary: "/Users/example/private/session-token.json",
  });
  const packet = buildPlaceMonitorAnalysisPacket({
    dashboard: {
      sensors: [{ sensor_id: unsafe.sensor_id, last_attempt: unsafe, last_successful: null }],
      limits: {},
    },
  });

  assert.doesNotMatch(packet, /\/Users\/example/u);
  assert.match(packet, /상세 오류 내용 제외\(상태 코드 참조\)/u);
  assert.match(packet, /실제 확인 범위: 미수신/u);
  assert.doesNotMatch(packet, /실제 확인 범위: TOP 0/u);
});

test("clipboard completion follows the actual write result", async () => {
  let writes = 0;
  const clipboard = {
    async writeText(text) {
      writes += 1;
      assert.equal(text, "packet");
    },
  };
  await writePacketToClipboard("packet", clipboard);
  assert.equal(writes, 1);
  await assert.rejects(
    writePacketToClipboard("packet", { writeText: async () => { throw new Error("denied"); } }),
    /denied/u,
  );
});

test("copy UI has no request, refresh, tracking, logging, or dynamic import path", async () => {
  const source = await readFile(
    new URL("../src/components/PlaceMonitorAnalysisCopy.jsx", import.meta.url),
    "utf8",
  );
  for (const forbidden of [
    "fetch(",
    "adminFetch",
    "router.refresh",
    "sendBeacon",
    "XMLHttpRequest",
    "console.",
    "import(",
    "form action",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.match(source, /navigator\.clipboard/u);
  assert.match(source, /readOnly/u);
});

test("existing visible-tab refresh interval remains fifteen minutes", async () => {
  const source = await readFile(
    new URL("../src/app/admin/place-monitor/page.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /const REFRESH_MS = 15 \* 60 \* 1000;/u);
  assert.match(source, /document\.visibilityState === "visible"/u);
});
