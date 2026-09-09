import { supabase } from "@/lib/supabase";
import { isPublicRepairCaseSlug } from "@/lib/publicRepairCases";
import { getRepairServiceSlugs } from "@/lib/repairServices";
import {
  branchSlugs,
  getBranchSeoForRecord,
} from "@/lib/branchSeo";

// Metadata routes are cached by default. The sitemap must reflect a repair
// case immediately after an administrator creates, edits, or deletes it.
export const dynamic = "force-dynamic";

const baseUrl = "https://www.ismileagain.co.kr";
// SEO presentation and internal-link structure were materially updated in this
// release. Keep this date fixed; a rolling build date would overstate freshness.
const SEO_RELEASE_LAST_MODIFIED = new Date("2026-09-09T00:00:00+09:00");

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

function getMostRecentDate(...values) {
  const dates = values.filter((value) => value instanceof Date);

  return dates.reduce(
    (latest, value) => (!latest || value > latest ? value : latest),
    undefined,
  );
}

function isPublicNoticeId(value) {
  return /^\d{1,18}$/.test(String(value ?? ""));
}

async function getSitemapRepairCases() {
  try {
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
      return [];
    }

    return cases || [];
  } catch (error) {
    console.error("sitemap repair_cases exception:", error);
    return [];
  }
}

async function getSitemapNotices() {
  try {
    const { data, error } = await supabase
      .from("notices")
      .select("id, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("sitemap notices error:", error);
      return [];
    }

    return (data || []).filter((item) => isPublicNoticeId(item?.id));
  } catch (error) {
    console.error("sitemap notices exception:", error);
    return [];
  }
}

async function getActiveBranchSlugs() {
  try {
    const { data, error } = await supabase
      .from("branches")
      .select("name, phone, is_active");

    if (error) {
      console.error("sitemap branches error:", error);
      return branchSlugs;
    }

    const explicitlyInactiveSlugs = new Set(
      (data || []).flatMap((branch) => {
        const seo = getBranchSeoForRecord(branch);
        return seo && branch.is_active === false ? [seo.slug] : [];
      }),
    );

    return branchSlugs.filter((slug) => !explicitlyInactiveSlugs.has(slug));
  } catch (error) {
    console.error("sitemap branches exception:", error);
    // Keep verified static branches discoverable during a transient database
    // outage. A successfully read explicit inactive flag is the only state
    // that removes a branch URL.
    return branchSlugs;
  }
}

export default async function sitemap() {
  const [cases, notices, activeBranchSlugs] = await Promise.all([
    getSitemapRepairCases(),
    getSitemapNotices(),
    getActiveBranchSlugs(),
  ]);

  const safeCases = cases.filter((item) =>
    isPublicRepairCaseSlug(item?.slug),
  );

  // 새 글뿐 아니라 기존 글 수정도 홈·목록의 실제 변경으로 반영합니다.
  const latestCaseDate = safeCases.reduce((latest, item) => {
    const modifiedDate = getCaseModifiedDate(item);

    if (!modifiedDate || (latest && modifiedDate <= latest)) {
      return latest;
    }

    return modifiedDate;
  }, SEO_RELEASE_LAST_MODIFIED);

  const latestNoticeDate = notices.reduce((latest, item) => {
    const createdDate = toValidDate(item?.created_at);

    if (!createdDate || (latest && createdDate <= latest)) {
      return latest;
    }

    return createdDate;
  }, SEO_RELEASE_LAST_MODIFIED);

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
      url: `${baseUrl}/contact`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/notices`,
      ...(latestNoticeDate ? { lastModified: latestNoticeDate } : {}),
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
    lastModified: SEO_RELEASE_LAST_MODIFIED,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  const branchPages = activeBranchSlugs.map((slug) => ({
    url: `${baseUrl}/branches/${slug}`,
    lastModified: SEO_RELEASE_LAST_MODIFIED,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  const noticePages = notices.map((item) => {
    const createdDate = toValidDate(item?.created_at);

    return {
      url: `${baseUrl}/notices/${encodeURIComponent(String(item.id))}`,
      lastModified: getMostRecentDate(
        createdDate,
        SEO_RELEASE_LAST_MODIFIED,
      ),
      changeFrequency: "yearly",
      priority: 0.5,
    };
  });

  const repairCasePages = safeCases.map((item) => {
    const modifiedDate = getCaseModifiedDate(item);

    return {
      url: `${baseUrl}/repair-cases/${encodeURIComponent(item.slug)}`,
      lastModified: getMostRecentDate(
        modifiedDate,
        SEO_RELEASE_LAST_MODIFIED,
      ),
      changeFrequency: "monthly",
      priority: 0.8,
    };
  });

  return [
    ...staticPages,
    ...repairServicePages,
    ...branchPages,
    ...noticePages,
    ...repairCasePages,
  ];
}
