"use client";

import { useRef, useState } from "react";
import {
  buildPlaceMonitorAnalysisPacket,
  createPlaceMonitorPacketSnapshot,
  writePacketToClipboard,
} from "@/lib/placeMonitorAnalysisPacket";
import styles from "./PlaceMonitorAnalysisCopy.module.css";

export default function PlaceMonitorAnalysisCopy({
  dashboard,
  history,
  selectedSensorFilter,
  historyScope,
}) {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("idle");
  const [fallbackText, setFallbackText] = useState("");
  const copyingRef = useRef(false);

  async function handleCopy() {
    if (copyingRef.current) return;
    copyingRef.current = true;
    setStatus("copying");
    setFallbackText("");

    const snapshot = createPlaceMonitorPacketSnapshot({
      dashboard,
      history,
      selectedSensorFilter: selectedSensorFilter || "전체 센서",
      historyScope: historyScope || "이력 미조회",
      question,
      copiedAt: new Date(),
    });
    const packet = buildPlaceMonitorAnalysisPacket(snapshot);

    try {
      await writePacketToClipboard(packet, navigator.clipboard);
      setStatus("done");
    } catch {
      setFallbackText(packet);
      setStatus("error");
    } finally {
      copyingRef.current = false;
    }
  }

  const buttonLabel = status === "copying"
    ? "복사하는 중..."
    : status === "done"
      ? "✓ 복사 완료"
      : "똑순이 분석용 복사";

  return (
    <section className={styles.panel} aria-labelledby="analysis-copy-title">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>현재 화면 자료만 사용</p>
          <h2 id="analysis-copy-title">똑순이 분석용 복사</h2>
        </div>
        <p>
          새 조회·측정·AI 요청·서버 저장 없이, 현재 페이지가 이미 받은 자료를
          분석용 전문으로 만듭니다.
        </p>
      </div>

      <label className={styles.question}>
        <span>이번에 궁금한 점 <small>선택 입력</small></span>
        <textarea
          rows={3}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="예: 서피스 지역 노출을 늘리기 위해 가장 먼저 바꿀 항목은?"
          maxLength={1200}
        />
        <em>비밀번호·토큰·고객 개인정보는 입력하지 마세요. 질문은 브라우저 메모리에만 머뭅니다.</em>
      </label>

      <div className={styles.actions}>
        <button type="button" onClick={handleCopy} disabled={status === "copying"}>
          {buttonLabel}
        </button>
        <span role="status" aria-live="polite">
          {status === "done"
            ? "클립보드 쓰기가 확인되었습니다."
            : status === "error"
              ? "자동 복사에 실패했습니다. 아래 전문을 직접 선택해 복사하세요."
              : ""}
        </span>
      </div>

      {fallbackText ? (
        <label className={styles.fallback}>
          <span>직접 복사용 전문</span>
          <textarea
            readOnly
            value={fallbackText}
            rows={14}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
      ) : null}
    </section>
  );
}
