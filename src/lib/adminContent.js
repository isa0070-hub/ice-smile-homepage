import "server-only";

import { redirect } from "next/navigation";
import { hasAdminServerSession } from "@/lib/adminApi";
import {
  getBranchDisplayData,
  getBranchSeoForRecord,
} from "@/lib/branchSeo";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const RESOURCE_CONFIG = Object.freeze({
  branches: {
    table: "branches",
    order: [["sort_order", true]],
    canCreate: false,
    canDelete: false,
  },
  notices: {
    table: "notices",
    order: [
      ["is_pinned", false],
      ["created_at", false],
    ],
  },
  popups: {
    table: "popup_notices",
    order: [["created_at", false]],
  },
  "repair-cases": {
    table: "repair_cases",
    order: [["created_at", false]],
  },
  "repair-case-images": {
    table: "repair_case_images",
    order: [["sort_order", true]],
  },
  "morning-notes": {
    table: "gm_morning_notes",
    order: [["note_date", false]],
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  },
});

const MAX_LIST_ROWS = 1000;
const POSITION_VALUES = new Set([
  "center",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "custom",
]);

export class AdminContentError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "AdminContentError";
    this.status = status;
  }
}

function getResourceConfig(resource) {
  const config = RESOURCE_CONFIG[resource];

  if (!config) {
    throw new AdminContentError("지원하지 않는 관리자 자료입니다.", 404);
  }

  return config;
}

function normalizeId(value, label = "자료 번호") {
  const normalized = String(value ?? "").trim();

  if (!/^\d{1,18}$/.test(normalized) || normalized === "0") {
    throw new AdminContentError(`${label}가 올바르지 않습니다.`);
  }

  return normalized;
}

function text(value, label, { required = false, max = 5000 } = {}) {
  if (value === null || value === undefined) {
    if (required) {
      throw new AdminContentError(`${label}을(를) 입력해주세요.`);
    }

    return "";
  }

  const normalized = String(value).trim();

  if (required && !normalized) {
    throw new AdminContentError(`${label}을(를) 입력해주세요.`);
  }

  if (normalized.length > max) {
    throw new AdminContentError(`${label}은(는) ${max}자 이하로 입력해주세요.`);
  }

  return normalized;
}

function boolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function integer(value, label, { fallback = 0, min = -100000, max = 100000 } = {}) {
  const parsed = value === "" || value === null || value === undefined
    ? fallback
    : Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new AdminContentError(`${label} 값이 올바르지 않습니다.`);
  }

  return parsed;
}

function optionalDate(value, label) {
  if (!value) return null;

  const normalized = text(value, label, { max: 50 });

  if (Number.isNaN(Date.parse(normalized))) {
    throw new AdminContentError(`${label} 값이 올바르지 않습니다.`);
  }

  return normalized;
}

function optionalUrl(value, label) {
  const normalized = text(value, label, { max: 2048 });

  if (!normalized) return "";

  if (normalized.startsWith("/")) return normalized;

  let parsed;

  try {
    parsed = new URL(normalized);
  } catch {
    throw new AdminContentError(`${label} 주소가 올바르지 않습니다.`);
  }

  if (!new Set(["https:", "http:"]).has(parsed.protocol)) {
    throw new AdminContentError(`${label}은(는) 웹 주소만 사용할 수 있습니다.`);
  }

  return parsed.toString();
}

function sanitizeNotice(payload) {
  return {
    title: text(payload?.title, "제목", { required: true, max: 200 }),
    content: text(payload?.content, "내용", { required: true, max: 50000 }),
    is_pinned: boolean(payload?.is_pinned),
  };
}

function sanitizePopup(payload, { updating = false } = {}) {
  const position = text(payload?.position, "팝업 위치", {
    required: true,
    max: 30,
  });

  if (!POSITION_VALUES.has(position)) {
    throw new AdminContentError("팝업 위치 값이 올바르지 않습니다.");
  }

  const data = {
    title: text(payload?.title, "팝업 제목", { required: true, max: 200 }),
    content: text(payload?.content, "팝업 내용", { max: 20000 }),
    image_url: optionalUrl(payload?.image_url, "팝업 이미지"),
    position,
    custom_x: integer(payload?.custom_x, "X 위치", { fallback: 0 }),
    custom_y: integer(payload?.custom_y, "Y 위치", { fallback: 0 }),
    width: integer(payload?.width, "가로 크기", {
      fallback: 500,
      min: 100,
      max: 2400,
    }),
    height: integer(payload?.height, "세로 크기", {
      fallback: 600,
      min: 100,
      max: 2400,
    }),
    is_active: boolean(payload?.is_active, true),
    show_today_close: boolean(payload?.show_today_close, true),
    sort_order: integer(payload?.sort_order, "정렬 순서", { fallback: 0 }),
  };

  if (updating) {
    data.start_date = optionalDate(payload?.start_date, "시작일");
    data.end_date = optionalDate(payload?.end_date, "종료일");
    data.updated_at = new Date().toISOString();
  }

  return data;
}

function sanitizeBranch(payload) {
  return {
    visit_info: text(payload?.visit_info, "방문 안내", { max: 10000 }),
    map_image: optionalUrl(payload?.map_image, "약도 이미지"),
    is_active: boolean(payload?.is_active),
    sort_order: integer(payload?.sort_order, "정렬 순서", { fallback: 0 }),
  };
}

function sanitizeContentSections(value) {
  if (value === null || value === undefined) return null;

  if (!Array.isArray(value) || value.length > 100) {
    throw new AdminContentError("본문 구성이 올바르지 않습니다.");
  }

  return value.map((section, index) => ({
    ...(section?.type === "closing" ? { type: "closing" } : {}),
    title: text(section?.title, `본문 ${index + 1} 제목`, { max: 200 }),
    content: text(section?.content, `본문 ${index + 1} 내용`, { max: 50000 }),
    image_start:
      section?.image_start === null || section?.image_start === undefined
        ? null
        : integer(section.image_start, "사진 시작 번호", {
            min: 0,
            max: 1000,
          }),
    image_end:
      section?.image_end === null || section?.image_end === undefined
        ? null
        : integer(section.image_end, "사진 끝 번호", {
            min: 0,
            max: 1000,
          }),
  }));
}

function sanitizeRepairCase(payload, { creating = false } = {}) {
  const slug = text(payload?.slug, "SEO 주소", { required: true, max: 200 })
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  if (!/^[a-z0-9가-힣-]+$/.test(slug)) {
    throw new AdminContentError(
      "SEO 주소에는 영문 소문자, 숫자, 한글, 하이픈만 사용할 수 있습니다.",
    );
  }

  const data = {
    title: text(payload?.title, "제목", { required: true, max: 300 }),
    slug,
    category: text(payload?.category, "카테고리", { required: true, max: 100 }),
    branch: text(payload?.branch, "지점", { required: true, max: 100 }),
    device: text(payload?.device, "기기", { required: creating, max: 200 }),
    model: text(payload?.model, "모델명", { max: 200 }),
    symptom: text(payload?.symptom, "증상", { required: creating, max: 500 }),
    repair_content: text(payload?.repair_content, "수리 내용", {
      required: creating,
      max: 100000,
    }),
    seo_keyword: text(payload?.seo_keyword, "SEO 키워드", { max: 1000 }),
    image_url: optionalUrl(payload?.image_url, "대표 이미지"),
    alt_text: text(payload?.alt_text, "대표 이미지 ALT", { max: 1000 }),
  };

  if (creating) {
    data.blog_url = optionalUrl(payload?.blog_url, "블로그 주소");
    data.blog_title = text(payload?.blog_title, "블로그 제목", { max: 500 });
    data.content_sections = sanitizeContentSections(payload?.content_sections);
  }

  return data;
}

function sanitizeRepairImage(payload, { requireCaseId = false } = {}) {
  const data = {
    image_url: optionalUrl(payload?.image_url, "상세 이미지"),
    description: text(payload?.description, "사진 설명", { max: 10000 }),
    alt_text: text(payload?.alt_text, "사진 ALT", { max: 1000 }),
    sort_order: integer(payload?.sort_order, "사진 순서", {
      fallback: 0,
      min: 0,
      max: 10000,
    }),
  };

  if (!data.image_url) {
    throw new AdminContentError("상세 이미지 주소가 필요합니다.");
  }

  if (requireCaseId) {
    data.repair_case_id = Number(
      normalizeId(payload?.repair_case_id, "수리사례 번호"),
    );
  }

  return data;
}

function sanitizeResource(resource, payload, options = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AdminContentError("입력값이 올바르지 않습니다.");
  }

  switch (resource) {
    case "branches":
      return sanitizeBranch(payload);
    case "notices":
      return sanitizeNotice(payload);
    case "popups":
      return sanitizePopup(payload, options);
    case "repair-cases":
      return sanitizeRepairCase(payload, options);
    case "repair-case-images":
      return sanitizeRepairImage(payload, {
        requireCaseId: options.creating,
      });
    default:
      throw new AdminContentError("수정할 수 없는 관리자 자료입니다.", 405);
  }
}

function applyOrdering(query, config) {
  return config.order.reduce(
    (orderedQuery, [column, ascending]) =>
      orderedQuery.order(column, { ascending }),
    query,
  );
}

export async function listAdminResource(resource, filters = {}) {
  const config = getResourceConfig(resource);
  let query = supabaseAdmin.from(config.table).select("*");

  if (resource === "repair-case-images") {
    query = query.eq(
      "repair_case_id",
      normalizeId(filters.repairCaseId, "수리사례 번호"),
    );
  }

  if (resource === "repair-cases" && filters.slugPrefix) {
    const prefix = text(filters.slugPrefix, "SEO 주소", { max: 200 })
      .replace(/[%_]/g, "")
      .toLowerCase();

    if (prefix) {
      query = query.ilike("slug", `${prefix}%`);
    }
  }

  const { data, error } = await applyOrdering(query, config).limit(MAX_LIST_ROWS);

  if (error) {
    console.error(`관리자 ${resource} 목록 조회 오류:`, error);
    throw new AdminContentError("관리자 자료를 불러오지 못했습니다.", 500);
  }

  if (resource === "branches") {
    return (data || []).map((branch) => {
      const seo = getBranchSeoForRecord(branch);
      return seo ? getBranchDisplayData(seo, branch) : branch;
    });
  }

  return data || [];
}

export async function listAdminResourceForPage(resource, filters = {}) {
  if (!(await hasAdminServerSession())) {
    redirect("/login");
  }

  return listAdminResource(resource, filters);
}

export async function getAdminResource(resource, id) {
  const config = getResourceConfig(resource);
  const normalizedId = normalizeId(id);
  const { data, error } = await supabaseAdmin
    .from(config.table)
    .select("*")
    .eq("id", normalizedId)
    .maybeSingle();

  if (error) {
    console.error(`관리자 ${resource} 상세 조회 오류:`, error);
    throw new AdminContentError("관리자 자료를 불러오지 못했습니다.", 500);
  }

  if (!data) {
    throw new AdminContentError("요청한 자료를 찾을 수 없습니다.", 404);
  }

  return data;
}

async function createRepairCase(payload) {
  const caseData = sanitizeResource("repair-cases", payload?.data, {
    creating: true,
  });
  const imagePayloads = Array.isArray(payload?.detailImages)
    ? payload.detailImages
    : [];

  if (imagePayloads.length > 100) {
    throw new AdminContentError("상세 이미지는 최대 100장까지 등록할 수 있습니다.");
  }

  const images = imagePayloads.map((image) =>
    sanitizeRepairImage(image, { requireCaseId: false }),
  );
  const { data: slugRows, error: slugError } = await supabaseAdmin
    .from("repair_cases")
    .select("slug")
    .ilike("slug", `${caseData.slug}%`)
    .limit(MAX_LIST_ROWS);

  if (slugError) {
    console.error("수리사례 주소 중복 확인 오류:", slugError);
    throw new AdminContentError("SEO 주소 중복 여부를 확인하지 못했습니다.", 500);
  }

  const existingSlugs = new Set((slugRows || []).map((row) => row.slug));
  let finalSlug = caseData.slug;
  let suffix = 2;

  while (existingSlugs.has(finalSlug)) {
    finalSlug = `${caseData.slug}-${suffix}`;
    suffix += 1;
  }

  const { data: insertedCase, error: caseError } = await supabaseAdmin
    .from("repair_cases")
    .insert({ ...caseData, slug: finalSlug })
    .select("*")
    .single();

  if (caseError) {
    console.error("수리사례 등록 오류:", caseError);
    throw new AdminContentError(
      "수리사례 등록에 실패했습니다. SEO 주소와 입력값을 확인해주세요.",
      500,
    );
  }

  if (images.length > 0) {
    const imageRows = images.map((image, index) => ({
      ...image,
      repair_case_id: insertedCase.id,
      sort_order: index,
    }));
    const { error: imageError } = await supabaseAdmin
      .from("repair_case_images")
      .insert(imageRows);

    if (imageError) {
      console.error("수리사례 상세 이미지 등록 오류:", imageError);
      await supabaseAdmin.from("repair_cases").delete().eq("id", insertedCase.id);
      throw new AdminContentError(
        "상세 이미지 저장에 실패하여 수리사례 등록을 취소했습니다.",
        500,
      );
    }
  }

  return insertedCase;
}

export async function createAdminResource(resource, payload) {
  const config = getResourceConfig(resource);

  if (config.canCreate === false) {
    throw new AdminContentError("새로 등록할 수 없는 관리자 자료입니다.", 405);
  }

  if (resource === "repair-cases") {
    return createRepairCase(payload);
  }

  const cleanPayload = sanitizeResource(resource, payload, { creating: true });
  const { data, error } = await supabaseAdmin
    .from(config.table)
    .insert(cleanPayload)
    .select("*")
    .single();

  if (error) {
    console.error(`관리자 ${resource} 등록 오류:`, error);
    throw new AdminContentError("관리자 자료를 등록하지 못했습니다.", 500);
  }

  return data;
}

export async function updateAdminResource(resource, id, payload) {
  const config = getResourceConfig(resource);

  if (config.canUpdate === false) {
    throw new AdminContentError("수정할 수 없는 관리자 자료입니다.", 405);
  }

  const normalizedId = normalizeId(id);
  const cleanPayload = sanitizeResource(resource, payload, { updating: true });
  const { data, error } = await supabaseAdmin
    .from(config.table)
    .update(cleanPayload)
    .eq("id", normalizedId)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error(`관리자 ${resource} 수정 오류:`, error);
    throw new AdminContentError("관리자 자료를 수정하지 못했습니다.", 500);
  }

  if (!data) {
    throw new AdminContentError("수정할 자료를 찾을 수 없습니다.", 404);
  }

  return data;
}

export async function deleteAdminResource(resource, id) {
  const config = getResourceConfig(resource);

  if (config.canDelete === false) {
    throw new AdminContentError("삭제할 수 없는 관리자 자료입니다.", 405);
  }

  const normalizedId = normalizeId(id);

  if (resource === "repair-cases") {
    const { error: imageError } = await supabaseAdmin
      .from("repair_case_images")
      .delete()
      .eq("repair_case_id", normalizedId);

    if (imageError) {
      console.error("수리사례 상세 이미지 삭제 오류:", imageError);
      throw new AdminContentError("상세 이미지 정보를 삭제하지 못했습니다.", 500);
    }
  }

  const { data, error } = await supabaseAdmin
    .from(config.table)
    .delete()
    .eq("id", normalizedId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(`관리자 ${resource} 삭제 오류:`, error);
    throw new AdminContentError("관리자 자료를 삭제하지 못했습니다.", 500);
  }

  if (!data) {
    throw new AdminContentError("삭제할 자료를 찾을 수 없습니다.", 404);
  }
}

export async function getAdminDashboardData() {
  if (!(await hasAdminServerSession())) {
    throw new AdminContentError("관리자 인증이 필요합니다.", 401);
  }

  const tables = [
    ["onlineInquiries", "online_inquiries"],
    ["repairCases", "repair_cases"],
    ["notices", "notices"],
    ["popups", "popup_notices"],
  ];
  const [countResults, recentRepairResult, recentNoticeResult] = await Promise.all([
    Promise.all(tables.map(([, table]) =>
      supabaseAdmin.from(table).select("id", { count: "exact", head: true }),
    )),
    supabaseAdmin
      .from("repair_cases")
      .select("id,title,branch,category,seo_keyword,image_url,alt_text")
      .order("created_at", { ascending: false })
      .limit(8),
    supabaseAdmin
      .from("notices")
      .select("id,title,is_pinned,created_at")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const counts = {};

  countResults.forEach((result, index) => {
    if (result.error) {
      console.error(`관리자 ${tables[index][1]} 건수 조회 오류:`, result.error);
      throw new AdminContentError("관리자 현황을 불러오지 못했습니다.", 500);
    }

    counts[tables[index][0]] = result.count || 0;
  });

  if (recentRepairResult.error || recentNoticeResult.error) {
    console.error(
      "관리자 최근 콘텐츠 조회 오류:",
      recentRepairResult.error || recentNoticeResult.error,
    );
    throw new AdminContentError("최근 관리자 자료를 불러오지 못했습니다.", 500);
  }

  return {
    counts,
    recentRepairCases: recentRepairResult.data || [],
    recentNotices: recentNoticeResult.data || [],
  };
}
