/**
 * ===========================================================
 * Project : Good Morning AI
 * -----------------------------------------------------------
 * 파일명 : logger.js
 *
 * 역할
 * Morning AI 로그 관리
 *
 * 모든 엔진은
 * logger를 통해 로그를 출력한다.
 *
 * 개발 원칙
 * 1. console.log를 직접 사용하지 않는다.
 * 2. 반드시 logger를 사용한다.
 * 3. 로그 형식을 통일한다.
 *
 * 작성
 * 오광윤 + 똑순이
 * ===========================================================
 */

function getTime() {
    return new Date().toLocaleTimeString("ko-KR", {
      hour12: false,
    });
  }
  
  export function logInfo(message) {
    console.log(`🟢 [${getTime()}] ${message}`);
  }
  
  export function logSuccess(message) {
    console.log(`✅ [${getTime()}] ${message}`);
  }
  
  export function logWarning(message) {
    console.warn(`🟡 [${getTime()}] ${message}`);
  }
  
  export function logError(message, error) {
    console.error(`🔴 [${getTime()}] ${message}`);
  
    if (error) {
      console.error(error);
    }
  }