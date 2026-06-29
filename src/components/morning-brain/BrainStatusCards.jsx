"use client";

/**
 * ===========================================================
 * Project : Good Morning AI
 * -----------------------------------------------------------
 * 파일명 : BrainStatusCards.jsx
 *
 * 역할(Role)
 * Morning Brain의 핵심 상태 카드 영역
 *
 * 책임(Responsibility)
 * - AI 신뢰도 표시
 * - 시장 분위기 표시
 * - 오늘 방향성 표시
 *
 * 절대 하지 말아야 할 일
 * - DB 조회
 * - API 호출
 * - AI 분석 로직
 *
 * 작성
 * 오광윤 + 똑순이
 * ===========================================================
 */

import { brainTheme } from "@/styles/morning-brain/theme";

export default function BrainStatusCards({ note }) {
  const cards = [
    {
      title: "AI 신뢰도",
      value: note?.ai_confidence_score ? `${note.ai_confidence_score}%` : "--",
      desc: "현재 판단의 확실성",
    },
    {
      title: "시장 분위기",
      value: note?.ai_market_mood || "대기",
      desc: "오늘의 전체 흐름",
    },
    {
      title: "오늘 방향",
      value: note?.ai_direction || "분석 대기",
      desc: "Morning Brain 최종 판단",
    },
  ];

  return (
    <section style={styles.grid}>
      {cards.map((card) => (
        <div key={card.title} style={styles.card}>
          <span style={styles.title}>{card.title}</span>
          <strong style={styles.value}>{card.value}</strong>
          <p style={styles.desc}>{card.desc}</p>
        </div>
      ))}
    </section>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
  },
  card: {
    background: brainTheme.colors.card,
    border: `1px solid ${brainTheme.colors.line}`,
    borderRadius: brainTheme.radius.lg,
    padding: brainTheme.space.cardPadding,
    boxShadow: brainTheme.shadow.card,
  },
  title: {
    display: "block",
    color: brainTheme.colors.textMuted,
    fontSize: "14px",
    fontWeight: 900,
    marginBottom: "12px",
  },
  value: {
    display: "block",
    fontSize: "32px",
    lineHeight: 1.2,
    letterSpacing: "-0.05em",
    color: brainTheme.colors.text,
  },
  desc: {
    margin: "10px 0 0",
    color: brainTheme.colors.textSoft,
    fontSize: "14px",
    lineHeight: 1.6,
  },
};