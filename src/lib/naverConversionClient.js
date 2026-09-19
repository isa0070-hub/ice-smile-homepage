const CACHE_PREFIX =
  "ismile_naver_conversion_v1_";

function dateList(since, until) {
  const result = [];

  const cursor =
    new Date(`${since}T12:00:00Z`);

  const end =
    new Date(`${until}T12:00:00Z`);

  while (cursor <= end) {
    result.push(
      cursor.toISOString().slice(0, 10)
    );

    cursor.setUTCDate(
      cursor.getUTCDate() + 1
    );
  }

  return result;
}

function readCache(date) {
  try {
    const value =
      window.localStorage.getItem(
        `${CACHE_PREFIX}${date}`
      );

    return value
      ? JSON.parse(value)
      : null;
  } catch {
    return null;
  }
}

function writeCache(date, value) {
  try {
    window.localStorage.setItem(
      `${CACHE_PREFIX}${date}`,
      JSON.stringify(value)
    );
  } catch {
    // 캐시 실패는 분석을 막지 않는다.
  }
}

async function fetchDay(date) {
  const cached =
    readCache(date);

  if (cached?.ok === true) {
    return cached;
  }

  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(
        "/api/naver-ads/conversion-daily",
        {
          method: "POST",
          credentials: "same-origin",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            date,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            `전환 데이터 조회 실패 (${response.status})`
        );
      }

      writeCache(
        date,
        data
      );

      return data;
    } catch (error) {
      lastError = error;

      if (attempt === 0) {
        await new Promise(
          (resolve) =>
            window.setTimeout(
              resolve,
              800
            )
        );
      }
    }
  }

  throw lastError;
}

function empty() {
  return {
    phoneGangbyeon: 0,
    phoneSeolleung: 0,
    phoneSindorim: 0,
    phoneTotal: 0,
    naverTalk: 0,
    onlineInquiry: 0,
    inquiryActions: 0,
    assistInquiryClick: 0,
    assistPhoneListOpen: 0,
    assistTotal: 0,
    rawConversions: 0,
    byAdgroup: {},
    byKeyword: {},
    days: [],
  };
}

function mergeEntityMap(
  target,
  source
) {
  for (
    const [id, value]
    of Object.entries(source || {})
  ) {
    if (!target[id]) {
      target[id] = {
        rawConversions: 0,
        valid: 0,
        assist: 0,
      };
    }

    target[id].rawConversions +=
      Number(value.rawConversions || 0);

    target[id].valid +=
      Number(value.valid || 0);

    target[id].assist +=
      Number(value.assist || 0);
  }
}

export function summarizeConversionDays(days) {
  const result = empty();

  for (const day of days) {
    result.phoneGangbyeon +=
      Number(day.phoneGangbyeon || 0);

    result.phoneSeolleung +=
      Number(day.phoneSeolleung || 0);

    result.phoneSindorim +=
      Number(day.phoneSindorim || 0);

    result.phoneTotal +=
      Number(day.phoneTotal || 0);

    result.naverTalk +=
      Number(day.naverTalk || 0);

    result.onlineInquiry +=
      Number(day.onlineInquiry || 0);

    result.inquiryActions +=
      Number(day.inquiryActions || 0);

    result.assistInquiryClick +=
      Number(day.assistInquiryClick || 0);

    result.assistPhoneListOpen +=
      Number(day.assistPhoneListOpen || 0);

    result.assistTotal +=
      Number(day.assistTotal || 0);

    result.rawConversions +=
      Number(day.rawConversions || 0);

    mergeEntityMap(
      result.byAdgroup,
      day.byAdgroup
    );

    mergeEntityMap(
      result.byKeyword,
      day.byKeyword
    );
  }

  result.days = days;

  return result;
}

export async function getConversionRange(
  since,
  until,
  onProgress
) {
  const dates =
    dateList(since, until);

  const rows =
    new Array(dates.length);

  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (true) {
      const index = cursor++;

      if (index >= dates.length) {
        return;
      }

      rows[index] =
        await fetchDay(
          dates[index]
        );

      completed += 1;

      if (onProgress) {
        onProgress(
          completed,
          dates.length
        );
      }
    }
  }

  // 네이버에 한꺼번에 너무 많은 보고서를 만들지 않는다.
  await Promise.all([
    worker(),
    worker(),
  ]);

  return summarizeConversionDays(
    rows
  );
}

export function conversionMetrics(
  summary,
  clicks,
  cost
) {
  const actions =
    Number(
      summary?.inquiryActions || 0
    );

  const safeClicks =
    Number(clicks || 0);

  const safeCost =
    Number(cost || 0);

  return {
    inquiryActions:
      actions,

    inquiryCvr:
      safeClicks > 0
        ? (actions / safeClicks) * 100
        : 0,

    inquiryCpa:
      actions > 0
        ? Math.round(
            safeCost / actions
          )
        : 0,
  };
}
