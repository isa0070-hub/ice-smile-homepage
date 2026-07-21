"use client";

import {
  generateEnglishSlug,
  generateSeoKeyword,
  generateAltText,
  generateGroupAltText,
  generateImageDescription,
  generateAltFromDescription,
} from "@/lib/seoEngine";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
const SITE_URL = "https://www.ismileagain.co.kr";
const NAVER_SEARCH_ADVISOR_URL =
  "https://searchadvisor.naver.com/console/site/request/crawl?site=https%3A%2F%2Fwww.ismileagain.co.kr";
const GOOGLE_SEARCH_CONSOLE_URL = "https://search.google.com/search-console";
const SITEMAP_URL = "https://www.ismileagain.co.kr/sitemap.xml";
const RSS_URL = "https://www.ismileagain.co.kr/rss.xml";

function normalizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function compactText(value = "") {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[\s._/\\-]+/g, "");
}

function normalizeSlugForAdmin(value = "") {
  const clean = String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/&/g, "-and-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (clean.length <= 90) {
    return clean;
  }

  return clean
    .slice(0, 90)
    .replace(/-[^-]*$/g, "")
    .replace(/^-|-$/g, "");
}

function makeUniqueSlugForAdmin(baseSlug, existingSlugs = []) {
  const safeBaseSlug = normalizeSlugForAdmin(baseSlug) || "repair-case";

  const usedSlugs = new Set(
    existingSlugs.filter(Boolean).map((slug) => normalizeSlugForAdmin(slug)),
  );

  if (!usedSlugs.has(safeBaseSlug)) {
    return safeBaseSlug;
  }

  let number = 2;
  let nextSlug = `${safeBaseSlug}-${number}`;

  while (usedSlugs.has(nextSlug)) {
    number += 1;
    nextSlug = `${safeBaseSlug}-${number}`;
  }

  return nextSlug;
}

function hasKeyword(text, keyword) {
  const cleanKeyword = compactText(keyword);
  if (!cleanKeyword) return true;

  return compactText(text).includes(cleanKeyword);
}

function getSlugWarnings(slug = "") {
  const cleanSlug = normalizeSlugForAdmin(slug);
  const tokens = cleanSlug.split("-").filter(Boolean);

  const repeatedAdjacent = tokens.some((token, index) => {
    return index > 0 && token === tokens[index - 1];
  });

  const repeatedImportantWords = [
    "battery",
    "screen",
    "repair",
    "replacement",
  ].some((word) => tokens.filter((token) => token === word).length >= 2);

  return {
    cleanSlug,
    repeatedAdjacent,
    repeatedImportantWords,
    isValid: Boolean(cleanSlug) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug),
    isGoodLength: cleanSlug.length > 0 && cleanSlug.length <= 70,
  };
}

function getSeoReadinessReport(
  form,
  detailImages,
  contentSections = [],
  closingContent = "",
) {
  let score = 0;
  const checks = [];

  function addCheck(status, label, point, maxPoint, help = "") {
    score += point;

    checks.push({
      status,
      label,
      point,
      maxPoint,
      help,
    });
  }

  const titleLength = normalizeText(form.title).length;
  if (!titleLength) {
    addCheck(
      "bad",
      "제목이 비어 있습니다.",
      0,
      12,
      "수리 기기, 모델, 증상이 드러나는 제목이 필요합니다.",
    );
  } else if (titleLength < 15) {
    addCheck(
      "warn",
      "제목이 조금 짧습니다.",
      7,
      12,
      "예: 아이폰15프로 배터리 성능저하 배터리교체",
    );
  } else if (titleLength > 80) {
    addCheck(
      "warn",
      "제목이 너무 깁니다.",
      9,
      12,
      "검색 결과에서 잘릴 수 있어 핵심 키워드 중심으로 줄이는 것이 좋습니다.",
    );
  } else {
    addCheck("ok", "제목 길이가 적절합니다.", 12, 12);
  }

  const slugInfo = getSlugWarnings(form.slug);
  if (!form.slug) {
    addCheck(
      "bad",
      "SEO 주소가 비어 있습니다.",
      0,
      12,
      "기기, 모델, 증상을 입력하면 자동 생성됩니다.",
    );
  } else if (!slugInfo.isValid) {
    addCheck(
      "bad",
      "SEO 주소 형식이 좋지 않습니다.",
      3,
      12,
      "영문 소문자, 숫자, 하이픈만 사용하는 것이 좋습니다.",
    );
  } else if (slugInfo.repeatedAdjacent || slugInfo.repeatedImportantWords) {
    addCheck(
      "warn",
      "SEO 주소에 반복 단어가 있습니다.",
      7,
      12,
      "battery-battery, repair-repair 같은 반복은 피하는 것이 좋습니다.",
    );
  } else if (!slugInfo.isGoodLength) {
    addCheck(
      "warn",
      "SEO 주소가 조금 깁니다.",
      9,
      12,
      "가능하면 70자 이하의 짧은 주소가 좋습니다.",
    );
  } else {
    addCheck("ok", "SEO 주소가 깔끔합니다.", 12, 12);
  }

  const coreFields = [
    ["카테고리", form.category],
    ["지점", form.branch],
    ["기기", form.device],
    ["모델명", form.model],
    ["증상", form.symptom],
  ];

  const filledCoreFields = coreFields.filter(([, value]) =>
    normalizeText(value),
  ).length;
  const corePoint = filledCoreFields * 3;

  if (filledCoreFields === coreFields.length) {
    addCheck(
      "ok",
      "카테고리, 지점, 기기, 모델명, 증상이 모두 입력되었습니다.",
      15,
      15,
    );
  } else {
    const missing = coreFields
      .filter(([, value]) => !normalizeText(value))
      .map(([label]) => label)
      .join(", ");

    addCheck(
      "warn",
      `핵심 정보 일부가 비어 있습니다: ${missing}`,
      corePoint,
      15,
    );
  }

  const keyword = normalizeText(form.seo_keyword);
  if (!keyword) {
    addCheck("bad", "대표 SEO 키워드가 비어 있습니다.", 0, 10);
  } else {
    const keywordTargets = [
      form.branch,
      form.device,
      form.model,
      form.symptom,
    ].filter(Boolean);
    const matchedCount = keywordTargets.filter((target) =>
      hasKeyword(keyword, target),
    ).length;
    const point =
      6 + Math.round((matchedCount / Math.max(keywordTargets.length, 1)) * 4);

    if (matchedCount === keywordTargets.length) {
      addCheck("ok", "대표 SEO 키워드가 핵심 정보를 잘 포함합니다.", 10, 10);
    } else {
      addCheck(
        "warn",
        "대표 SEO 키워드에 일부 핵심 정보가 부족합니다.",
        point,
        10,
      );
    }
  }

  const sectionContent = contentSections
    .map((section) => `${section?.title || ""} ${section?.content || ""}`)
    .join(" ");

  const contentLength = normalizeText(
    `${form.repair_content || ""} ${sectionContent} ${closingContent || ""}`,
  ).length;
  if (!contentLength) {
    addCheck(
      "bad",
      "수리 내용이 비어 있습니다.",
      0,
      18,
      "상세 설명은 검색 노출과 사용자 신뢰에 중요합니다.",
    );
  } else if (contentLength < 150) {
    addCheck(
      "warn",
      "수리 내용이 짧습니다.",
      7,
      18,
      "증상, 점검, 수리 과정, 테스트 내용을 조금 더 적어주세요.",
    );
  } else if (contentLength < 350) {
    addCheck(
      "warn",
      "수리 내용은 입력됐지만 조금 더 보강하면 좋습니다.",
      13,
      18,
    );
  } else {
    addCheck("ok", "수리 내용 길이가 좋습니다.", 18, 18);
  }

  const hasMainImage = Boolean(form.image_url);
  const mainAltLength = normalizeText(form.alt_text).length;

  if (hasMainImage && mainAltLength >= 50) {
    addCheck("ok", "대표 이미지와 대표 ALT 문구가 좋습니다.", 10, 10);
  } else if (hasMainImage && mainAltLength > 0) {
    addCheck(
      "warn",
      "대표 이미지는 있지만 ALT 문구가 짧습니다.",
      6,
      10,
      "ALT는 최소 50자 이상을 추천합니다.",
    );
  } else if (hasMainImage) {
    addCheck("warn", "대표 이미지는 있지만 ALT 문구가 비어 있습니다.", 5, 10);
  } else {
    addCheck("warn", "대표 이미지가 아직 없습니다.", 0, 10);
  }

  const imageReport = getImageQualityReport(form, detailImages);

  if (detailImages.length >= 4) {
    addCheck("ok", "상세 이미지가 4장 이상 등록되어 있습니다.", 5, 5);
  } else if (detailImages.length > 0) {
    addCheck(
      "warn",
      "상세 이미지 수가 조금 적습니다.",
      3,
      5,
      "가능하면 4장 이상을 권장합니다.",
    );
  } else {
    addCheck("warn", "상세 이미지가 없습니다.", 0, 5);
  }

  if (detailImages.length > 0 && imageReport.stats.descriptionMissing === 0) {
    addCheck("ok", "상세 이미지 설명이 모두 입력되어 있습니다.", 5, 5);
  } else if (detailImages.length > 0) {
    addCheck("warn", "설명이 부족한 상세 이미지가 있습니다.", 3, 5);
  } else {
    addCheck("warn", "상세 이미지 설명을 검사할 이미지가 없습니다.", 0, 5);
  }

  if (
    detailImages.length > 0 &&
    imageReport.stats.altShort === 0 &&
    imageReport.stats.duplicateAlt === 0
  ) {
    addCheck("ok", "상세 이미지 ALT 품질이 좋습니다.", 5, 5);
  } else if (detailImages.length > 0) {
    addCheck("warn", "상세 이미지 ALT 보완이 필요합니다.", 3, 5);
  } else {
    addCheck("warn", "상세 이미지 ALT를 검사할 이미지가 없습니다.", 0, 5);
  }

  return {
    score: Math.min(100, Math.round(score)),
    checks,
  };
}

function getImageQualityReport(form, detailImages) {
  const altCounter = new Map();

  detailImages.forEach((image) => {
    const cleanAlt = compactText(image.alt_text);
    if (!cleanAlt) return;

    altCounter.set(cleanAlt, (altCounter.get(cleanAlt) || 0) + 1);
  });

  const rows = detailImages.map((image, index) => {
    const description = normalizeText(image.description);
    const alt = normalizeText(image.alt_text);
    const cleanAlt = compactText(alt);

    const missingKeywords = [];

    if (form.device && !hasKeyword(alt, form.device))
      missingKeywords.push("기기");
    if (form.model && !hasKeyword(alt, form.model))
      missingKeywords.push("모델명");
    if (form.symptom && !hasKeyword(alt, form.symptom))
      missingKeywords.push("증상");

    const isDuplicate = Boolean(cleanAlt && altCounter.get(cleanAlt) > 1);

    let status = "ok";
    const warnings = [];

    if (!description) {
      status = "bad";
      warnings.push("사진 설명 없음");
    } else if (description.length < 20) {
      status = "warn";
      warnings.push("사진 설명이 짧음");
    }

    if (!alt) {
      status = "bad";
      warnings.push("ALT 없음");
    } else if (alt.length < 50) {
      if (status !== "bad") status = "warn";
      warnings.push("ALT 50자 미만");
    }

    if (missingKeywords.length > 0) {
      if (status !== "bad") status = "warn";
      warnings.push(`${missingKeywords.join(", ")} 키워드 누락`);
    }

    if (isDuplicate) {
      if (status !== "bad") status = "warn";
      warnings.push("중복 ALT");
    }

    return {
      index,
      status,
      descriptionLength: description.length,
      altLength: alt.length,
      missingKeywords,
      isDuplicate,
      warnings,
    };
  });

  const stats = {
    total: detailImages.length,
    descriptionMissing: rows.filter((row) => row.descriptionLength === 0)
      .length,
    descriptionShort: rows.filter(
      (row) => row.descriptionLength > 0 && row.descriptionLength < 20,
    ).length,
    altMissing: rows.filter((row) => row.altLength === 0).length,
    altShort: rows.filter((row) => row.altLength > 0 && row.altLength < 50)
      .length,
    duplicateAlt: rows.filter((row) => row.isDuplicate).length,
    keywordMissing: rows.filter((row) => row.missingKeywords.length > 0).length,
  };

  return {
    rows,
    stats,
  };
}

function getScoreColor(score) {
  if (score >= 90) return "#16a34a";
  if (score >= 75) return "#2563eb";
  if (score >= 60) return "#f59e0b";
  return "#dc2626";
}

function getScoreLabel(score) {
  if (score >= 90) return "좋음";
  if (score >= 75) return "등록 가능";
  if (score >= 60) return "보완 권장";
  return "등록 전 확인 필요";
}

function getStatusIcon(status) {
  if (status === "ok") return "✅";
  if (status === "warn") return "⚠️";
  return "❌";
}

const IMAGES_PER_CONTENT_SECTION = 3;

function getDefaultContentSectionTitle(index, totalCount = 1) {
  if (totalCount <= 1) {
    return "수리 초기부터 마무리까지";
  }

  if (index === 0) {
    return "수리 초기와 상태 확인";
  }

  if (index === totalCount - 1) {
    return "수리 마무리와 기능 테스트";
  }

  if (index === 1) {
    return "수리 중·후기 과정";
  }

  return `수리 진행 과정 ${index}`;
}

function buildContentSections(images = [], previousSections = []) {
  const sectionCount = Math.ceil(images.length / IMAGES_PER_CONTENT_SECTION);

  return Array.from({ length: sectionCount }, (_, index) => {
    const previous = previousSections[index] || {};
    const imageStart = index * IMAGES_PER_CONTENT_SECTION + 1;
    const imageEnd = Math.min(
      (index + 1) * IMAGES_PER_CONTENT_SECTION,
      images.length,
    );

    return {
      title:
        previous.title || getDefaultContentSectionTitle(index, sectionCount),
      content: previous.content || "",
      image_start: imageStart,
      image_end: imageEnd,
    };
  });
}

function getImageGroupSummary(imageCount = 0) {
  if (imageCount <= 0) {
    return "상세 이미지 없음";
  }

  const groups = [];

  for (let start = 0; start < imageCount; start += IMAGES_PER_CONTENT_SECTION) {
    groups.push(Math.min(IMAGES_PER_CONTENT_SECTION, imageCount - start));
  }

  return groups.join(" + ");
}

function getContentSectionThumbGridStyle(imageCount = 0) {
  const safeCount = Math.max(1, Math.min(imageCount, 3));

  return {
    ...contentSectionThumbGridStyle,
    gridTemplateColumns: `repeat(${safeCount}, minmax(0, 1fr))`,
  };
}

function AdminBackButton() {
  return (
    <div style={{ marginBottom: "16px" }}>
      <a
        href="/admin"
        style={{
          display: "inline-block",
          padding: "10px 14px",
          borderRadius: "10px",
          backgroundColor: "#f1f5f9",
          color: "#111827",
          textDecoration: "none",
          fontWeight: 800,
          border: "1px solid #cbd5e1",
        }}
      >
        ← 관리자 메인으로 돌아가기
      </a>
    </div>
  );
}

function SeoReadinessPanel({ report }) {
  const color = getScoreColor(report.score);

  return (
    <section style={seoPanelStyle}>
      <div style={seoPanelHeaderStyle}>
        <div>
          <p style={seoPanelLabelStyle}>검색 최적화 점검</p>
          <h2 style={seoPanelTitleStyle}>SEO 준비 점수</h2>
        </div>

        <div style={{ ...scoreCircleStyle, borderColor: color, color }}>
          {report.score}
          <span style={scoreSmallTextStyle}>점</span>
        </div>
      </div>

      <div style={scoreBarBgStyle}>
        <div
          style={{
            ...scoreBarFillStyle,
            width: `${report.score}%`,
            background: color,
          }}
        />
      </div>

      <p style={{ ...scoreStatusStyle, color }}>
        {getScoreLabel(report.score)}
      </p>

      <div style={seoCheckListStyle}>
        {report.checks.map((check, index) => (
          <div key={index} style={seoCheckItemStyle}>
            <span>{getStatusIcon(check.status)}</span>
            <div>
              <strong>{check.label}</strong>
              <p style={seoCheckHelpStyle}>
                {check.point}/{check.maxPoint}점
                {check.help ? ` · ${check.help}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ImageQualityPanel({ report }) {
  if (report.stats.total === 0) {
    return (
      <section style={imageQualityPanelStyle}>
        <h2 style={imageQualityTitleStyle}>상세 이미지 품질 검사</h2>
        <p style={imageQualityTextStyle}>
          상세 이미지를 업로드하면 사진 설명, ALT 길이, 중복 ALT, 핵심 키워드
          포함 여부를 자동으로 점검합니다.
        </p>
      </section>
    );
  }

  return (
    <section style={imageQualityPanelStyle}>
      <h2 style={imageQualityTitleStyle}>상세 이미지 품질 검사</h2>

      <div style={imageStatsGridStyle}>
        <div style={imageStatCardStyle}>
          <strong>{report.stats.total}</strong>
          <span>총 이미지</span>
        </div>
        <div style={imageStatCardStyle}>
          <strong>{report.stats.descriptionMissing}</strong>
          <span>설명 없음</span>
        </div>
        <div style={imageStatCardStyle}>
          <strong>{report.stats.altShort}</strong>
          <span>ALT 짧음</span>
        </div>
        <div style={imageStatCardStyle}>
          <strong>{report.stats.duplicateAlt}</strong>
          <span>중복 ALT</span>
        </div>
        <div style={imageStatCardStyle}>
          <strong>{report.stats.keywordMissing}</strong>
          <span>키워드 누락</span>
        </div>
      </div>

      <div style={imageQualityListStyle}>
        {report.rows.map((row) => (
          <div key={row.index} style={imageQualityRowStyle}>
            <strong>
              {getStatusIcon(row.status)} 사진 {row.index + 1}
            </strong>
            <p style={imageQualityRowTextStyle}>
              설명 {row.descriptionLength}자 · ALT {row.altLength}자
              {row.warnings.length > 0
                ? ` · ${row.warnings.join(", ")}`
                : " · 품질 좋음"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminRepairCasesPage() {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "애플",
    branch: "강변점",
    device: "",
    model: "",
    symptom: "",
    repair_content: "",
    seo_keyword: "",
    image_url: "",
    alt_text: "",
    blog_url: "",
    blog_title: "",
  });

  const [detailImages, setDetailImages] = useState([]);
  const [contentSections, setContentSections] = useState([]);
  const [closingSection, setClosingSection] = useState({
    title: "마무리 및 지점안내",
    content: "",
  });
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registeredCaseUrl, setRegisteredCaseUrl] = useState("");

  const seoReport = getSeoReadinessReport(
    form,
    detailImages,
    contentSections,
    closingSection.content,
  );
  const imageReport = getImageQualityReport(form, detailImages);

  function makeSlug(nextForm) {
    return generateEnglishSlug(nextForm);
  }

  function makeSeoKeyword(nextForm) {
    return generateSeoKeyword(nextForm);
  }

  function makeAltText(nextForm, index = null) {
    return generateAltText(nextForm, index);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    const nextForm = {
      ...form,
      [name]: value,
    };

    if (["title", "device", "model", "symptom"].includes(name)) {
      nextForm.slug = makeSlug(nextForm);

      setDetailImages((prevImages) =>
        prevImages.map((image, index) => ({
          ...image,
          alt_text: generateGroupAltText(nextForm, index),
          description:
            image.description && image.description.trim()
              ? image.description
              : generateImageDescription(nextForm, index),
        })),
      );
    }

    nextForm.seo_keyword = makeSeoKeyword(nextForm);
    nextForm.alt_text = makeAltText(nextForm);

    setForm(nextForm);
  }

  async function uploadSingleFile(file) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    const filePath = `repair-cases/${fileName}`;

    const { error } = await supabase.storage
      .from("repair-images")
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from("repair-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleMainImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    try {
      const publicUrl = await uploadSingleFile(file);

      setForm({
        ...form,
        image_url: publicUrl,
      });

      setMessage("대표 이미지 업로드 완료");
    } catch (error) {
      console.error(error);
      setMessage("대표 이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDetailImagesUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setMessage("");

    try {
      const uploadedImages = [];

      for (let i = 0; i < files.length; i++) {
        const publicUrl = await uploadSingleFile(files[i]);
        const imageIndex = detailImages.length + i;

        uploadedImages.push({
          image_url: publicUrl,
          alt_text: generateGroupAltText(form, imageIndex),
          description: generateImageDescription(form, imageIndex),
          sort_order: imageIndex,
        });
      }

      const nextImages = [...detailImages, ...uploadedImages].map(
        (image, index) => ({
          ...image,
          sort_order: index,
        }),
      );

      setDetailImages(nextImages);
      setContentSections((previousSections) =>
        buildContentSections(nextImages, previousSections),
      );

      setMessage(`${files.length}장 상세 이미지 업로드 완료`);
    } catch (error) {
      console.error(error);
      setMessage("상세 이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  }

  function handleDetailImageDescriptionChange(index, value) {
    const nextImages = detailImages.map((img, i) =>
      i === index
        ? {
            ...img,
            description: value,
            alt_text:
              img.alt_text && img.alt_text.trim()
                ? img.alt_text
                : generateAltFromDescription(form, value, index),
          }
        : img,
    );

    setDetailImages(nextImages);
  }

  function handleDetailImageAltChange(index, value) {
    const nextImages = detailImages.map((img, i) =>
      i === index
        ? {
            ...img,
            alt_text: value,
          }
        : img,
    );

    setDetailImages(nextImages);
  }

  function removeDetailImage(index) {
    const nextImages = detailImages
      .filter((_, i) => i !== index)
      .map((image, nextIndex) => ({
        ...image,
        sort_order: nextIndex,
      }));

    setDetailImages(nextImages);
    setContentSections((previousSections) =>
      buildContentSections(nextImages, previousSections),
    );
  }

  function handleContentSectionChange(index, field, value) {
    setContentSections((previousSections) =>
      previousSections.map((section, sectionIndex) =>
        sectionIndex === index
          ? {
              ...section,
              [field]: value,
            }
          : section,
      ),
    );
  }

  async function copyRegisteredUrl() {
    if (!registeredCaseUrl) return;

    try {
      await navigator.clipboard.writeText(registeredCaseUrl);
      setMessage("새 수리사례 주소가 복사되었습니다.");
    } catch (error) {
      console.error(error);
      setMessage(
        "주소 복사에 실패했습니다. 주소를 직접 선택해서 복사해주세요.",
      );
    }
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setRegisteredCaseUrl("");
    setSaving(true);

    const normalizedContentSections = contentSections.map((section, index) => ({
      title:
        normalizeText(section.title) ||
        getDefaultContentSectionTitle(index, contentSections.length),
      content: String(section.content || "").trim(),
      image_start: Number(section.image_start),
      image_end: Number(section.image_end),
    }));

    const normalizedClosingSection = {
      type: "closing",
      title: normalizeText(closingSection.title) || "마무리 및 지점안내",
      content: String(closingSection.content || "").trim(),
      image_start: null,
      image_end: null,
    };

    const incompleteSection =
      detailImages.length > 0 &&
      normalizedContentSections.some((section) => !section.content);

    if (incompleteSection) {
      setMessage("각 사진 묶음의 설명글을 모두 입력해주세요.");
      setSaving(false);
      return;
    }

    if (!normalizedClosingSection.content) {
      setMessage("마무리 및 지점안내 내용을 입력해주세요.");
      setSaving(false);
      return;
    }

    const contentSectionsForSave = [
      ...normalizedContentSections,
      normalizedClosingSection,
    ];

    try {
      const baseSlug = normalizeSlugForAdmin(
        form.slug || generateEnglishSlug(form),
      );

      const { data: slugRows, error: slugSearchError } = await supabase
        .from("repair_cases")
        .select("slug")
        .ilike("slug", `${baseSlug}%`);

      if (slugSearchError) {
        throw slugSearchError;
      }

      const finalSlug = makeUniqueSlugForAdmin(
        baseSlug,
        (slugRows || []).map((row) => row.slug),
      );

      const finalForm = {
        ...form,
        slug: finalSlug,
        seo_keyword: form.seo_keyword || generateSeoKeyword(form),
        alt_text: form.alt_text || generateAltText(form),
        content_sections:
          contentSectionsForSave.length > 0 ? contentSectionsForSave : null,
      };

      const { data: insertedCase, error } = await supabase
        .from("repair_cases")
        .insert([finalForm])
        .select()
        .single();

      if (error) {
        console.error(error);
        setMessage(
          "등록 중 오류가 발생했습니다. SEO 주소 중복 또는 입력값을 확인해주세요.",
        );
        return;
      }

      if (detailImages.length > 0) {
        const imageRows = detailImages.map((image, index) => ({
          repair_case_id: insertedCase.id,
          image_url: image.image_url,
          alt_text: image.alt_text,
          description: image.description || "",
          sort_order: index,
        }));

        const { error: imageError } = await supabase
          .from("repair_case_images")
          .insert(imageRows);

        if (imageError) {
          console.error(imageError);
          setMessage(
            "수리사례는 등록됐지만 상세 이미지 저장 중 오류가 발생했습니다.",
          );
          return;
        }
      }
      const newCaseUrl = `https://www.ismileagain.co.kr/repair-cases/${finalSlug}`;
      setRegisteredCaseUrl(newCaseUrl);

      setMessage("수리사례와 상세 이미지가 등록되었습니다.");

      setForm({
        title: "",
        slug: "",
        category: "애플",
        branch: "강변점",
        device: "",
        model: "",
        symptom: "",
        repair_content: "",
        seo_keyword: "",
        image_url: "",
        alt_text: "",
        blog_url: "",
        blog_title: "",
      });

      setDetailImages([]);
      setContentSections([]);
      setClosingSection({
        title: "마무리 및 지점안내",
        content: "",
      });
    } catch (error) {
      console.error(error);
      setMessage(
        "등록 중 오류가 발생했습니다. 입력값 또는 네트워크 상태를 확인해주세요.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: "1100px", margin: "60px auto", padding: "20px" }}>
      <AdminBackButton />

      <h1 style={{ fontSize: "38px", marginBottom: "12px" }}>수리사례 등록</h1>

      <p style={{ marginBottom: "26px", color: "#475569", lineHeight: 1.7 }}>
        제목, 지점, 기기, 모델명, 증상을 입력하면 SEO 주소, 대표 SEO 키워드, ALT
        문구가 자동으로 생성됩니다. 등록 전 SEO 준비 점수와 이미지 품질을 확인할
        수 있습니다.
      </p>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>제목</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          style={inputStyle}
          placeholder="예: 선릉점 아이폰15프로 액정파손 교체 수리"
          required
        />

        <label style={labelStyle}>SEO 주소(URL)</label>
        <input
          name="slug"
          value={form.slug}
          onChange={handleChange}
          style={inputStyle}
          placeholder="예: iphone-15-pro-screen"
        />

        <div style={autoBoxStyle}>
          <strong>실제 주소</strong>
          <p>
            https://www.ismileagain.co.kr/repair-cases/
            {form.slug || "seo-url"}
          </p>
        </div>

        <label style={labelStyle}>네이버 블로그 링크</label>
        <input
          name="blog_url"
          value={form.blog_url}
          onChange={handleChange}
          placeholder="https://blog.naver.com/..."
          style={inputStyle}
        />

        <label style={labelStyle}>블로그 제목</label>
        <input
          name="blog_title"
          value={form.blog_title || ""}
          onChange={handleChange}
          placeholder="예: 강남아이폰수리 선릉 아이스마일어게인 방문후기"
          style={inputStyle}
        />

        <label style={labelStyle}>카테고리</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          style={inputStyle}
        >
          <option>애플</option>
          <option>마이크로소프트 서피스</option>
          <option>노트북 및 태블릿</option>
        </select>

        <label style={labelStyle}>지점</label>
        <select
          name="branch"
          value={form.branch}
          onChange={handleChange}
          style={inputStyle}
        >
          <option>강변점</option>
          <option>선릉점</option>
          <option>신도림점</option>
        </select>

        <label style={labelStyle}>기기</label>
        <input
          name="device"
          value={form.device}
          onChange={handleChange}
          style={inputStyle}
          placeholder="예: 아이폰, 아이패드, 서피스, LG그램"
        />

        <label style={labelStyle}>모델명</label>
        <input
          name="model"
          value={form.model}
          onChange={handleChange}
          style={inputStyle}
          placeholder="예: 아이폰15프로, 서피스프로7"
        />

        <label style={labelStyle}>증상</label>
        <input
          name="symptom"
          value={form.symptom}
          onChange={handleChange}
          style={inputStyle}
          placeholder="예: 액정파손, 배터리 소모 빠름, 전원불량"
        />

        <label style={labelStyle}>① 본문 도입</label>
        <textarea
          name="repair_content"
          value={form.repair_content}
          onChange={handleChange}
          style={introTextAreaStyle}
          placeholder="고객 증상, 입고 상태, 전체 점검 내용과 수리 결과를 먼저 작성해주세요. 이 글이 고객 화면에서 사진 묶음보다 먼저 표시됩니다."
          required
        />

        <div style={writingOrderGuideStyle}>
          <strong>고객 화면 표시 순서</strong>
          <p>
            본문 도입 → 수리 초기·진행·마무리 설명과 사진 → 마무리 및 지점안내
          </p>
        </div>

        <label style={labelStyle}>대표 이미지 업로드</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleMainImageUpload}
          style={inputStyle}
        />

        {form.image_url && (
          <img
            src={form.image_url}
            alt="대표 이미지 미리보기"
            style={previewImageStyle}
          />
        )}

        <label style={labelStyle}>상세 이미지 여러 장 업로드</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleDetailImagesUpload}
          style={inputStyle}
        />

        {detailImages.length > 0 && (
          <div style={galleryStyle}>
            {detailImages.map((image, index) => (
              <div key={index} style={galleryItemStyle}>
                <img
                  src={image.image_url}
                  alt={image.alt_text || `상세 이미지 ${index + 1}`}
                  style={galleryImageStyle}
                />

                <label style={smallLabelStyle}>사진 설명</label>
                <textarea
                  value={image.description || ""}
                  onChange={(e) =>
                    handleDetailImageDescriptionChange(index, e.target.value)
                  }
                  style={imageTextAreaStyle}
                  placeholder="상세페이지에 표시될 사진 설명을 입력해주세요."
                />

                <label style={smallLabelStyle}>ALT 문구</label>
                <textarea
                  value={image.alt_text || ""}
                  onChange={(e) =>
                    handleDetailImageAltChange(index, e.target.value)
                  }
                  style={imageTextAreaStyle}
                  placeholder="이미지 ALT 문구를 입력해주세요."
                />

                <button
                  type="button"
                  onClick={() => removeDetailImage(index)}
                  style={removeButtonStyle}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}

        <section style={contentSectionEditorStyle}>
            <div style={contentSectionHeaderStyle}>
              <div>
                <p style={contentSectionLabelStyle}>본문·사진 교차 배치</p>

                <h2 style={contentSectionTitleStyle}>
                  ② 수리 과정 설명·사진 작성
                </h2>
              </div>

              <div style={contentSectionSummaryStyle}>
                전체 {detailImages.length}장 · {contentSections.length}개 사진
                묶음 · {getImageGroupSummary(detailImages.length)}
              </div>
            </div>

            <p style={contentSectionGuideStyle}>
              사진은 3장씩 자동으로 묶입니다. 마지막 묶음이 1장이면 전체 폭,
              2장이면 절반씩, 3장이면 3칸을 모두 사용해 빈 공간 없이 표시됩니다.
            </p>

            {detailImages.length === 0 ? (
              <div style={contentSectionEmptyStyle}>
                <strong>상세사진을 먼저 업로드해주세요.</strong>
                <p>
                  사진을 올리면 이 자리에서 3장씩 자동으로 묶이고, 각 묶음의
                  소제목과 설명글을 작성할 수 있습니다.
                </p>
              </div>
            ) : (
              <div style={contentSectionListStyle}>
                {contentSections.map((section, sectionIndex) => {
                const sectionImages = detailImages.slice(
                  section.image_start - 1,
                  section.image_end,
                );

                return (
                  <div
                    key={`content-section-${sectionIndex}`}
                    style={contentSectionCardStyle}
                  >
                    <div style={contentSectionCardHeaderStyle}>
                      <strong>
                        사진 {section.image_start}
                        {section.image_end > section.image_start
                          ? `~${section.image_end}`
                          : ""}{" "}
                        묶음
                      </strong>

                      <span>{sectionImages.length}장</span>
                    </div>

                    <div
                      style={getContentSectionThumbGridStyle(
                        sectionImages.length,
                      )}
                    >
                      {sectionImages.map((image, imageIndex) => {
                        const absoluteIndex = section.image_start + imageIndex;

                        return (
                          <div
                            key={`${image.image_url}-${absoluteIndex}`}
                            style={contentSectionThumbItemStyle}
                          >
                            <img
                              src={image.image_url}
                              alt={image.alt_text || `사진 ${absoluteIndex}`}
                              style={contentSectionThumbStyle}
                            />

                            <span style={contentSectionThumbNumberStyle}>
                              사진 {absoluteIndex}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <label style={smallLabelStyle}>소제목</label>

                    <input
                      value={section.title || ""}
                      onFocus={(e) => {
                        const defaultTitle = getDefaultContentSectionTitle(
                          sectionIndex,
                          contentSections.length,
                        );

                        if (e.target.value === defaultTitle) {
                          handleContentSectionChange(sectionIndex, "title", "");
                        }
                      }}
                      onChange={(e) =>
                        handleContentSectionChange(
                          sectionIndex,
                          "title",
                          e.target.value,
                        )
                      }
                      style={contentSectionTitleInputStyle}
                      placeholder="예: 수리 초기와 상태 확인"
                    />

                    <label style={smallLabelStyle}>사진 묶음 설명글</label>

                    <textarea
                      value={section.content || ""}
                      onChange={(e) =>
                        handleContentSectionChange(
                          sectionIndex,
                          "content",
                          e.target.value,
                        )
                      }
                      style={contentSectionTextAreaStyle}
                      placeholder="이 사진들에서 진행 중인 작업을 자연스럽게 설명해주세요. 고객 화면에는 소제목, 설명글, 사진 순서로 표시됩니다."
                    />

                    <p style={contentSectionCountStyle}>
                      설명글 {normalizeText(section.content).length}자
                    </p>
                  </div>
                );
                })}
              </div>
            )}
          </section>

        <section style={closingEditorStyle}>
          <p style={contentSectionLabelStyle}>글의 마지막 단계</p>

          <h2 style={contentSectionTitleStyle}>③ 마무리 및 지점안내</h2>

          <p style={closingEditorGuideStyle}>
            수리 완료 후 당부사항, 품질보증 안내, 방문·택배 접수 방법, 해당 지점
            위치와 전화번호, 톡톡 문의 안내 등을 자연스럽게 작성해주세요. 고객
            화면에서는 모든 수리 과정 사진 뒤에 표시됩니다.
          </p>

          <label style={smallLabelStyle}>마무리 소제목</label>

          <input
            value={closingSection.title}
            onFocus={(e) => {
              if (e.target.value === "마무리 및 지점안내") {
                setClosingSection((previous) => ({
                  ...previous,
                  title: "",
                }));
              }
            }}
            onChange={(e) =>
              setClosingSection((previous) => ({
                ...previous,
                title: e.target.value,
              }))
            }
            style={closingTitleInputStyle}
            placeholder="예: 수리 완료 및 강변점 방문·택배 안내"
          />

          <label style={smallLabelStyle}>마무리·지점안내 내용</label>

          <textarea
            value={closingSection.content}
            onChange={(e) =>
              setClosingSection((previous) => ({
                ...previous,
                content: e.target.value,
              }))
            }
            style={closingTextAreaStyle}
            placeholder="수리 후 사용 시 주의사항, 보증 안내, 지점 위치와 연락처, 택배 접수, 전화 또는 톡톡 문의 내용을 작성해주세요."
            required
          />

          <p style={contentSectionCountStyle}>
            마무리 글 {normalizeText(closingSection.content).length}자
          </p>
        </section>

        <ImageQualityPanel report={imageReport} />

        {uploading && <p>이미지 업로드 중...</p>}

        <label style={labelStyle}>대표 이미지 주소</label>
        <input
          name="image_url"
          value={form.image_url}
          onChange={handleChange}
          style={inputStyle}
          placeholder="대표 이미지 업로드 시 자동 입력됩니다."
        />

        <div style={autoBoxStyle}>
          <strong>자동 생성 대표 SEO 키워드</strong>
          <p>
            {form.seo_keyword ||
              "지점, 기기, 모델명, 증상을 입력하면 자동 생성됩니다."}
          </p>
        </div>

        <div style={autoBoxStyle}>
          <strong>자동 생성 대표 ALT 문구</strong>
          <p>{form.alt_text || "이미지 설명이 자동 생성됩니다."}</p>
        </div>

        <SeoReadinessPanel report={seoReport} />

        <button
          type="submit"
          style={{
            ...buttonStyle,
            opacity: saving || uploading ? 0.65 : 1,
          }}
          disabled={saving || uploading}
        >
          {saving ? "저장 중입니다..." : "수리사례 등록하기"}
        </button>
        {registeredCaseUrl && (
          <div style={registeredUrlBoxStyle}>
            <strong>새 수리사례 등록 완료</strong>

            <p style={registeredUrlTextStyle}>{registeredCaseUrl}</p>

            <div style={registeredButtonWrapStyle}>
              <a
                href={registeredCaseUrl}
                target="_blank"
                rel="noreferrer"
                style={registeredOpenButtonStyle}
              >
                새 글 열기
              </a>

              <button
                type="button"
                onClick={copyRegisteredUrl}
                style={registeredCopyButtonStyle}
              >
                주소 복사
              </button>
            </div>

            <div style={searchRequestGuideStyle}>
              <p style={searchRequestTitleStyle}>등록 후 SEO 제출 체크리스트</p>

              <ul style={submitChecklistStyle}>
                <li>새 글 열기로 상세페이지가 정상 표시되는지 확인</li>
                <li>주소 복사 후 네이버 웹페이지 수집 요청</li>
                <li>구글 Search Console에서 URL 검사 후 색인 생성 요청</li>
                <li>sitemap.xml과 rss.xml에 새 글이 반영되는지 확인</li>
              </ul>

              <div style={submitButtonWrapStyle}>
                <a
                  href={NAVER_SEARCH_ADVISOR_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={naverSubmitButtonStyle}
                >
                  네이버 수집 요청
                </a>

                <a
                  href={GOOGLE_SEARCH_CONSOLE_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={googleSubmitButtonStyle}
                >
                  구글 색인 요청
                </a>

                <a
                  href={SITEMAP_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={sitemapButtonStyle}
                >
                  sitemap 확인
                </a>

                <a
                  href={RSS_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={rssButtonStyle}
                >
                  RSS 확인
                </a>
              </div>

              <p style={searchRequestSmallTextStyle}>
                네이버와 구글에는 위 새 글 주소를 복사해서 입력하면 됩니다.
              </p>
            </div>
          </div>
        )}
        {message && (
          <p style={{ fontWeight: "800", marginTop: "18px" }}>{message}</p>
        )}
      </form>
    </main>
  );
}

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  background: "#f8fafc",
  padding: "30px",
  borderRadius: "18px",
  border: "1px solid #e5e7eb",
};

const labelStyle = {
  fontWeight: "800",
  marginTop: "10px",
};

const smallLabelStyle = {
  display: "block",
  fontWeight: "800",
  fontSize: "13px",
  padding: "10px 10px 4px",
};

const inputStyle = {
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "16px",
};

const writingOrderGuideStyle = {
  marginBottom: "8px",
  padding: "15px 16px",
  borderRadius: "14px",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  color: "#1e3a8a",
  lineHeight: 1.7,
};

const autoBoxStyle = {
  background: "white",
  border: "1px solid #dbeafe",
  borderRadius: "14px",
  padding: "16px",
  lineHeight: 1.6,
};

const previewImageStyle = {
  width: "100%",
  maxHeight: "280px",
  objectFit: "cover",
  borderRadius: "14px",
  marginTop: "10px",
};

const galleryStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginTop: "10px",
};

const galleryItemStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  overflow: "hidden",
  background: "white",
};

const galleryImageStyle = {
  width: "100%",
  height: "150px",
  objectFit: "cover",
  display: "block",
};

const imageTextAreaStyle = {
  width: "100%",
  minHeight: "90px",
  border: "none",
  borderTop: "1px solid #e5e7eb",
  padding: "10px",
  fontSize: "14px",
  lineHeight: 1.5,
  resize: "vertical",
  boxSizing: "border-box",
};

const removeButtonStyle = {
  width: "100%",
  border: "none",
  background: "#dc2626",
  color: "white",
  padding: "9px",
  cursor: "pointer",
  fontWeight: "800",
};

const contentSectionEditorStyle = {
  marginTop: "18px",
  padding: "22px",
  borderRadius: "20px",
  background: "#eef6ff",
  border: "1px solid #bfdbfe",
};

const contentSectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap",
};

const contentSectionLabelStyle = {
  margin: "0 0 7px",
  color: "#1e3a8a",
  fontSize: "14px",
  fontWeight: "900",
};

const contentSectionTitleStyle = {
  margin: 0,
  fontSize: "25px",
};

const contentSectionSummaryStyle = {
  padding: "9px 13px",
  borderRadius: "999px",
  background: "#ffffff",
  border: "1px solid #93c5fd",
  color: "#1e3a8a",
  fontSize: "14px",
  fontWeight: "900",
};

const contentSectionGuideStyle = {
  margin: "14px 0 20px",
  color: "#475569",
  lineHeight: 1.7,
};

const contentSectionEmptyStyle = {
  padding: "24px",
  borderRadius: "16px",
  background: "#f8fafc",
  border: "1px dashed #94a3b8",
  color: "#475569",
  lineHeight: 1.7,
};

const contentSectionListStyle = {
  display: "grid",
  gap: "18px",
};

const contentSectionCardStyle = {
  padding: "26px",
  borderRadius: "18px",
  background: "#ffffff",
  border: "1px solid #dbeafe",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
};

const contentSectionCardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "14px",
  color: "#1e3a8a",
};

const contentSectionThumbGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: "10px",
  marginBottom: "16px",
};

const contentSectionThumbItemStyle = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
};

const contentSectionThumbStyle = {
  width: "100%",
  height: "120px",
  objectFit: "cover",
  display: "block",
};

const contentSectionThumbNumberStyle = {
  display: "block",
  padding: "7px 9px",
  color: "#475569",
  fontSize: "12px",
  fontWeight: "900",
  textAlign: "center",
};

const contentSectionTextAreaStyle = {
  ...inputStyle,
  width: "100%",
  minHeight: "230px",
  resize: "vertical",
  fontSize: "17px",
  lineHeight: 1.8,
  boxSizing: "border-box",
};

const introTextAreaStyle = {
  ...inputStyle,
  width: "100%",
  minHeight: "280px",
  resize: "vertical",
  fontSize: "17px",
  lineHeight: 1.8,
  boxSizing: "border-box",
};

const contentSectionTitleInputStyle = {
  ...inputStyle,
  width: "100%",
  minHeight: "58px",
  fontSize: "18px",
  fontWeight: "800",
  boxSizing: "border-box",
};

const contentSectionCountStyle = {
  margin: "8px 0 0",
  color: "#64748b",
  fontSize: "13px",
  textAlign: "right",
};

const closingEditorStyle = {
  marginTop: "18px",
  padding: "24px",
  borderRadius: "20px",
  background: "#fff7ed",
  border: "1px solid #fed7aa",
};

const closingEditorGuideStyle = {
  margin: "14px 0 18px",
  color: "#475569",
  lineHeight: 1.8,
};

const closingTextAreaStyle = {
  ...inputStyle,
  width: "100%",
  minHeight: "320px",
  resize: "vertical",
  fontSize: "17px",
  lineHeight: 1.8,
  boxSizing: "border-box",
};

const closingTitleInputStyle = {
  ...inputStyle,
  width: "100%",
  minHeight: "58px",
  fontSize: "18px",
  fontWeight: "800",
  boxSizing: "border-box",
};

const buttonStyle = {
  marginTop: "24px",
  padding: "16px",
  border: "none",
  borderRadius: "999px",
  background: "#1e3a8a",
  color: "white",
  fontSize: "17px",
  fontWeight: "900",
  cursor: "pointer",
};

const seoPanelStyle = {
  marginTop: "22px",
  padding: "24px",
  borderRadius: "20px",
  background: "#ffffff",
  border: "1px solid #dbeafe",
  boxShadow: "0 8px 22px rgba(15, 23, 42, 0.07)",
};

const seoPanelHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "18px",
};

const seoPanelLabelStyle = {
  margin: "0 0 8px",
  color: "#1e3a8a",
  fontWeight: "900",
  fontSize: "14px",
};

const seoPanelTitleStyle = {
  margin: 0,
  fontSize: "26px",
};

const scoreCircleStyle = {
  width: "76px",
  height: "76px",
  border: "5px solid",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
  fontSize: "24px",
  flexShrink: 0,
};

const scoreSmallTextStyle = {
  fontSize: "13px",
  marginLeft: "2px",
};

const scoreBarBgStyle = {
  width: "100%",
  height: "12px",
  background: "#e5e7eb",
  borderRadius: "999px",
  overflow: "hidden",
  marginTop: "20px",
};

const scoreBarFillStyle = {
  height: "100%",
  borderRadius: "999px",
};

const scoreStatusStyle = {
  margin: "12px 0 0",
  fontWeight: "900",
};

const seoCheckListStyle = {
  marginTop: "18px",
  display: "grid",
  gap: "10px",
};

const seoCheckItemStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "12px",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
};

const seoCheckHelpStyle = {
  margin: "5px 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.5,
};

const imageQualityPanelStyle = {
  marginTop: "18px",
  padding: "20px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
};

const imageQualityTitleStyle = {
  fontSize: "22px",
  margin: "0 0 10px",
};

const imageQualityTextStyle = {
  margin: 0,
  color: "#64748b",
  lineHeight: 1.7,
};

const imageStatsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: "10px",
  marginTop: "14px",
};

const imageStatCardStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  padding: "12px",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  color: "#334155",
};

const imageQualityListStyle = {
  display: "grid",
  gap: "8px",
  marginTop: "16px",
};

const imageQualityRowStyle = {
  padding: "12px",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
};

const imageQualityRowTextStyle = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.5,
};

const registeredUrlBoxStyle = {
  marginTop: "22px",
  padding: "22px",
  borderRadius: "18px",
  background: "#ecfdf5",
  border: "1px solid #bbf7d0",
  color: "#064e3b",
};

const registeredUrlTextStyle = {
  marginTop: "10px",
  padding: "12px",
  borderRadius: "12px",
  background: "#ffffff",
  border: "1px solid #bbf7d0",
  wordBreak: "break-all",
  fontWeight: "800",
};

const registeredButtonWrapStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "14px",
};

const registeredOpenButtonStyle = {
  display: "inline-block",
  padding: "12px 16px",
  borderRadius: "999px",
  background: "#16a34a",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "900",
};

const registeredCopyButtonStyle = {
  display: "inline-block",
  padding: "12px 16px",
  borderRadius: "999px",
  background: "#111827",
  color: "#ffffff",
  border: "none",
  cursor: "pointer",
  fontWeight: "900",
};

const searchRequestGuideStyle = {
  marginTop: "16px",
  padding: "14px",
  borderRadius: "14px",
  background: "#ffffff",
  border: "1px solid #d1fae5",
  lineHeight: 1.7,
  fontSize: "14px",
};

const searchRequestTitleStyle = {
  margin: "0 0 10px",
  fontWeight: "900",
  color: "#064e3b",
};

const submitChecklistStyle = {
  margin: "0 0 14px 18px",
  padding: 0,
  lineHeight: 1.8,
  color: "#334155",
  fontSize: "14px",
};

const submitButtonWrapStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "12px",
};

const naverSubmitButtonStyle = {
  display: "inline-block",
  padding: "11px 14px",
  borderRadius: "999px",
  background: "#03c75a",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "900",
  fontSize: "14px",
};

const googleSubmitButtonStyle = {
  display: "inline-block",
  padding: "11px 14px",
  borderRadius: "999px",
  background: "#2563eb",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "900",
  fontSize: "14px",
};

const sitemapButtonStyle = {
  display: "inline-block",
  padding: "11px 14px",
  borderRadius: "999px",
  background: "#111827",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "900",
  fontSize: "14px",
};

const rssButtonStyle = {
  display: "inline-block",
  padding: "11px 14px",
  borderRadius: "999px",
  background: "#475569",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "900",
  fontSize: "14px",
};

const searchRequestSmallTextStyle = {
  margin: "14px 0 0",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.6,
};
