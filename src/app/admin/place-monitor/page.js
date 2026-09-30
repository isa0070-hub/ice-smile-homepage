"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminClient";
import styles from "./page.module.css";

const SENSOR_LABELS = {
  "unified-iphone": "아이폰 통합검색",
  "unified-ipad": "아이패드 통합검색",
  "unified-macbook": "맥북 통합검색",
  "unified-surface": "서피스 통합검색",
  "map-surface-seolleung": "서피스 지도검색",
};

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

const REFRESH_MS = 15 * 60 * 1000;

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function rankLabel(item) {
  if (item.target_found && item.organic_rank) {
    return `${item.organic_rank}위`;
  }
  if (item.measurement_status === "NOT_IN_OBSERVED_RANGE") {
    return `TOP ${item.observed_n} 내 미발견`;
  }
  return "판정 보류";
}

function sensorLabel(item) {
  return SENSOR_LABELS[item.sensor_id] || item.sensor_id;
}

export default function PlaceMonitorPage() {
  const [dashboard, setDashboard] = useState({
    sensors: [],
    last_sync_at: null,
    warnings: {},
    limits: {},
  });
  const [history, setHistory] = useState([]);
  const [sensor, setSensor] = useState("");
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const [lastCheckedAt, setLastCheckedAt] = useState(null);

  const loadLatest = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadingLatest(true);
    try {
      const result = await adminFetch("/api/admin/place-monitor?mode=latest");
      setDashboard(result.dashboard || {
        sensors: [], last_sync_at: null, warnings: {}, limits: {},
      });
      setLastCheckedAt(new Date());
      setError("");
    } catch (requestError) {
      setError(requestError.message || "최신 결과를 불러오지 못했습니다.");
    } finally {
      if (!silent) setLoadingLatest(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams({ mode: "history", limit: "50" });
      if (sensor) params.set("sensor", sensor);
      const result = await adminFetch(`/api/admin/place-monitor?${params}`);
      setHistory(result.items || []);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "과거 기록을 불러오지 못했습니다.");
    } finally {
      setLoadingHistory(false);
    }
  }, [sensor]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => loadLatest(), 0);

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        loadLatest({ silent: true });
      }
    };
    const timer = window.setInterval(refreshIfVisible, REFRESH_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [loadLatest]);

  const latest = dashboard.sensors || [];
  const scheduleTasks = dashboard.observer_status?.schedule_tasks || [];
  const d4Tasks = scheduleTasks.filter((task) => task.checkpoint === "D4");
  const d4Completed = d4Tasks.filter((task) => task.status === "COMPLETED").length;
  const d4Registered = d4Tasks.length === 5;
  const calibrationTasks = scheduleTasks.filter((task) =>
    task.checkpoint?.startsWith("CAL-"),
  );
  const calibrationRounds = Object.values(
    calibrationTasks.reduce((rounds, task) => {
      rounds[task.checkpoint] ||= [];
      rounds[task.checkpoint].push(task);
      return rounds;
    }, {}),
  ).sort((a, b) => new Date(a[0].due_at) - new Date(b[0].due_at));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>관리자 전용 · 요약 데이터</p>
          <h1>선릉 플레이스 자연순위</h1>
          <p className={styles.description}>
            맥북 v0.13이 만든 측정 요약만 표시합니다. 검색 원문, 스크린샷,
            상세 로그와 Chrome 프로필은 이 페이지로 전송하지 않습니다.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" onClick={() => loadLatest()} disabled={loadingLatest}>
            {loadingLatest ? "확인 중" : "지금 새로고침"}
          </button>
          <Link href="/admin">관리자 홈</Link>
        </div>
      </header>

      <section className={styles.statusStrip} aria-label="동기화 상태">
        <div>
          <span>마지막 클라우드 동기화</span>
          <strong>{dashboard.last_sync_at ? formatDate(dashboard.last_sync_at) : "동기화 기록 없음"}</strong>
        </div>
        <div>
          <span>페이지 확인 시각</span>
          <strong>{lastCheckedAt ? formatDate(lastCheckedAt) : "확인 전"}</strong>
        </div>
        <p>
          화면이 보일 때만 15분 간격으로 확인하며, 한 번에 최대 50행만
          조회합니다.
        </p>
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}

      {dashboard.warnings?.d3_missing ? (
        <section className={styles.warningPanel} aria-label="누락된 관측 안내">
          <strong>D3 관측 누락</strong>
          <p>
            D3 허용창이 끝났지만 동기화된 D3 측정이 없습니다. 기존 허용창과
            기록은 수정하지 않습니다.
          </p>
        </section>
      ) : null}

      {dashboard.warnings?.d1_unknown_login ||
      dashboard.warnings?.d1_location_prompt ||
      dashboard.warnings?.d1_context_mismatch ? (
        <section className={styles.warningPanel} aria-label="D1 비교 제한 안내">
          <strong>D1 비교 제한</strong>
          <p>
            {dashboard.warnings.d1_unknown_login ? "로그인 상태 UNKNOWN" : ""}
            {dashboard.warnings.d1_unknown_login && dashboard.warnings.d1_location_prompt ? " · " : ""}
            {dashboard.warnings.d1_location_prompt ? "위치 권한 PROMPT" : ""}
            {dashboard.warnings.d1_context_mismatch ? " · v0.12 기준선 컨텍스트 불일치" : ""}
            {" 상태가 포함되어 D1 순위 비교는 참고용입니다."}
          </p>
        </section>
      ) : null}

      <section className={styles.schedulePanel} aria-labelledby="schedule-title">
        <div>
          <p className={styles.eyebrow}>자동관측 예약</p>
          <h2 id="schedule-title">D4 추가관측</h2>
        </div>
        {d4Registered ? (
          <dl>
            <div><dt>등록 상태</dt><dd>5개 센서 예약 등록</dd></div>
            <div><dt>실행 예정</dt><dd>{formatDate(d4Tasks[0].due_at)}</dd></div>
            <div><dt>허용창</dt><dd>{formatDate(d4Tasks[0].window_start)} 이상 · {formatDate(d4Tasks[0].window_end)} 미만</dd></div>
            <div><dt>측정 완료</dt><dd>{d4Completed}/5개 센서</dd></div>
          </dl>
        ) : (
          <p className={styles.empty}>동기화된 D4 예약 정보가 없습니다.</p>
        )}
        <p className={styles.scheduleNote}>
          예약 등록과 실제 측정 완료는 별도 상태입니다. 결과가 저장되기 전에는
          D4 순위를 표시하지 않습니다.
        </p>
      </section>

      <section className={styles.schedulePanel} aria-labelledby="calibration-title">
        <div>
          <p className={styles.eyebrow}>판독 교정 · 한시 운영</p>
          <h2 id="calibration-title">교정 관측 현재·다음 회차</h2>
        </div>
        {calibrationRounds.length ? (
          <dl>
            {calibrationRounds.map((round) => (
              <div key={round[0].checkpoint}>
                <dt>{round[0].checkpoint}</dt>
                <dd>
                  {formatDate(round[0].due_at)} · {round.filter((task) => task.status === "COMPLETED").length}/5 완료
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className={styles.empty}>동기화된 교정 관측 정보가 없습니다.</p>
        )}
        <p className={styles.scheduleNote}>
          2026-10-02까지만 11시·14시·17시에 실행하며 각 센서는 회차당 1회만
          측정합니다. D7 DB 기준시각과 허용창은 보존하고 실제 자동실행 트리거는
          2026-10-03 11:00 KST입니다.
        </p>
      </section>

      <section aria-labelledby="latest-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>최신 결과</p>
            <h2 id="latest-title">센서별 마지막 측정</h2>
          </div>
          <span>{latest.length}개 센서</span>
        </div>

        {loadingLatest && latest.length === 0 ? (
          <p className={styles.empty}>최신 측정 결과를 불러오는 중입니다.</p>
        ) : latest.length === 0 ? (
          <p className={styles.empty}>아직 동기화된 측정 결과가 없습니다.</p>
        ) : (
          <div className={styles.cardGrid}>
            {latest.map((sensorItem) => {
              const item = sensorItem.last_successful;
              const attempt = sensorItem.last_attempt;
              return (
              <article className={styles.card} key={sensorItem.sensor_id}>
                <div className={styles.cardTop}>
                  <div>
                    <p>{sensorLabel(attempt)}</p>
                    <h3>{attempt.query}</h3>
                  </div>
                  {item ? <span
                    className={
                      sensorItem.last_successful_is_today
                        ? styles.goodBadge
                        : styles.reviewBadge
                    }
                  >
                    {sensorItem.last_successful_is_today ? "오늘 정상 측정" : "이전 정상 측정"}
                  </span> : <span className={styles.reviewBadge}>정상 측정 없음</span>}
                </div>
                {item ? (
                  <>
                    <div className={styles.rank}>{rankLabel(item)}</div>
                    <dl className={styles.details}>
                      <div><dt>정상 측정</dt><dd>{formatDate(item.measured_at)}</dd></div>
                      <div><dt>범위</dt><dd>자연결과 TOP {item.observed_n}</dd></div>
                      <div><dt>회차</dt><dd>{item.checkpoint || "일반 측정"}</dd></div>
                    </dl>
                  </>
                ) : <div className={styles.rank}>판정 보류</div>}
                <div className={styles.attemptBox}>
                  <span>마지막 시도</span>
                  <strong>{formatDate(attempt.measured_at)}</strong>
                  <em>{STATUS_LABELS[attempt.measurement_status] || attempt.measurement_status}</em>
                  {attempt.error_summary ? <p>{attempt.error_summary}</p> : null}
                </div>
              </article>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.historySection} aria-labelledby="history-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>필요할 때만 조회</p>
            <h2 id="history-title">과거 측정 시도 기록</h2>
          </div>
        </div>
        <div className={styles.historyControls}>
          <label>
            센서
            <select value={sensor} onChange={(event) => setSensor(event.target.value)}>
              <option value="">전체</option>
              {Object.entries(SENSOR_LABELS).map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={loadHistory} disabled={loadingHistory}>
            {loadingHistory ? "불러오는 중" : "최근 50건 불러오기"}
          </button>
        </div>

        {history.length > 0 ? (
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>측정 시각</th><th>센서</th><th>순위</th><th>상태</th><th>회차</th></tr></thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.measurement_id}>
                    <td>{formatDate(item.measured_at)}</td>
                    <td>{sensorLabel(item)}</td>
                    <td>{rankLabel(item)}</td>
                    <td>{STATUS_LABELS[item.measurement_status] || item.measurement_status}</td>
                    <td>{item.checkpoint || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.empty}>조회 버튼을 누를 때만 최대 50건을 가져옵니다.</p>
        )}
      </section>
    </main>
  );
}
