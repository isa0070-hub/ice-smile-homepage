import "server-only";

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";

export const PUBLIC_REPAIR_CASES_CACHE_TAG = "public-repair-cases";

const RELATED_FIELDS =
  "id,slug,title,image_url,alt_text,branch,category,device,model,seo_keyword,symptom,created_at";
const RELATED_FILTER_FIELDS = new Set(["device", "category", "branch"]);

function databaseError(context, error) {
  console.error(`${context}:`, error);
  throw new Error("수리사례 자료를 불러오지 못했습니다.");
}

const getCachedRepairCaseBySlug = unstable_cache(
  async (slug) => {
    const { data, error } = await supabase
      .from("repair_cases")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      databaseError("repair case detail error", error);
    }

    return data;
  },
  ["public-repair-case-by-slug"],
  {
    revalidate: 3600,
    tags: [PUBLIC_REPAIR_CASES_CACHE_TAG],
  },
);

const getCachedRepairCaseImages = unstable_cache(
  async (repairCaseId) => {
    const { data, error } = await supabase
      .from("repair_case_images")
      .select("id,image_url,alt_text,description,sort_order")
      .eq("repair_case_id", repairCaseId)
      .order("sort_order", { ascending: true });

    if (error) {
      databaseError("repair case images error", error);
    }

    return data || [];
  },
  ["public-repair-case-images"],
  {
    revalidate: 3600,
    tags: [PUBLIC_REPAIR_CASES_CACHE_TAG],
  },
);

const getCachedRelatedRepairCaseRows = unstable_cache(
  async (field, value, excludedId) => {
    if (!RELATED_FILTER_FIELDS.has(field)) {
      throw new Error("지원하지 않는 수리사례 연관 조건입니다.");
    }

    const { data, error } = await supabase
      .from("repair_cases")
      .select(RELATED_FIELDS)
      .eq(field, value)
      .neq("id", excludedId)
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) {
      databaseError("related repair cases error", error);
    }

    return data || [];
  },
  ["public-related-repair-case-rows"],
  {
    revalidate: 3600,
    tags: [PUBLIC_REPAIR_CASES_CACHE_TAG],
  },
);

export async function getPublicRepairCaseBySlug(slug) {
  const normalizedSlug = String(slug || "").trim();

  if (!normalizedSlug) return null;
  return getCachedRepairCaseBySlug(normalizedSlug);
}

export async function getPublicRepairCaseImages(repairCaseId) {
  if (repairCaseId === null || repairCaseId === undefined) return [];
  return getCachedRepairCaseImages(repairCaseId);
}

export async function getPublicRelatedRepairCaseRows(
  field,
  value,
  excludedId,
) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) return [];
  return getCachedRelatedRepairCaseRows(field, normalizedValue, excludedId);
}
