/**
 * ===========================================================
 * Good Morning AI
 * time.js
 *
 * 역할
 * - 한국 시간 기준 날짜와 시간 생성
 * - UTC 날짜 오류 방지
 * ===========================================================
 */

export function getKoreaDateString(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
  
    const values = {};
  
    parts.forEach((part) => {
      if (part.type !== "literal") {
        values[part.type] = part.value;
      }
    });
  
    return `${values.year}-${values.month}-${values.day}`;
  }
  
  export function getKoreaDateTimeString(date = new Date()) {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  }