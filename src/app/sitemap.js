import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const baseUrl = "https://www.ismileagain.co.kr";

export default async function sitemap() {
  const { data: cases, error } = await supabase
    .from("repair_cases")
    .select("slug, created_at")
    .not("slug", "is", null)
    .neq("slug", "")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("sitemap repair_cases error:", error);
  }

  // 가장 최근 수리사례 등록일
  // 홈과 수리사례 목록은 새 글 등록 시 실제 내용이 바뀌므로 이 날짜를 사용
  const latestCaseDate = cases?.[0]?.created_at
    ? new Date(cases[0].created_at)
    : undefined;

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

  const repairCasePages = (cases || []).map((item) => ({
    url: `${baseUrl}/repair-cases/${encodeURIComponent(item.slug)}`,
    ...(item.created_at
      ? { lastModified: new Date(item.created_at) }
      : {}),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...repairCasePages];
}