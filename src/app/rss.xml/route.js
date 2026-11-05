import { supabase } from "@/lib/supabase";
import {
  getPublicRepairCasePath,
  isPublicRepairCaseSlug,
} from "@/lib/publicRepairCases";
import { getLegacyRepairCaseTitle } from "@/lib/legacyRepairCasePresentation";
import {
  RSS_MAX_BYTES,
  escapeRssXml,
  getLatestRepairCaseRssDate,
  getUtf8ByteLength,
  joinRssItemsWithinBudget,
  makeRepairCaseRssDescription,
} from "@/lib/rssFeed";

const BASE_URL = "https://www.ismileagain.co.kr";

export const revalidate = 3600;

function toRssDate(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toUTCString();
  }

  return date.toUTCString();
}

function makeCaseUrl(item) {
  return `${BASE_URL}${getPublicRepairCasePath(item.slug)}`;
}

export async function GET() {
  const feedFields =
    "title, slug, branch, category, device, model, symptom, repair_content, content_sections, created_at, updated_at";
  const legacyFeedFields =
    "title, slug, branch, category, device, model, symptom, repair_content, content_sections, created_at";

  let { data: cases, error } = await supabase
    .from("repair_cases")
    .select(feedFields)
    .order("created_at", { ascending: false })
    .limit(30);

  // Keep the feed available on an older production schema while the optional
  // updated_at column is being introduced. created_at remains a valid build
  // date fallback for those rows.
  if (error) {
    const fallbackResult = await supabase
      .from("repair_cases")
      .select(legacyFeedFields)
      .order("created_at", { ascending: false })
      .limit(30);

    cases = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    console.error("RSS repair_cases error:", error);
  }

  const renderedItems = (cases || [])
    .filter((item) => item?.title && isPublicRepairCaseSlug(item?.slug))
    .map((item) => {
      const url = makeCaseUrl(item);
      const pubDate = toRssDate(item.created_at);
      const displayTitle =
        getLegacyRepairCaseTitle(item.slug, item.title) || item.title;

      return `
        <item>
          <title>${escapeRssXml(displayTitle)}</title>
          <link>${escapeRssXml(url)}</link>
          <guid isPermaLink="true">${escapeRssXml(url)}</guid>
          <description>${escapeRssXml(makeRepairCaseRssDescription(item))}</description>
          <category>${escapeRssXml(item.category || "수리사례")}</category>
          <pubDate>${pubDate}</pubDate>
        </item>`;
    });

  const channelStart = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>아이스마일어게인 수리사례</title>
    <link>${BASE_URL}</link>
    <description>아이폰, 아이패드, 맥북, 서피스, 노트북 수리사례를 안내하는 아이스마일어게인 공식 RSS입니다.</description>
    <language>ko-KR</language>
    <lastBuildDate>${getLatestRepairCaseRssDate(cases).toUTCString()}</lastBuildDate>
    `;
  const channelEnd = `
  </channel>
</rss>`;
  const itemBudget = RSS_MAX_BYTES - getUtf8ByteLength(channelStart + channelEnd);
  const items = joinRssItemsWithinBudget(renderedItems, itemBudget);
  const xml = `${channelStart}${items}${channelEnd}`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
