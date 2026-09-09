import "server-only";

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";

export const PUBLIC_POPUP_NOTICE_CACHE_TAG = "public-popup-notice";

const ALLOWED_POSITIONS = new Set([
  "center",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "custom",
]);

function getSeoulDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function safeText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function safeImageUrl(value) {
  const url = safeText(value, 2048);

  if (!url) return "";
  if (url.startsWith("/")) return url;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : "";
  } catch {
    return "";
  }
}

function clampWidth(value) {
  const width = Number(value);

  if (!Number.isFinite(width)) return 420;
  return Math.min(520, Math.max(280, Math.round(width)));
}

function toPublicPopup(row) {
  if (!row) return null;

  return {
    id: row.id,
    title: safeText(row.title, 200),
    content: safeText(row.content, 20000),
    image_url: safeImageUrl(row.image_url),
    position: ALLOWED_POSITIONS.has(row.position)
      ? row.position
      : "bottom-right",
    width: clampWidth(row.width),
    show_today_close: Boolean(row.show_today_close),
  };
}

export const getActivePublicPopupNotice = unstable_cache(
  async () => {
    const today = getSeoulDate();
    const { data, error } = await supabase
      .from("popup_notices")
      .select(
        "id,title,content,image_url,position,width,show_today_close,sort_order,created_at",
      )
      .eq("is_active", true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`활성 팝업 조회 실패: ${error.message}`);
    }

    return toPublicPopup(data);
  },
  ["active-public-popup-notice"],
  {
    revalidate: 300,
    tags: [PUBLIC_POPUP_NOTICE_CACHE_TAG],
  },
);
