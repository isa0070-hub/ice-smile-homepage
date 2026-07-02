/**
 * ===========================================================
 * Good Morning AI
 * weather.js
 *
 * 역할
 * - 실제 날씨 데이터 수집
 * - 현재 날씨, 오늘 최고·최저, 강수확률 수집
 * - 오전·점심·저녁 시간대 예보 구성
 *
 * 현재 기본 지역
 * - 서울
 * ===========================================================
 */

import {
    logInfo,
    logSuccess,
    logWarning,
  } from "./logger";
  
  const DEFAULT_LOCATION = {
    name: "서울",
    latitude: 37.5665,
    longitude: 126.978,
    timezone: "Asia/Seoul",
  };
  
  const WEATHER_CODE_LABELS = {
    0: "맑음",
    1: "대체로 맑음",
    2: "구름 조금",
    3: "흐림",
  
    45: "안개",
    48: "서리 안개",
  
    51: "약한 이슬비",
    53: "이슬비",
    55: "강한 이슬비",
    56: "약한 어는 이슬비",
    57: "강한 어는 이슬비",
  
    61: "약한 비",
    63: "비",
    65: "강한 비",
    66: "약한 어는 비",
    67: "강한 어는 비",
  
    71: "약한 눈",
    73: "눈",
    75: "강한 눈",
    77: "싸락눈",
  
    80: "약한 소나기",
    81: "소나기",
    82: "강한 소나기",
  
    85: "약한 눈 소나기",
    86: "강한 눈 소나기",
  
    95: "천둥번개",
    96: "우박 동반 천둥번개",
    99: "강한 우박 동반 천둥번개",
  };
  
  function toNumber(value) {
    const number = Number(value);
  
    return Number.isFinite(number)
      ? number
      : null;
  }
  
  function roundNumber(value) {
    const number = toNumber(value);
  
    return number === null
      ? null
      : Math.round(number);
  }
  
  function getWeatherLabel(code) {
    const numberCode = Number(code);
  
    return (
      WEATHER_CODE_LABELS[numberCode] ||
      "날씨 확인 중"
    );
  }
  
  function getHourlyPoint(data, date, hour, label) {
    const hourText = String(hour).padStart(2, "0");
    const targetTime = `${date}T${hourText}:00`;
  
    const timeList = Array.isArray(data?.hourly?.time)
      ? data.hourly.time
      : [];
  
    const index = timeList.indexOf(targetTime);
  
    if (index < 0) {
      return null;
    }
  
    return {
      label,
      time: `${hourText}:00`,
  
      temperature: roundNumber(
        data.hourly?.temperature_2m?.[index]
      ),
  
      rainProbability: roundNumber(
        data.hourly?.precipitation_probability?.[index]
      ),
  
      weatherCode:
        data.hourly?.weather_code?.[index] ?? null,
  
      condition: getWeatherLabel(
        data.hourly?.weather_code?.[index]
      ),
    };
  }
  
  export async function collectWeather(
    location = DEFAULT_LOCATION
  ) {
    const target = {
      ...DEFAULT_LOCATION,
      ...location,
    };
  
    const params = new URLSearchParams({
      latitude: String(target.latitude),
      longitude: String(target.longitude),
  
      current: [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "weather_code",
        "wind_speed_10m",
      ].join(","),
  
      hourly: [
        "temperature_2m",
        "precipitation_probability",
        "weather_code",
      ].join(","),
  
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
      ].join(","),
  
      timezone: target.timezone,
      forecast_days: "1",
  
      temperature_unit: "celsius",
      wind_speed_unit: "kmh",
      precipitation_unit: "mm",
    });
  
    const url =
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  
    try {
      logInfo(`🌤️ ${target.name} 날씨 수집 시작`);
  
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(
          `날씨 API 응답 오류: ${response.status}`
        );
      }
  
      const data = await response.json();
  
      const forecastDate =
        data?.daily?.time?.[0] ||
        String(data?.current?.time || "").slice(0, 10);
  
      const periods = [
        getHourlyPoint(
          data,
          forecastDate,
          9,
          "오전"
        ),
        getHourlyPoint(
          data,
          forecastDate,
          12,
          "점심"
        ),
        getHourlyPoint(
          data,
          forecastDate,
          18,
          "저녁"
        ),
      ].filter(Boolean);
  
      const weather = {
        ok: true,
  
        source: "Open-Meteo",
        location: target.name,
        latitude: data?.latitude ?? target.latitude,
        longitude: data?.longitude ?? target.longitude,
        timezone:
          data?.timezone || target.timezone,
  
        fetchedAt: new Date().toISOString(),
        forecastDate,
  
        current: {
          time: data?.current?.time || null,
  
          temperature: roundNumber(
            data?.current?.temperature_2m
          ),
  
          apparentTemperature: roundNumber(
            data?.current?.apparent_temperature
          ),
  
          humidity: roundNumber(
            data?.current?.relative_humidity_2m
          ),
  
          windSpeed: roundNumber(
            data?.current?.wind_speed_10m
          ),
  
          weatherCode:
            data?.current?.weather_code ?? null,
  
          condition: getWeatherLabel(
            data?.current?.weather_code
          ),
        },
  
        daily: {
          weatherCode:
            data?.daily?.weather_code?.[0] ?? null,
  
          condition: getWeatherLabel(
            data?.daily?.weather_code?.[0]
          ),
  
          maximumTemperature: roundNumber(
            data?.daily?.temperature_2m_max?.[0]
          ),
  
          minimumTemperature: roundNumber(
            data?.daily?.temperature_2m_min?.[0]
          ),
  
          maximumRainProbability: roundNumber(
            data?.daily
              ?.precipitation_probability_max?.[0]
          ),
        },
  
        periods,
      };
  
      logSuccess(
        `${target.name} 날씨 수집 완료`
      );
  
      return weather;
    } catch (error) {
      logWarning(
        `${target.name} 날씨 수집 실패: ${
          error?.message || String(error)
        }`
      );
  
      return {
        ok: false,
        source: "Open-Meteo",
        location: target.name,
        fetchedAt: new Date().toISOString(),
        error:
          error?.message || String(error),
        current: null,
        daily: null,
        periods: [],
      };
    }
  }