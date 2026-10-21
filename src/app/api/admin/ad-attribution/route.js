import {
  adminErrorResponse,
  adminSuccessResponse,
  requireAdminRequest,
} from "@/lib/adminApi";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  UTM_INQUIRY_EVENTS,
  buildUtmAttribution,
  getKstDateRange,
} from "@/lib/utmAttribution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_EVENTS = new Set([
  "phone_click",
  "naver_talk_click",
  "generate_lead",
]);

const UTM_VISIT_LIMIT = 10_000;
const UTM_EVENT_LIMIT_PER_BATCH = 5_000;
const PAGE_SIZE = 1_000;

function validDate(value) {
  const text = String(value || "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }

  const date = new Date(`${text}T00:00:00Z`);

  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === text
  );
}

function asObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
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

function emptyCounts() {
  return {
    inquiryActions: 0,
    phone: 0,
    naverTalk: 0,
    onlineInquiry: 0,
  };
}

function addEvent(counts, eventType) {
  if (eventType === "phone_click") {
    counts.phone += 1;
    counts.inquiryActions += 1;
  }

  if (eventType === "naver_talk_click") {
    counts.naverTalk += 1;
    counts.inquiryActions += 1;
  }

  if (eventType === "generate_lead") {
    counts.onlineInquiry += 1;
    counts.inquiryActions += 1;
  }
}

async function loadVisits(ids) {
  const result = [];

  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);

    const { data, error } = await supabaseAdmin
      .from("ad_click_visits")
      .select(
        "id,traffic_source,search_keyword,naver_tracking,clicked_at"
      )
      .in("id", batch);

    if (error) {
      throw error;
    }

    result.push(...(data || []));
  }

  return result;
}

async function loadUtmVisits(startIso, endExclusiveIso) {
  const rows = [];

  for (
    let from = 0;
    from < UTM_VISIT_LIMIT;
    from += PAGE_SIZE
  ) {
    const to = Math.min(
      from + PAGE_SIZE - 1,
      UTM_VISIT_LIMIT - 1
    );

    const { data, error } = await supabaseAdmin
      .from("ad_click_visits")
      .select(
        [
          "id",
          "clicked_at",
          "traffic_source",
          "traffic_medium",
          "campaign",
          "query_params",
        ].join(",")
      )
      .gte("clicked_at", startIso)
      .lt("clicked_at", endExclusiveIso)
      .order("clicked_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const batch = data || [];
    rows.push(...batch);

    if (batch.length < PAGE_SIZE) break;
  }

  return {
    rows,
    reachedLimit: rows.length >= UTM_VISIT_LIMIT,
  };
}

async function loadUtmEvents(visitIds) {
  const rows = [];
  let reachedLimit = false;

  for (let i = 0; i < visitIds.length; i += 100) {
    const visitBatch = visitIds.slice(i, i + 100);

    for (
      let from = 0;
      from < UTM_EVENT_LIMIT_PER_BATCH;
      from += PAGE_SIZE
    ) {
      const to = Math.min(
        from + PAGE_SIZE - 1,
        UTM_EVENT_LIMIT_PER_BATCH - 1
      );

      const { data, error } = await supabaseAdmin
        .from("ad_click_events")
        .select("visit_id,event_type,created_at")
        .in("visit_id", visitBatch)
        .in("event_type", [...UTM_INQUIRY_EVENTS])
        .order("created_at", { ascending: true })
        .range(from, to);

      if (error) throw error;

      const batch = data || [];
      rows.push(...batch);

      if (batch.length < PAGE_SIZE) break;

      if (
        from + PAGE_SIZE >=
        UTM_EVENT_LIMIT_PER_BATCH
      ) {
        reachedLimit = true;
      }
    }
  }

  return { rows, reachedLimit };
}

export async function GET(request) {
  const authError = requireAdminRequest(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);

    const since = searchParams.get("since");
    const until = searchParams.get("until");

    if (
      !validDate(since) ||
      !validDate(until) ||
      since > until
    ) {
      return adminErrorResponse(
        "조회 기간 형식이 올바르지 않습니다.",
        400
      );
    }

    const {
      startIso: sinceIso,
      endExclusiveIso: untilExclusiveIso,
    } = getKstDateRange(since, until);

    const utmVisitResult = await loadUtmVisits(
      sinceIso,
      untilExclusiveIso
    );

    const utmEventResult = await loadUtmEvents(
      utmVisitResult.rows.map((visit) => String(visit.id))
    );

    const utm = {
      available: true,
      rows: buildUtmAttribution(
        utmVisitResult.rows,
        utmEventResult.rows
      ),
      visitCount: utmVisitResult.rows.length,
      reachedLimit:
        utmVisitResult.reachedLimit ||
        utmEventResult.reachedLimit,
      definitions: {
        visits:
          "선택한 KST 기간에 저장된 광고 방문 행 수",
        actionEvents:
          "해당 방문에 연결된 전화 버튼·네이버 톡톡·온라인접수 클릭 및 접수 저장 성공 이벤트 행 수",
        uniqueActionVisits:
          "문의행동 이벤트가 하나 이상 연결된 고유 광고 방문 수",
      },
    };

    const { data: events, error: eventError } =
      await supabaseAdmin
        .from("ad_click_events")
        .select(
          "visit_id,event_type,created_at,metadata"
        )
        .gte("created_at", sinceIso)
        .lt("created_at", untilExclusiveIso)
        .in("event_type", [
          "phone_click",
          "naver_talk_click",
          "generate_lead",
        ])
        .order("created_at", {
          ascending: true,
        });

    if (eventError) {
      throw eventError;
    }

    const visitIds = [
      ...new Set(
        (events || [])
          .map((event) => String(event.visit_id || ""))
          .filter(Boolean)
      ),
    ];

    if (!visitIds.length) {
      return adminSuccessResponse({
        since,
        until,
        utm,
        summary: {
          ...emptyCounts(),
          inquiryVisits: 0,
        },
        adgroups: [],
        keywords: [],
      });
    }

    const visits = await loadVisits(visitIds);

    const visitMap = new Map(
      visits.map((visit) => [
        String(visit.id),
        visit,
      ])
    );

    const summary = emptyCounts();
    const inquiryVisitIds = new Set();

    const adgroupMap = new Map();
    const keywordMap = new Map();

    for (const event of events || []) {
      if (!VALID_EVENTS.has(event.event_type)) {
        continue;
      }

      const visit = visitMap.get(
        String(event.visit_id)
      );

      if (!visit) {
        continue;
      }

      const tracking = asObject(
        visit.naver_tracking
      );

      const isNaver =
        String(visit.traffic_source || "")
          .toLowerCase() === "naver" ||
        Object.keys(tracking).length > 0;

      if (!isNaver) {
        continue;
      }

      addEvent(summary, event.event_type);
      inquiryVisitIds.add(String(visit.id));

      const adgroupId =
        tracking.n_ad_group ||
        "unknown";

      const keywordId =
        tracking.n_keyword_id ||
        "unknown";

      const keywordName =
        tracking.n_keyword ||
        visit.search_keyword ||
        "키워드 확인 필요";

      if (!adgroupMap.has(adgroupId)) {
        adgroupMap.set(adgroupId, {
          adgroupId,
          ...emptyCounts(),
          inquiryVisits: new Set(),
        });
      }

      const adgroup =
        adgroupMap.get(adgroupId);

      addEvent(
        adgroup,
        event.event_type
      );

      adgroup.inquiryVisits.add(
        String(visit.id)
      );

      const keywordKey =
        `${adgroupId}:${keywordId}:${keywordName}`;

      if (!keywordMap.has(keywordKey)) {
        keywordMap.set(keywordKey, {
          adgroupId,
          keywordId,
          keyword: keywordName,
          ...emptyCounts(),
          inquiryVisits: new Set(),
        });
      }

      const keyword =
        keywordMap.get(keywordKey);

      addEvent(
        keyword,
        event.event_type
      );

      keyword.inquiryVisits.add(
        String(visit.id)
      );
    }

    const normalize = (row) => ({
      ...row,
      inquiryVisits:
        row.inquiryVisits.size,
    });

    const adgroups = [
      ...adgroupMap.values(),
    ]
      .map(normalize)
      .sort(
        (a, b) =>
          b.inquiryActions -
          a.inquiryActions
      );

    const keywords = [
      ...keywordMap.values(),
    ]
      .map(normalize)
      .sort(
        (a, b) =>
          b.inquiryActions -
          a.inquiryActions
      )
      .slice(0, 20);

    return adminSuccessResponse({
      since,
      until,
      utm,

      summary: {
        ...summary,
        inquiryVisits:
          inquiryVisitIds.size,
      },

      adgroups,
      keywords,
    });
  } catch (error) {
    console.error(
      "광고 문의행동 연결 조회 오류:",
      error
    );

    return adminErrorResponse(
      "광고 문의행동 데이터를 불러오지 못했습니다.",
      500
    );
  }
}
