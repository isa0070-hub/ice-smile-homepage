/**
 * ===========================================================
 * Good Morning AI
 * collect.js
 *
 * 역할
 * - Morning AI에서 사용할 외부 데이터 수집
 *
 * 현재 연결 완료
 * - 실제 날씨
 *
 * 이후 연결 예정
 * - 환율
 * - 국내증시
 * - 미국증시
 * - 국제유가
 * - 금
 * - 비트코인
 * - 뉴스
 * ===========================================================
 */

import { collectWeather } from "./weather";
import {
  logInfo,
  logSuccess,
} from "./logger";

export async function collectMorningData() {
  logInfo("📥 Morning Data Collect 시작");

  const weather = await collectWeather();

  const collectedData = {
    collectedAt: new Date().toISOString(),

    weather,

    exchange: null,

    usMarket: null,

    koreaMarket: null,

    oil: null,

    gold: null,

    bitcoin: null,

    aiNews: [],

    appleNews: [],

    itNews: [],

    economyNews: [],

    schedule: [],
  };

  logSuccess("Morning Data Collect 완료");

  return collectedData;
}