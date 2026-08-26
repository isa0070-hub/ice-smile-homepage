import { supabase } from "@/lib/supabase";
import { isPublicRepairCaseSlug } from "@/lib/publicRepairCases";
import { getRepairServiceSlugs } from "@/lib/repairServices";

// Metadata routes are cached by default. The sitemap must reflect a repair
// case immediately after an administrator creates, edits, or deletes it.
export const dynamic = "force-dynamic";

const baseUrl = "https://www.ismileagain.co.kr";

function toValidDate(value) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getCaseModifiedDate(item) {
  return toValidDate(item?.updated_at) || toValidDate(item?.created_at);
}

export default async function sitemap() {
  let { data: cases, error } = await supabase
    .from("repair_cases")
    .select("slug, created_at, updated_at")
    .not("slug", "is", null)
    .neq("slug", "")
    .order("created_at", { ascending: false });

  // Older production schemas may not have updated_at yet. A missing optional
  // column must never empty the entire sitemap, so fall back to created_at.
  if (error) {
    const fallbackResult = await supabase
      .from("repair_cases")
      .select("slug, created_at")
      .not("slug", "is", null)
      .neq("slug", "")
      .order("created_at", { ascending: false });

    cases = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    console.error("sitemap repair_cases error:", error);
    // Keep the core static/service URLs crawlable when the optional
    // repair-case query is temporarily unavailable.
    cases = [];
  }

  const safeCases = (cases || []).filter((item) =>
    isPublicRepairCaseSlug(item?.slug),
  );

  // 새 글뿐 아니라 기존 글 수정도 홈·목록의 실제 변경으로 반영합니다.
  const latestCaseDate = safeCases.reduce((latest, item) => {
    const modifiedDate = getCaseModifiedDate(item);

    if (!modifiedDate || (latest && modifiedDate <= latest)) {
      return latest;
    }

    return modifiedDate;
  }, undefined);

  const staticPages = [
    {
      url: baseUrl,
      ...(latestCaseDate ? { lastModified: latestCaseDate } : {}),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/repair-cases`,
      ...(latestCaseDate ? { lastModified: latestCaseDate } : {}),
      changeFrequency: "daily",
      priority: 0.9,
    },

    // 15순위: 지점안내 검색 페이지
    {
      url: `${baseUrl}/branches`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/branches/gangbyeon`,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/branches/seolleung`,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/branches/sindorim`,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    
    {
      url: `${baseUrl}/contact`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/notices`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const repairServicePages = getRepairServiceSlugs().map((slug) => ({
    url: `${baseUrl}/repair-services/${slug}`,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  const repairCasePages = safeCases.map((item) => {
    const modifiedDate = getCaseModifiedDate(item);

    return {
      url: `${baseUrl}/repair-cases/${encodeURIComponent(item.slug)}`,
      ...(modifiedDate ? { lastModified: modifiedDate } : {}),
      changeFrequency: "monthly",
      priority: 0.8,
    };
  });

  return [...staticPages, ...repairServicePages, ...repairCasePages];
}
