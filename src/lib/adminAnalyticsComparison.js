const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function toCount(value) {
  const count = Number(value);

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(count) ||
    count < 0
  ) {
    return null;
  }

  return Math.floor(count);
}

export function getKstPeriodRange(periodKey, nowValue = new Date()) {
  const now = new Date(nowValue);

  if (!Number.isFinite(now.getTime())) {
    throw new TypeError("nowValue must be a valid date");
  }

  const shiftedNow = new Date(now.getTime() + KST_OFFSET_MS);
  const startOfToday = new Date(
    Date.UTC(
      shiftedNow.getUTCFullYear(),
      shiftedNow.getUTCMonth(),
      shiftedNow.getUTCDate()
    ) - KST_OFFSET_MS
  );

  if (periodKey === "yesterday") {
    return {
      start: new Date(startOfToday.getTime() - DAY_MS),
      end: new Date(startOfToday.getTime() - 1),
      label: "전일",
    };
  }

  const days = periodKey === "30d" ? 30 : 7;

  return {
    start: new Date(startOfToday.getTime() - (days - 1) * DAY_MS),
    end: now,
    label: `최근 ${days}일`,
  };
}

export function buildAdTrafficComparison({
  ga4PaidSessions,
  ga4PeriodKey,
  websiteAnalysis,
  websiteError,
}) {
  const ga4PaidSessionCount = toCount(ga4PaidSessions);
  const websiteAvailable =
    !websiteError &&
    Boolean(websiteAnalysis) &&
    Array.isArray(websiteAnalysis.visits);
  const websiteAdVisits = websiteAvailable
    ? websiteAnalysis.visits.length
    : null;
  const duplicateVisitCount = websiteAvailable
    ? toCount(websiteAnalysis.duplicateVisitCount)
    : null;

  return {
    ga4PaidSessions: ga4PaidSessionCount,
    ga4Available: ga4PaidSessionCount !== null,
    websiteAdVisits,
    duplicateVisitCount,
    websiteAvailable,
    samePeriod:
      websiteAvailable &&
      ga4PeriodKey === websiteAnalysis.periodKey,
    showAttributionWarning:
      websiteAvailable &&
      ga4PaidSessionCount === 0 &&
      websiteAdVisits > 0,
  };
}
