export const V2_UTM_CAMPAIGN = "iphone_visit_v2";

export const UTM_ATTRIBUTION_SCOPES = Object.freeze({
  V2: "v2",
  OTHER: "other",
  ALL: "all",
});

export const UTM_INQUIRY_EVENTS = new Set([
  "phone_click",
  "naver_talk_click",
  "online_inquiry_click",
  "generate_lead",
]);

function asObject(value) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return {};
}

function normalized(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

export function getVisitUtm(visit = {}) {
  const query = asObject(visit.query_params);

  return {
    source:
      normalized(visit.traffic_source) ??
      normalized(query.utm_source),
    medium:
      normalized(visit.traffic_medium) ??
      normalized(query.utm_medium),
    campaign:
      normalized(visit.campaign) ??
      normalized(query.utm_campaign),
    content: normalized(query.utm_content),
  };
}

function emptyEventCounts() {
  return {
    actionEvents: 0,
    phoneClicks: 0,
    naverTalkClicks: 0,
    onlineInquiryClicks: 0,
    submittedLeads: 0,
  };
}

function addEvent(counts, eventType) {
  if (!UTM_INQUIRY_EVENTS.has(eventType)) {
    return;
  }

  counts.actionEvents += 1;

  if (eventType === "phone_click") {
    counts.phoneClicks += 1;
  } else if (eventType === "naver_talk_click") {
    counts.naverTalkClicks += 1;
  } else if (eventType === "online_inquiry_click") {
    counts.onlineInquiryClicks += 1;
  } else if (eventType === "generate_lead") {
    counts.submittedLeads += 1;
  }
}

function groupKey(utm) {
  return [
    utm.source,
    utm.medium,
    utm.campaign,
    utm.content,
  ]
    .map((value) => value ?? "")
    .join("\u001f");
}

export function buildUtmAttribution(
  visits = [],
  events = []
) {
  const eventsByVisit = new Map();

  for (const event of events) {
    const visitId = String(event?.visit_id ?? "");

    if (
      !visitId ||
      !UTM_INQUIRY_EVENTS.has(event?.event_type)
    ) {
      continue;
    }

    if (!eventsByVisit.has(visitId)) {
      eventsByVisit.set(visitId, []);
    }

    eventsByVisit.get(visitId).push(event.event_type);
  }

  const groups = new Map();

  for (const visit of visits) {
    const visitId = String(visit?.id ?? "");
    if (!visitId) continue;

    const utm = getVisitUtm(visit);
    const key = groupKey(utm);

    if (!groups.has(key)) {
      groups.set(key, {
        ...utm,
        visits: 0,
        uniqueActionVisits: 0,
        lastVisitAt: null,
        ...emptyEventCounts(),
      });
    }

    const group = groups.get(key);
    group.visits += 1;

    const clickedAt = normalized(visit.clicked_at);
    if (
      clickedAt &&
      (!group.lastVisitAt ||
        new Date(clickedAt).getTime() >
          new Date(group.lastVisitAt).getTime())
    ) {
      group.lastVisitAt = clickedAt;
    }

    const visitEvents = eventsByVisit.get(visitId) || [];

    if (visitEvents.length > 0) {
      group.uniqueActionVisits += 1;
    }

    for (const eventType of visitEvents) {
      addEvent(group, eventType);
    }
  }

  return [...groups.values()].sort((a, b) => {
    const timeDifference =
      new Date(b.lastVisitAt || 0).getTime() -
      new Date(a.lastVisitAt || 0).getTime();

    if (timeDifference !== 0) return timeDifference;
    return b.visits - a.visits;
  });
}

export function filterUtmAttributionRows(
  rows = [],
  scope = UTM_ATTRIBUTION_SCOPES.V2
) {
  if (scope === UTM_ATTRIBUTION_SCOPES.ALL) {
    return [...rows];
  }

  if (scope === UTM_ATTRIBUTION_SCOPES.OTHER) {
    return rows.filter(
      (row) => row.campaign !== V2_UTM_CAMPAIGN
    );
  }

  return rows.filter(
    (row) => row.campaign === V2_UTM_CAMPAIGN
  );
}

export function summarizeUtmAttribution(rows = []) {
  const summary = {
    visits: 0,
    uniqueActionVisits: 0,
    lastVisitAt: null,
    ...emptyEventCounts(),
  };

  for (const row of rows) {
    summary.visits += Number(row.visits || 0);
    summary.uniqueActionVisits += Number(
      row.uniqueActionVisits || 0
    );
    summary.actionEvents += Number(row.actionEvents || 0);
    summary.phoneClicks += Number(row.phoneClicks || 0);
    summary.naverTalkClicks += Number(
      row.naverTalkClicks || 0
    );
    summary.onlineInquiryClicks += Number(
      row.onlineInquiryClicks || 0
    );
    summary.submittedLeads += Number(
      row.submittedLeads || 0
    );

    if (
      row.lastVisitAt &&
      (!summary.lastVisitAt ||
        new Date(row.lastVisitAt).getTime() >
          new Date(summary.lastVisitAt).getTime())
    ) {
      summary.lastVisitAt = row.lastVisitAt;
    }
  }

  return summary;
}

export function getKstDateRange(since, until) {
  const next = new Date(`${until}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);

  return {
    startIso: new Date(
      `${since}T00:00:00+09:00`
    ).toISOString(),
    endExclusiveIso: new Date(
      `${next.toISOString().slice(0, 10)}T00:00:00+09:00`
    ).toISOString(),
  };
}
