/**
 * ===========================================================
 * Good Morning AI
 * analyze.js
 *
 * 역할
 * - 수집된 데이터를 분석
 * - 연결된 실제 데이터와 미연결 데이터를 구분
 * - 오늘의 기본 흐름 구성
 * ===========================================================
 */

import {
    logInfo,
    logSuccess,
  } from "./logger";
  
  function hasValue(value) {
    return (
      value !== null &&
      value !== undefined &&
      value !== ""
    );
  }
  
  function getWeatherImpactScore(weather) {
    if (!weather?.ok) {
      return 0;
    }
  
    const rainProbability =
      Number(
        weather?.daily
          ?.maximumRainProbability
      ) || 0;
  
    const windSpeed =
      Number(
        weather?.current?.windSpeed
      ) || 0;
  
    let score = 55;
  
    if (rainProbability >= 70) {
      score += 25;
    } else if (rainProbability >= 40) {
      score += 15;
    } else if (rainProbability >= 20) {
      score += 7;
    }
  
    if (windSpeed >= 25) {
      score += 12;
    } else if (windSpeed >= 15) {
      score += 6;
    }
  
    return Math.min(95, score);
  }
  
  function getWeatherImpactReason(weather) {
    if (!weather?.ok) {
      return "날씨 데이터를 불러오지 못했습니다.";
    }
  
    const rainProbability =
      Number(
        weather?.daily
          ?.maximumRainProbability
      ) || 0;
  
    const condition =
      weather?.current?.condition ||
      "날씨";
  
    if (rainProbability >= 70) {
      return `${condition} 상태이며 강수 가능성이 높아 이동과 외부 일정에 영향을 줄 수 있습니다.`;
    }
  
    if (rainProbability >= 40) {
      return `${condition} 상태로 외출 전 강수 여부를 한 번 더 확인하는 것이 좋습니다.`;
    }
  
    return `${condition} 상태로 이동과 외부 일정을 계획할 때 참고할 수 있습니다.`;
  }
  
  function buildPeriodSummary(periods) {
    if (
      !Array.isArray(periods) ||
      periods.length === 0
    ) {
      return "";
    }
  
    return periods
      .map((period) => {
        const pieces = [
          period.label,
          period.condition,
        ];
  
        if (hasValue(period.temperature)) {
          pieces.push(
            `${period.temperature}°`
          );
        }
  
        if (
          hasValue(
            period.rainProbability
          )
        ) {
          pieces.push(
            `강수 ${period.rainProbability}%`
          );
        }
  
        return pieces.join(" ");
      })
      .join(", ");
  }
  
  function buildWeatherSummary(weather) {
    if (!weather?.ok) {
      return (
        "날씨 데이터를 불러오지 못했습니다. " +
        "외출 전에 최신 기상 정보를 다시 확인해 주세요."
      );
    }
  
    const current =
      weather.current || {};
  
    const daily =
      weather.daily || {};
  
    const mainParts = [
      `${weather.location} 현재 ${current.condition || "날씨 확인 중"}`,
    ];
  
    if (hasValue(current.temperature)) {
      mainParts.push(
        `${current.temperature}°`
      );
    }
  
    if (
      hasValue(
        current.apparentTemperature
      )
    ) {
      mainParts.push(
        `체감 ${current.apparentTemperature}°`
      );
    }
  
    if (
      hasValue(
        daily.minimumTemperature
      ) &&
      hasValue(
        daily.maximumTemperature
      )
    ) {
      mainParts.push(
        `오늘 최저 ${daily.minimumTemperature}°·최고 ${daily.maximumTemperature}°`
      );
    }
  
    if (
      hasValue(
        daily.maximumRainProbability
      )
    ) {
      mainParts.push(
        `최대 강수확률 ${daily.maximumRainProbability}%`
      );
    }
  
    if (
      hasValue(current.windSpeed)
    ) {
      mainParts.push(
        `바람 ${current.windSpeed}km/h`
      );
    }
  
    const periodSummary =
      buildPeriodSummary(
        weather.periods
      );
  
    if (periodSummary) {
      return `${mainParts.join(
        ", "
      )}. 시간대별로는 ${periodSummary}입니다.`;
    }
  
    return `${mainParts.join(", ")}.`;
  }
  
  function buildWeatherBusinessPoint(weather) {
    if (!weather?.ok) {
      return (
        "날씨 데이터가 확인되지 않아 " +
        "외부 이동과 방문 일정은 별도로 확인하는 것이 좋습니다."
      );
    }
  
    const rainProbability =
      Number(
        weather?.daily
          ?.maximumRainProbability
      ) || 0;
  
    if (rainProbability >= 60) {
      return (
        "비 가능성이 높아 방문 고객의 이동이 줄거나 시간대가 변경될 수 있습니다. " +
        "전화·온라인 문의 응대를 강화하는 것이 좋습니다."
      );
    }
  
    return (
      "날씨로 인한 이동 부담이 크지 않다면 외부 일정과 방문 흐름을 활용할 수 있습니다. " +
      "다만 시간대별 강수 가능성은 확인하는 것이 좋습니다."
    );
  }
  
  export async function analyzeMorningData(
    collectedData
  ) {
    logInfo("🧠 Morning AI 분석 시작");
  
    const weather =
      collectedData?.weather;
  
    const weatherAvailable =
      Boolean(weather?.ok);
  
    const weatherSummary =
      buildWeatherSummary(weather);
  
    const weatherImpactScore =
      getWeatherImpactScore(weather);
  
    const analyzedData = {
      analyzedAt: new Date().toISOString(),
  
      source: collectedData,
  
      aiOneLine: weatherAvailable
        ? `${weather.location}의 실제 날씨를 먼저 확인하고 이동과 일정을 조정하세요. 시장과 뉴스 데이터는 아직 연결 전입니다.`
        : "현재 연결된 실시간 데이터가 부족하므로 확인되지 않은 흐름을 단정하지 않는 것이 좋습니다.",
  
      aiDirection: weatherAvailable
        ? Number(
              weather?.daily
                ?.maximumRainProbability
            ) >= 60
          ? "이동 주의"
          : "일정 유지"
        : "확인 필요",
  
      aiConfidenceScore:
        weatherAvailable
          ? 68
          : 40,
  
      aiMarketMood:
        "⚪ 시장 데이터 준비 중",
  
      impactTop5: weatherAvailable
        ? [
            {
              title: "날씨",
              score:
                weatherImpactScore,
              reason:
                getWeatherImpactReason(
                  weather
                ),
            },
          ]
        : [],
  
      connectionFlow: weatherAvailable
        ? "현재 날씨 → 이동 편의 → 방문·외출 가능성 → 오늘의 일정 운영 순서로 연결해서 보는 것이 좋습니다."
        : "실시간 데이터가 충분히 연결된 뒤 정보 간 연결 흐름을 분석합니다.",
  
      exchangeMarketAnalysis:
        "환율과 국내·미국 증시 데이터는 아직 연결되지 않았습니다. 실제 수치가 연결되기 전에는 시장 방향을 단정하지 않습니다.",
  
      weatherSummary,
  
      newsSummary:
        "뉴스 데이터가 아직 연결되지 않았습니다.",
  
      techSummary:
        "AI·IT·기술 뉴스 데이터가 아직 연결되지 않았습니다.",
  
      businessPoint:
        buildWeatherBusinessPoint(
          weather
        ),
  
      blogKeywords:
        "오늘 날씨, AI 아침 브리핑, 오늘의 흐름",
  
      content: weatherAvailable
        ? `${weather.location} 실제 날씨 데이터를 반영한 Morning AI 브리핑입니다.`
        : "날씨 데이터를 불러오지 못해 제한된 정보로 구성한 Morning AI 브리핑입니다.",
  
      uncertaintyNote:
        weatherAvailable
          ? "현재 브리핑은 실제 날씨 데이터를 반영했습니다. 환율, 증시, 뉴스, 유가 등은 아직 연결 전이므로 해당 영역은 판단 근거로 사용하지 않았습니다."
          : "현재 실제 외부 데이터가 충분히 연결되지 않아 판단 신뢰도가 낮습니다.",
    };
  
    logSuccess("Morning AI 분석 완료");
  
    return analyzedData;
  }