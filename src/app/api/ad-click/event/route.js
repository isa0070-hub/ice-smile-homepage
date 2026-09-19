import { isSameOriginRequest } from "@/lib/adminSession";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set([
  "phone_list_open",
  "phone_click",
  "naver_talk_click",
  "kakao_talk_click",
  "online_inquiry_click",
  "generate_lead",
]);

const MAX_BODY_SIZE = 4096;

function cleanText(value, max = 300) {
  if (typeof value !== "string") return null;

  const cleaned = value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

  return cleaned || null;
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { success: false },
      { status: 403 }
    );
  }

  if (
    Number(request.headers.get("content-length") || 0) >
    MAX_BODY_SIZE
  ) {
    return Response.json(
      { success: false },
      { status: 413 }
    );
  }

  try {
    const body = await request.json();

    const visitId = cleanText(body?.visitId, 100);
    const eventType = cleanText(body?.eventType, 50);

    if (
      !visitId ||
      !eventType ||
      !ALLOWED_EVENTS.has(eventType)
    ) {
      return Response.json(
        { success: false },
        { status: 400 }
      );
    }

    // 실제 광고 방문인지 서버에서 확인
    const { data: visit, error: visitError } =
      await supabaseAdmin
        .from("ad_click_visits")
        .select("id")
        .eq("id", visitId)
        .maybeSingle();

    if (visitError || !visit) {
      return Response.json(
        { success: false },
        { status: 404 }
      );
    }

    const metadata = {
      contactType: cleanText(body?.contactType, 50),
      linkText: cleanText(body?.linkText, 120),
      linkUrl: cleanText(body?.linkUrl, 500),
      formLocation: cleanText(body?.formLocation, 100),
      preferredBranch: cleanText(body?.preferredBranch, 50),
    };

    const { error } = await supabaseAdmin
      .from("ad_click_events")
      .insert({
        visit_id: String(visit.id),
        event_type: eventType,
        page_path: cleanText(body?.pagePath, 500),
        metadata,
      });

    if (error) {
      console.error("광고 문의행동 저장 오류:", error);

      return Response.json(
        { success: false },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
    });
  } catch {
    return Response.json(
      { success: false },
      { status: 400 }
    );
  }
}
