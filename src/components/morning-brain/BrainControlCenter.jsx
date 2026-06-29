"use client";

/**
 * ===========================================================
 * Project : Good Morning AI
 * -----------------------------------------------------------
 * 파일명 : BrainControlCenter.jsx
 *
 * 역할(Role)
 * Morning Brain 생성/운영 컨트롤 영역
 *
 * 책임(Responsibility)
 * - AI 브리핑 생성 버튼 표시
 * - 생성 중 상태 표시
 * - 생성 결과 메시지 표시
 *
 * 절대 하지 말아야 할 일
 * - DB 직접 접근
 * - AI 분석 로직 작성
 * - Supabase 저장 로직 작성
 *
 * 작성
 * 오광윤 + 똑순이
 * ===========================================================
 */

import { brainTheme } from "@/styles/morning-brain/theme";

export default function BrainControlCenter({
  generating,
  generateMessage,
  onGenerate,
}) {
  return (
    <section style={styles.card}>
      <div>
        <p style={styles.label}>Morning Brain Control Center</p>
        <h2 style={styles.title}>AI 브리핑 엔진</h2>
        <p style={styles.desc}>
          collect → analyze → generate → publish 순서로 오늘의 브리핑을 생성합니다.
        </p>

        {generateMessage && (
          <p style={styles.message}>{generateMessage}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={generating}
        style={{
          ...styles.button,
          opacity: generating ? 0.6 : 1,
          cursor: generating ? "not-allowed" : "pointer",
        }}
      >
        {generating ? "생성 중..." : "🌅 AI 브리핑 생성"}
      </button>
    </section>
  );
}

const styles = {
  card: {
    background: brainTheme.colors.card,
    border: `1px solid ${brainTheme.colors.line}`,
    borderRadius: brainTheme.radius.xl,
    padding: "26px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    boxShadow: brainTheme.shadow.soft,
  },
  label: {
    margin: "0 0 8px",
    color: brainTheme.colors.blue,
    fontSize: "13px",
    fontWeight: 900,
  },
  title: {
    margin: "0 0 8px",
    ...brainTheme.typography.h2,
  },
  desc: {
    margin: 0,
    color: brainTheme.colors.textSoft,
    fontSize: "14px",
    lineHeight: 1.6,
  },
  message: {
    margin: "12px 0 0",
    color: brainTheme.colors.dark,
    fontSize: "14px",
    fontWeight: 800,
  },
  button: {
    border: "none",
    background: brainTheme.gradients.blue,
    color: "#fff",
    padding: "15px 22px",
    borderRadius: brainTheme.radius.full,
    fontSize: "15px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
};