import { supabase } from "@/lib/supabase";

const BASE_URL = "https://www.ismileagain.co.kr";

export const revalidate = 3600;

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeXml(value) {
  return cleanText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function limitText(value, maxLength = 180) {
  const text = cleanText(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

function toRssDate(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toUTCString();
  }

  return date.toUTCString();
}

function makeCaseUrl(item) {
  return `${BASE_URL}/repair-cases/${item.slug}`;
}

function makeDescription(item) {
  const branch = cleanText(item.branch);
  const device = cleanText(item.device);
  const model = cleanText(item.model);
  const symptom = cleanText(item.symptom);
  const keyword = cleanText(item.seo_keyword);
  const repairContent = cleanText(item.repair_content);

  const summary = cleanText(
    `${branch} ${device} ${model} ${symptom} ${keyword} 수리사례입니다. 방문 전 수리 가능 여부, 예상 비용, 소요 시간, 택배 접수 방법을 확인해보세요.`
  );

  return limitText(summary || repairContent || item.title, 200);
}

export async function GET() {
  const { data: cases, error } = await supabase
    .from("repair_cases")
    .select(
      "title, slug, branch, category, device, model, symptom, seo_keyword, repair_content, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("RSS repair_cases error:", error);
  }

  const items = (cases || [])
    .filter((item) => item?.title && item?.slug)
    .map((item) => {
      const url = makeCaseUrl(item);
      const pubDate = toRssDate(item.created_at);

      return `
        <item>
          <title>${escapeXml(item.title)}</title>
          <link>${escapeXml(url)}</link>
          <guid isPermaLink="true">${escapeXml(url)}</guid>
          <description>${escapeXml(makeDescription(item))}</description>
          <category>${escapeXml(item.category || "수리사례")}</category>
          <pubDate>${pubDate}</pubDate>
        </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>아이스마일어게인 수리사례</title>
    <link>${BASE_URL}</link>
    <description>아이폰, 아이패드, 맥북, 서피스, 노트북 수리사례를 안내하는 아이스마일어게인 공식 RSS입니다.</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}