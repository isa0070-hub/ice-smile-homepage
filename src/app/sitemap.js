import { supabase } from "@/lib/supabase";

export default async function sitemap() {
  const baseUrl = "https://www.icesmileagain.com";

  const { data: cases, error } = await supabase
    .from("repair_cases")
    .select("slug, created_at")
    .not("slug", "is", null)
    .neq("slug", "")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("sitemap repair_cases error:", error);
  }

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/repair-cases`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/notices`,
      lastModified: new Date(),
    },
  ];

  const repairCasePages =
    cases?.map((item) => ({
      url: `${baseUrl}/repair-cases/${encodeURIComponent(item.slug)}`,
      lastModified: item.created_at ? new Date(item.created_at) : new Date(),
    })) || [];

  return [...staticPages, ...repairCasePages];
}