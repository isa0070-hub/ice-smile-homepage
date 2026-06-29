"use client";

/**
 * ===========================================================
 * Project : Good Morning AI
 * -----------------------------------------------------------
 * 파일명 : BrainHero.jsx
 *
 * 역할(Role)
 * Morning Brain Dashboard의 첫 화면 Hero 영역
 *
 * 책임(Responsibility)
 * - 날짜 표시
 * - 오늘 한 줄 판단 표시
 * - AI 신뢰도 표시
 * - 첫 인상 디자인 담당
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

import Link from "next/link";
import { brainTheme } from "@/styles/morning-brain/theme";

export default function BrainHero({ note }) {
  const todayText = formatDate(note?.note_date);

  return (
    <section style={styles.hero}>
      <div style={styles.nav}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>🧠</span>
          <span>Morning Brain</span>
        </div>

        <Link href="/admin" style={styles.adminButton}>
          관리자 홈
        </Link>
      </div>

      <div style={styles.content}>
        <p style={styles.date}>{todayText}</p>

        <h1 style={styles.title}>Good Morning</h1>

        <p style={styles.subtitle}>
          뉴스가 아니라, 오늘의 흐름을 이해하는 AI 브리핑
        </p>

        <div style={styles.brainCard}>
          <div>
            <span style={styles.cardLabel}>오늘의 AI 판단</span>
            <h2 style={styles.oneLine}>
              {note?.ai_one_line ||
                "아직 오늘의 AI 브리핑이 등록되지 않았습니다."}
            </h2>
          </div>

          <div style={styles.confidenceBox}>
            <span style={styles.confidenceLabel}>Confidence</span>
            <strong style={styles.confidenceValue}>
              {note?.ai_confidence_score
                ? `${note.ai_confidence_score}%`
                : "--"}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatDate(dateText) {
  const date = dateText ? new Date(dateText) : new Date();

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

const styles = {
  hero: {
    background: brainTheme.gradients.hero,
    color: "#fff",
    padding: "30px 24px 82px",
  },
  nav: {
    maxWidth: "1180px",
    margin: "0 auto 62px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "18px",
    fontWeight: 900,
  },
  brandIcon: {
    fontSize: "28px",
  },
  adminButton: {
    textDecoration: "none",
    color: "#fff",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.22)",
    padding: "10px 16px",
    borderRadius: brainTheme.radius.full,
    fontSize: "14px",
    fontWeight: 800,
  },
  content: {
    maxWidth: "1180px",
    margin: "0 auto",
  },
  date: {
    margin: "0 0 14px",
    color: "#bfdbfe",
    fontSize: "15px",
    fontWeight: 800,
  },
  title: {
    margin: 0,
    ...brainTheme.typography.title,
  },
  subtitle: {
    margin: "18px 0 30px",
    color: "#dbeafe",
    fontSize: "19px",
    lineHeight: 1.6,
  },
  brainCard: {
    display: "grid",
    gridTemplateColumns: "1fr 170px",
    gap: "20px",
    alignItems: "center",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: brainTheme.radius.xl,
    padding: "30px",
    boxShadow: brainTheme.shadow.hero,
    backdropFilter: "blur(12px)",
  },
  cardLabel: {
    color: "#fde68a",
    fontSize: "14px",
    fontWeight: 900,
  },
  oneLine: {
    margin: "12px 0 0",
    fontSize: "30px",
    lineHeight: 1.35,
    letterSpacing: "-0.04em",
    fontWeight: 950,
  },
  confidenceBox: {
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: brainTheme.radius.lg,
    padding: "22px",
    textAlign: "center",
  },
  confidenceLabel: {
    display: "block",
    color: "#bfdbfe",
    fontSize: "13px",
    fontWeight: 900,
    marginBottom: "10px",
  },
  confidenceValue: {
    display: "block",
    fontSize: "42px",
    letterSpacing: "-0.05em",
  },
};