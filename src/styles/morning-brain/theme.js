/**
 * ===========================================================
 * Project : Good Morning AI
 * -----------------------------------------------------------
 * 파일명 : theme.js
 *
 * 역할(Role)
 * Morning Brain Dashboard 디자인 시스템
 *
 * 책임(Responsibility)
 * - 색상 관리
 * - 그림자 관리
 * - 둥근 모서리 관리
 * - 공통 여백 관리
 *
 * 개발 원칙
 * 1. Morning Brain 전용 스타일만 관리한다.
 * 2. 기존 홈페이지 스타일은 건드리지 않는다.
 * 3. 색상/그림자/모서리는 여기서 통일한다.
 *
 * 작성
 * 오광윤 + 똑순이
 * ===========================================================
 */

export const brainTheme = {
    colors: {
      pageBg: "#f6f8fc",
      dark: "#0f172a",
      navy: "#172554",
      blue: "#2563eb",
      blueLight: "#dbeafe",
      purple: "#7c3aed",
      orange: "#f97316",
      green: "#16a34a",
      red: "#dc2626",
      yellow: "#facc15",
  
      text: "#0f172a",
      textSoft: "#475569",
      textMuted: "#94a3b8",
  
      card: "#ffffff",
      line: "#e5e7eb",
    },
  
    gradients: {
      hero: "linear-gradient(135deg, #0f172a 0%, #172554 48%, #1e3a8a 100%)",
      blue: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      purple: "linear-gradient(135deg, #7c3aed, #4f46e5)",
      orange: "linear-gradient(135deg, #f97316, #ea580c)",
    },
  
    radius: {
      sm: "12px",
      md: "18px",
      lg: "24px",
      xl: "32px",
      full: "999px",
    },
  
    shadow: {
      soft: "0 18px 45px rgba(15, 23, 42, 0.08)",
      card: "0 14px 35px rgba(15, 23, 42, 0.06)",
      hero: "0 24px 70px rgba(15, 23, 42, 0.22)",
    },
  
    space: {
      pageX: "24px",
      sectionGap: "18px",
      cardPadding: "24px",
    },
  
    typography: {
      title: {
        fontSize: "58px",
        lineHeight: 1.05,
        letterSpacing: "-0.06em",
        fontWeight: 950,
      },
      h2: {
        fontSize: "30px",
        lineHeight: 1.25,
        letterSpacing: "-0.04em",
        fontWeight: 900,
      },
      h3: {
        fontSize: "20px",
        lineHeight: 1.35,
        letterSpacing: "-0.03em",
        fontWeight: 900,
      },
      body: {
        fontSize: "15px",
        lineHeight: 1.8,
      },
    },
  };