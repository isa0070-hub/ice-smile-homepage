"use client";

/**
 * ===========================================================
 * Project : Good Morning AI
 * -----------------------------------------------------------
 * 파일명 : ImpactHeatmap.jsx
 *
 * 역할(Role)
 * 오늘 가장 영향력이 큰 요소 TOP5 시각화
 *
 * 책임(Responsibility)
 * - 영향력 순위 표시
 * - 중요도 막대그래프 표시
 * - AI 판단 근거 간단 표시
 *
 * 작성
 * 오광윤 + 똑순이
 * ===========================================================
 */

import { brainTheme } from "@/styles/morning-brain/theme";

export default function ImpactHeatmap({ impacts = [] }) {
  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div>
          <p style={styles.label}>Morning Brain</p>
          <h2 style={styles.title}>Today's Impact Heatmap</h2>
        </div>

        <div style={styles.badge}>
          TOP {impacts.length || 5}
        </div>
      </div>

      <div style={styles.list}>
        {impacts.map((item, index) => (
          <div key={index} style={styles.row}>
            <div style={styles.top}>
              <div style={styles.left}>
                <span style={styles.rank}>
                  {index + 1}
                </span>

                <strong style={styles.name}>
                  {item.title}
                </strong>
              </div>

              <strong style={styles.score}>
                {item.score}
              </strong>
            </div>

            <div style={styles.progress}>
              <div
                style={{
                  ...styles.fill,
                  width: `${item.score}%`,
                }}
              />
            </div>

            <p style={styles.reason}>
              {item.reason}
            </p>
          </div>
        ))}

        {impacts.length === 0 && (
          <div style={styles.empty}>
            아직 영향력 분석 결과가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}

const styles = {

  card: {
    background: brainTheme.colors.card,
    border: `1px solid ${brainTheme.colors.line}`,
    borderRadius: brainTheme.radius.xl,
    padding: "28px",
    boxShadow: brainTheme.shadow.card,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
  },

  label: {
    margin: 0,
    color: brainTheme.colors.blue,
    fontWeight: 900,
    fontSize: "13px",
  },

  title: {
    margin: "8px 0 0",
    ...brainTheme.typography.h2,
  },

  badge: {
    background: brainTheme.gradients.blue,
    color: "#fff",
    padding: "8px 18px",
    borderRadius: brainTheme.radius.full,
    fontWeight: 900,
    fontSize: "13px",
  },

  list: {
    display: "grid",
    gap: "24px",
  },

  row: {
    display: "grid",
    gap: "10px",
  },

  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  left: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  rank: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: brainTheme.gradients.blue,
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 900,
    fontSize: "14px",
  },

  name: {
    fontSize: "18px",
    color: brainTheme.colors.text,
  },

  score: {
    fontSize: "24px",
    color: brainTheme.colors.blue,
  },

  progress: {
    height: "14px",
    background: "#edf2f7",
    borderRadius: brainTheme.radius.full,
    overflow: "hidden",
  },

  fill: {
    height: "100%",
    background: brainTheme.gradients.blue,
    borderRadius: brainTheme.radius.full,
    transition: "width .5s ease",
  },

  reason: {
    margin: 0,
    color: brainTheme.colors.textSoft,
    fontSize: "14px",
    lineHeight: 1.7,
  },

  empty: {
    padding: "30px",
    textAlign: "center",
    color: brainTheme.colors.textMuted,
  },

};