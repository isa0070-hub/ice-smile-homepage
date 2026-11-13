"use client";

import { useMemo, useState } from "react";
import { adminFetch } from "@/lib/adminClient";
import { generateEnglishSlug } from "@/lib/seoEngine";
import {
  AUTHORING_STAGES,
  normalizeAuthoringText,
  getDeviceModelLabel,
  buildRepairCaseTitle,
  buildRepairCaseSummary,
  buildRepairCaseSearchSummary,
  buildRepairCaseKeyword,
  buildRepairCaseMainAlt,
  buildRepairCaseImageAlt,
  sortRepairCaseImages,
  buildRepairCaseContentSections,
  composeRepairCaseContentSections,
  analyzeRepairCaseContentQuality,
  validateRepairCaseDraft,
} from "@/lib/repairCaseAuthoring";

const SITE_URL = "https://www.ismileagain.co.kr";
const NAVER_SEARCH_ADVISOR_URL =
  "https://searchadvisor.naver.com/console/site/request/crawl?site=https%3A%2F%2Fwww.ismileagain.co.kr";
const GOOGLE_SEARCH_CONSOLE_URL = "https://search.google.com/search-console";
const SITEMAP_URL = SITE_URL + "/sitemap.xml";
const RSS_URL = SITE_URL + "/rss.xml";

const FALLBACK_STAGE_LABELS = {
  intake: "입고 상태",
  diagnosis: "점검",
  repair: "수리 작업",
  verification: "완료 확인",
};

const STAGE_DETAIL_GUIDES = {
  intake: {
    question: "언제·어떤 상황에서 증상이 발생했고 입고 당시 상태는 어땠나요?",
    placeholder:
      "예: 전날까지 정상 사용했지만 다음 날부터 터치가 되지 않았습니다. 화면 출력과 버튼 반응은 정상이고 외관 파손은 없는 상태로 입고됐습니다.",
  },
  diagnosis: {
    question: "무엇을 어떤 순서로 점검했고, 어떤 근거로 원인을 판단했나요?",
    placeholder:
      "예: 초기화 전에 마우스와 디버깅 연결로 소프트웨어 상태를 확인했습니다. 운영체제와 드라이버가 정상이라 내부 커넥터 점검이 필요하다고 판단했습니다.",
  },
  repair: {
    question: "실제 작업 순서와 작업 중 특히 주의하거나 확인한 부분은 무엇인가요?",
    placeholder:
      "예: 전원을 차단하고 액정을 분리한 뒤 보드와 액정 쪽 커넥터를 순서대로 확인했습니다. 이상 신호가 확인된 액정 커넥터를 수리하고 연결 부위를 보강했습니다.",
  },
  verification: {
    question: "수리 후 어떤 기능을 확인했고 수리 전과 비교해 무엇이 달라졌나요?",
    placeholder:
      "예: 조립 전후로 화면 출력과 전 영역 터치, 충전, 무선 연결을 반복 확인했습니다. 터치가 정상 작동했고 추가 이상 신호가 없는 것을 확인했습니다.",
  },
};

function createInitialDraft() {
  return {
    title: "",
    slug: "",
    category: "애플",
    branch: "강변점",
    device: "",
    model: "",
    symptom: "",
    diagnosis: "",
    repairAction: "",
    repairLabel: "",
    verification: "",
    notes: "",
    image_url: "",
    alt_text: "",
    blog_url: "",
    blog_title: "",
  };
}

function normalizeSlugForAdmin(value = "") {
  const clean = String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/&/g, "-and-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (clean.length <= 90) return clean;

  return clean
    .slice(0, 90)
    .replace(/-[^-]*$/g, "")
    .replace(/^-|-$/g, "");
}

function getStageOptions() {
  if (Array.isArray(AUTHORING_STAGES)) {
    return AUTHORING_STAGES.map((stage) => {
      if (typeof stage === "string") {
        return {
          value: stage,
          label: FALLBACK_STAGE_LABELS[stage] || stage,
        };
      }

      const value = stage?.value || stage?.id || stage?.key || "";

      return {
        value,
        label:
          stage?.label ||
          stage?.title ||
          stage?.name ||
          FALLBACK_STAGE_LABELS[value] ||
          value,
      };
    });
  }

  if (AUTHORING_STAGES && typeof AUTHORING_STAGES === "object") {
    return Object.entries(AUTHORING_STAGES).map(([value, config]) => ({
      value,
      label:
        typeof config === "string"
          ? config
          : config?.label ||
            config?.title ||
            config?.name ||
            FALLBACK_STAGE_LABELS[value] ||
            value,
    }));
  }

  return Object.entries(FALLBACK_STAGE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
}

const STAGE_OPTIONS = getStageOptions().filter((stage) => stage.value);

function getStageLabel(value) {
  return (
    STAGE_OPTIONS.find((stage) => stage.value === value)?.label ||
    FALLBACK_STAGE_LABELS[value] ||
    "단계 미선택"
  );
}

function createClientImageId(index = 0) {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return (
    "repair-image-" +
    Date.now() +
    "-" +
    index +
    "-" +
    Math.random().toString(36).slice(2)
  );
}

function createClientSectionId(index = 0) {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return (
    "repair-section-" +
    Date.now() +
    "-" +
    index +
    "-" +
    Math.random().toString(36).slice(2)
  );
}

function isFilled(value) {
  return Boolean(normalizeAuthoringText(value));
}

function AdminBackButton() {
  return (
    <div style={{ marginBottom: "16px" }}>
      <a href="/admin" style={backButtonStyle}>
        ← 관리자 메인으로 돌아가기
      </a>
    </div>
  );
}

function RequiredMark() {
  return <span style={requiredMarkStyle}>필수</span>;
}

function FactField({
  label,
  name,
  value,
  onChange,
  placeholder,
  multiline = false,
  optional = false,
}) {
  return (
    <label style={fieldLabelStyle}>
      <span style={fieldLabelTextStyle}>
        {label}
        {optional ? (
          <span style={optionalTextStyle}>선택</span>
        ) : (
          <RequiredMark />
        )}
      </span>

      {multiline ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={factTextAreaStyle}
          required={!optional}
        />
      ) : (
        <input
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={inputStyle}
          required={!optional}
        />
      )}
    </label>
  );
}

function ChecklistItem({ ok, label, detail }) {
  return (
    <div style={checklistItemStyle}>
      <span
        aria-hidden="true"
        style={{
          ...checkIconStyle,
          background: ok ? "#dcfce7" : "#fee2e2",
          color: ok ? "#166534" : "#b91c1c",
        }}
      >
        {ok ? "✓" : "!"}
      </span>

      <div>
        <strong>{label}</strong>
        {detail && <p style={checkDetailStyle}>{detail}</p>}
      </div>
    </div>
  );
}

function SearchPreview({ title, slug, description }) {
  return (
    <section style={searchPreviewStyle} aria-label="검색 결과 미리보기">
      <p style={eyebrowStyle}>실제 검색 결과에 사용될 내용</p>
      <h2 style={sectionTitleStyle}>검색 결과 미리보기</h2>

      <div style={searchResultCardStyle}>
        <p style={searchSiteStyle}>아이스마일어게인</p>
        <p style={searchUrlStyle}>
          {SITE_URL}/repair-cases/{slug || "자동-생성-주소"}
        </p>
        <p style={searchTitleStyle}>
          {title
            ? title + " | 아이스마일어게인"
            : "필수 정보를 입력하면 제목이 자동으로 만들어집니다."}
        </p>
        <p style={searchDescriptionStyle}>
          {description ||
            "점검 결과, 실제 수리 작업, 완료 확인 내용을 입력하면 검색 설명이 만들어집니다."}
        </p>
      </div>

      <p style={helperTextStyle}>
        검색 서비스는 화면 폭과 검색어에 따라 제목과 설명을 다르게 표시할 수
        있습니다.
      </p>
    </section>
  );
}

export default function AdminRepairCasesPage() {
  const [draft, setDraft] = useState(createInitialDraft);
  const [titleEdited, setTitleEdited] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [repairLabelEdited, setRepairLabelEdited] = useState(false);
  const [mainAltEdited, setMainAltEdited] = useState(false);
  const [detailImages, setDetailImages] = useState([]);
  const [stageDetails, setStageDetails] = useState({});
  const [extraSections, setExtraSections] = useState([]);
  const [closingSection, setClosingSection] = useState(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [registeredCaseUrl, setRegisteredCaseUrl] = useState("");

  const generatedRepairLabel = useMemo(
    () =>
      buildRepairCaseKeyword({
        ...draft,
        repairLabel: "",
        seo_keyword: "",
      }),
    [draft],
  );
  const effectiveRepairLabel = repairLabelEdited
    ? normalizeAuthoringText(draft.repairLabel)
    : generatedRepairLabel;
  const authoringDraft = useMemo(
    () => ({
      ...draft,
      repairLabel: effectiveRepairLabel,
      seo_keyword: effectiveRepairLabel,
    }),
    [draft, effectiveRepairLabel],
  );
  const generatedTitle = useMemo(
    () => buildRepairCaseTitle(authoringDraft),
    [authoringDraft],
  );
  const effectiveTitle = titleEdited ? draft.title : generatedTitle;
  const summary = useMemo(
    () => buildRepairCaseSummary(authoringDraft),
    [authoringDraft],
  );
  const searchSummary = useMemo(
    () => buildRepairCaseSearchSummary(authoringDraft),
    [authoringDraft],
  );
  const introContent = searchSummary || summary;
  const keyword = effectiveRepairLabel;
  const deviceModelLabel = useMemo(() => getDeviceModelLabel(draft), [draft]);

  const generatedSlug = useMemo(() => {
    return normalizeSlugForAdmin(
      generateEnglishSlug({
        ...draft,
        title: effectiveTitle,
        repair_content: introContent,
      }),
    );
  }, [draft, effectiveTitle, introContent]);

  const effectiveSlug = normalizeSlugForAdmin(
    slugEdited ? draft.slug : generatedSlug,
  );

  const effectiveDraft = useMemo(
    () => ({
      ...authoringDraft,
      title: effectiveTitle,
      slug: effectiveSlug,
      repair_content: introContent,
      seo_keyword: keyword,
      searchSummary,
    }),
    [authoringDraft, effectiveTitle, effectiveSlug, introContent, keyword, searchSummary],
  );

  const sortedImages = useMemo(
    () => sortRepairCaseImages(detailImages),
    [detailImages],
  );

  const preparedImages = useMemo(
    () =>
      sortedImages.map((image, index) => ({
        ...image,
        alt_text: image.altEdited
          ? image.alt_text
          : buildRepairCaseImageAlt(
              effectiveDraft,
              image.description,
              index,
            ),
        sort_order: index,
      })),
    [effectiveDraft, sortedImages],
  );

  const selectedMainImage = useMemo(
    () =>
      preparedImages.find(
        (image) => image.image_url && image.image_url === draft.image_url,
      ) || null,
    [draft.image_url, preparedImages],
  );
  const generatedMainAlt = useMemo(
    () =>
      selectedMainImage?.alt_text ||
      selectedMainImage?.description ||
      buildRepairCaseMainAlt(effectiveDraft),
    [effectiveDraft, selectedMainImage],
  );
  const effectiveMainAlt = mainAltEdited ? draft.alt_text : generatedMainAlt;

  const generatedContentSections = useMemo(
    () => buildRepairCaseContentSections(effectiveDraft, preparedImages),
    [effectiveDraft, preparedImages],
  );
  const contentSections = useMemo(
    () =>
      composeRepairCaseContentSections(generatedContentSections, {
        stageDetails,
        extraSections,
        closingSection,
      }),
    [generatedContentSections, stageDetails, extraSections, closingSection],
  );
  const processContentSections = useMemo(
    () => contentSections.filter((section) => section?.type !== "closing"),
    [contentSections],
  );
  const contentQuality = useMemo(
    () => analyzeRepairCaseContentQuality(contentSections),
    [contentSections],
  );
  const supplementarySectionErrors = useMemo(() => {
    const errors = [];

    extraSections.forEach((section, index) => {
      if (!isFilled(section.title) || !isFilled(section.content)) {
        errors.push(
          `추가 과정 ${index + 1}의 소제목과 상세 설명을 모두 입력하거나 해당 구간을 삭제해주세요.`,
        );
      }
    });

    if (
      closingSection &&
      (!isFilled(closingSection.title) || !isFilled(closingSection.content))
    ) {
      errors.push(
        "마무리 글의 소제목과 상세 설명을 모두 입력하거나 마무리 구간을 삭제해주세요.",
      );
    }

    return errors;
  }, [extraSections, closingSection]);

  const validation = useMemo(
    () => validateRepairCaseDraft(effectiveDraft, preparedImages),
    [effectiveDraft, preparedImages],
  );

  const coreFactsReady = [
    draft.category,
    draft.branch,
    draft.device,
    draft.model,
    draft.symptom,
  ].every(isFilled);
  const workFactsReady = [
    draft.diagnosis,
    draft.repairAction,
    effectiveRepairLabel,
    draft.verification,
  ].every(isFilled);
  const imageFactsReady = preparedImages.every(
    (image) => isFilled(image.stage) && isFilled(image.description),
  );
  const generatedSearchReady =
    isFilled(effectiveTitle) &&
    isFilled(effectiveSlug) &&
    isFilled(searchSummary);
  const canSubmit =
    Boolean(validation?.isValid) &&
    coreFactsReady &&
    workFactsReady &&
    imageFactsReady &&
    generatedSearchReady &&
    supplementarySectionErrors.length === 0;

  function handleFactChange(event) {
    const { name, value } = event.target;

    setDraft((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleStageDetailChange(stageKey, value) {
    setStageDetails((previous) => ({
      ...previous,
      [stageKey]: value,
    }));
  }

  function resetStageDetail(stageKey) {
    setStageDetails((previous) => {
      const next = { ...previous };
      delete next[stageKey];
      return next;
    });
  }

  function addExtraSection() {
    setExtraSections((previous) => [
      ...previous,
      {
        client_id: createClientSectionId(previous.length),
        title: "",
        content: "",
      },
    ]);
  }

  function updateExtraSection(clientId, field, value) {
    setExtraSections((previous) =>
      previous.map((section) =>
        section.client_id === clientId
          ? { ...section, [field]: value }
          : section,
      ),
    );
  }

  function removeExtraSection(clientId) {
    setExtraSections((previous) =>
      previous.filter((section) => section.client_id !== clientId),
    );
  }

  function addClosingSection() {
    setClosingSection({
      title: "수리 후 확인 및 사용 안내",
      content: "",
    });
  }

  function updateClosingSection(field, value) {
    setClosingSection((previous) => ({
      ...(previous || {}),
      [field]: value,
    }));
  }

  function handleTitleChange(event) {
    setTitleEdited(true);
    setDraft((previous) => ({
      ...previous,
      title: event.target.value,
    }));
  }

  function handleRepairLabelChange(event) {
    setRepairLabelEdited(true);
    setDraft((previous) => ({
      ...previous,
      repairLabel: event.target.value,
    }));
  }

  function resetGeneratedRepairLabel() {
    setRepairLabelEdited(false);
    setDraft((previous) => ({ ...previous, repairLabel: "" }));
  }

  function resetGeneratedTitle() {
    setTitleEdited(false);
    setDraft((previous) => ({ ...previous, title: "" }));
  }

  function handleSlugChange(event) {
    setSlugEdited(true);
    setDraft((previous) => ({
      ...previous,
      slug: event.target.value,
    }));
  }

  function resetGeneratedSlug() {
    setSlugEdited(false);
    setDraft((previous) => ({ ...previous, slug: "" }));
  }

  function handleMainAltChange(event) {
    setMainAltEdited(true);
    setDraft((previous) => ({
      ...previous,
      alt_text: event.target.value,
    }));
  }

  function resetGeneratedMainAlt() {
    setMainAltEdited(false);
    setDraft((previous) => ({ ...previous, alt_text: "" }));
  }

  async function uploadSingleFile(file) {
    const contentType = String(file.type || "").toLowerCase();
    const uploadSlug = effectiveSlug || generatedSlug || "repair-case";

    const prepareResponse = await fetch("/api/r2-upload-url", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contentType,
        fileSize: file.size,
        slug: uploadSlug,
        imageRole: "detail",
      }),
    });

    const prepareResult = await prepareResponse.json().catch(() => null);

    if (!prepareResponse.ok || !prepareResult?.success) {
      throw new Error(
        prepareResult?.message ||
          "이미지 업로드 주소를 준비하지 못했습니다.",
      );
    }

    const uploadResponse = await fetch(prepareResult.uploadUrl, {
      method: "PUT",
      headers: prepareResult.uploadHeaders,
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(
        "R2 이미지 업로드에 실패했습니다. (" +
          uploadResponse.status +
          ")",
      );
    }

    return prepareResult.publicUrl;
  }

  async function handleDetailImagesUpload(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setMessage("");

    try {
      const uploadedImages = [];

      for (let index = 0; index < files.length; index += 1) {
        const publicUrl = await uploadSingleFile(files[index]);

        uploadedImages.push({
          client_id: createClientImageId(detailImages.length + index),
          stage: "",
          image_url: publicUrl,
          description: "",
          alt_text: "",
          altEdited: false,
          sort_order: detailImages.length + index,
        });
      }

      setDetailImages((previous) => [...previous, ...uploadedImages]);
      setDraft((previous) =>
        previous.image_url || !uploadedImages[0]?.image_url
          ? previous
          : { ...previous, image_url: uploadedImages[0].image_url },
      );

      setMessage(
        files.length +
          "장 업로드 완료 · 각 사진의 단계와 실제 보이는 내용을 입력해주세요.",
      );
      event.target.value = "";
    } catch (error) {
      console.error(error);
      setMessage(
        error.message || "상세 이미지 업로드 중 오류가 발생했습니다.",
      );
    } finally {
      setUploading(false);
    }
  }

  function updateImage(clientId, changes) {
    setDetailImages((previous) =>
      previous.map((image) =>
        image.client_id === clientId ? { ...image, ...changes } : image,
      ),
    );
  }

  function handleImageStageChange(clientId, value) {
    updateImage(clientId, { stage: value });
  }

  function handleImageDescriptionChange(clientId, value) {
    updateImage(clientId, { description: value });
  }

  function handleImageUrlChange(image, value) {
    updateImage(image.client_id, { image_url: value });

    if (draft.image_url === image.image_url) {
      setDraft((previous) => ({
        ...previous,
        image_url: value,
      }));
    }
  }

  function handleImageAltChange(clientId, value) {
    updateImage(clientId, {
      alt_text: value,
      altEdited: true,
    });
  }

  function resetGeneratedImageAlt(clientId) {
    updateImage(clientId, {
      alt_text: "",
      altEdited: false,
    });
  }

  function selectMainImage(image) {
    setMainAltEdited(false);
    setDraft((previous) => ({
      ...previous,
      image_url: image.image_url,
      alt_text: "",
    }));
  }

  function removeDetailImage(clientId) {
    const removedImage = detailImages.find(
      (image) => image.client_id === clientId,
    );
    const remainingImages = detailImages.filter(
      (image) => image.client_id !== clientId,
    );

    setDetailImages(
      remainingImages.map((image, index) => ({
        ...image,
        sort_order: index,
      })),
    );

    if (removedImage && draft.image_url === removedImage.image_url) {
      const nextMainImage = sortRepairCaseImages(remainingImages)[0];
      setDraft((previous) => ({
        ...previous,
        image_url: nextMainImage?.image_url || "",
      }));
    }
  }

  async function copyRegisteredUrl() {
    if (!registeredCaseUrl) return;

    try {
      await navigator.clipboard.writeText(registeredCaseUrl);
      setMessage("새 수리사례 주소가 복사되었습니다.");
    } catch (error) {
      console.error(error);
      setMessage("주소 복사에 실패했습니다. 주소를 직접 복사해주세요.");
    }
  }

  function resetForm() {
    setDraft(createInitialDraft());
    setTitleEdited(false);
    setSlugEdited(false);
    setRepairLabelEdited(false);
    setMainAltEdited(false);
    setDetailImages([]);
    setStageDetails({});
    setExtraSections([]);
    setClosingSection(null);
    setSubmitAttempted(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitAttempted(true);
    setMessage("");
    setRegisteredCaseUrl("");

    const currentValidation = validateRepairCaseDraft(
      effectiveDraft,
      preparedImages,
    );

    if (
      !currentValidation?.isValid ||
      !coreFactsReady ||
      !workFactsReady ||
      !imageFactsReady ||
      !generatedSearchReady ||
      supplementarySectionErrors.length > 0
    ) {
      const firstError =
        currentValidation?.errors?.[0] || supplementarySectionErrors[0];
      setMessage(
        typeof firstError === "string"
          ? firstError
          : firstError?.message ||
              "필수 사실과 사진의 단계·설명을 확인해주세요.",
      );
      return;
    }

    setSaving(true);

    try {
      const finalSlug = effectiveSlug || "repair-case";
      const finalForm = {
        title: normalizeAuthoringText(effectiveTitle),
        slug: finalSlug,
        category: normalizeAuthoringText(draft.category),
        branch: normalizeAuthoringText(draft.branch),
        device: normalizeAuthoringText(draft.device),
        model: normalizeAuthoringText(draft.model),
        symptom: normalizeAuthoringText(draft.symptom),
        repair_content: introContent,
        seo_keyword: keyword,
        image_url: normalizeAuthoringText(draft.image_url),
        alt_text: draft.image_url
          ? normalizeAuthoringText(effectiveMainAlt)
          : "",
        blog_url: normalizeAuthoringText(draft.blog_url),
        blog_title: normalizeAuthoringText(draft.blog_title),
        content_sections:
          contentSections.length > 0 ? contentSections : null,
      };

      const result = await adminFetch("/api/admin/content/repair-cases", {
        method: "POST",
        body: JSON.stringify({
          data: finalForm,
          detailImages: preparedImages.map((image, index) => ({
            image_url: image.image_url,
            alt_text: image.alt_text,
            description: image.description,
            sort_order: index,
          })),
        }),
      });

      const savedSlug = result.data.slug;
      const newCaseUrl = SITE_URL + "/repair-cases/" + savedSlug;
      setRegisteredCaseUrl(newCaseUrl);
      setMessage("실제 수리 기록과 사진이 등록되었습니다.");
      resetForm();
    } catch (error) {
      console.error(error);
      setMessage(
        error.message ||
          "등록 중 오류가 발생했습니다. 입력값 또는 네트워크 상태를 확인해주세요.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={pageStyle}>
      <AdminBackButton />

      <header style={pageHeaderStyle}>
        <p style={pageEyebrowStyle}>실제 수리 사실 중심 작성</p>
        <h1 style={pageTitleStyle}>수리사례 등록</h1>
        <p style={pageDescriptionStyle}>
          점검·수리·완료 사실을 한 번만 입력하면 제목, 검색 설명, 본문과
          이미지 ALT가 자동으로 정리됩니다. 자동 문구는 입력한 사실만
          사용합니다.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate style={formStyle}>
        <section style={stepSectionStyle}>
          <div style={stepHeaderStyle}>
            <span style={stepNumberStyle}>1</span>
            <div>
              <p style={eyebrowStyle}>작성자가 입력하는 핵심 정보</p>
              <h2 style={sectionTitleStyle}>실제 수리 사실</h2>
            </div>
          </div>

          <p style={sectionIntroStyle}>
            추측이나 홍보 문구 대신 이번 기기에서 직접 확인한 내용만 짧게
            적어주세요.
          </p>

          <div style={twoColumnGridStyle}>
            <label style={fieldLabelStyle}>
              <span style={fieldLabelTextStyle}>
                카테고리 <RequiredMark />
              </span>
              <select
                name="category"
                value={draft.category}
                onChange={handleFactChange}
                style={inputStyle}
                required
              >
                <option>애플</option>
                <option>마이크로소프트 서피스</option>
                <option>노트북 및 태블릿</option>
              </select>
            </label>

            <label style={fieldLabelStyle}>
              <span style={fieldLabelTextStyle}>
                지점 <RequiredMark />
              </span>
              <select
                name="branch"
                value={draft.branch}
                onChange={handleFactChange}
                style={inputStyle}
                required
              >
                <option>강변점</option>
                <option>선릉점</option>
                <option>신도림점</option>
              </select>
            </label>

            <FactField
              label="기기 종류"
              name="device"
              value={draft.device}
              onChange={handleFactChange}
              placeholder="예: 아이폰, 아이패드, 맥북, 서피스"
            />

            <FactField
              label="정확한 모델명"
              name="model"
              value={draft.model}
              onChange={handleFactChange}
              placeholder="예: 아이폰 15 프로, 서피스 프로 7"
            />
          </div>

          <div style={factStackStyle}>
            <FactField
              label="고객이 접수한 증상"
              name="symptom"
              value={draft.symptom}
              onChange={handleFactChange}
              placeholder="예: 떨어뜨린 뒤 화면이 깨지고 터치가 되지 않음"
              multiline
            />

            <FactField
              label="점검에서 실제로 확인한 것"
              name="diagnosis"
              value={draft.diagnosis}
              onChange={handleFactChange}
              placeholder="예: 전면 유리와 OLED가 파손됐고 다른 주요 기능은 정상"
              multiline
            />

            <FactField
              label="실제로 진행한 수리 작업"
              name="repairAction"
              value={draft.repairAction}
              onChange={handleFactChange}
              placeholder="예: 파손 액정을 분리하고 새 액정으로 교체"
              multiline
            />

            <label style={fieldLabelStyle}>
              <span style={fieldLabelTextStyle}>
                짧은 수리 작업명 <RequiredMark />
                <span style={optionalTextStyle}>
                  {repairLabelEdited ? "직접 수정" : "자동 제안"}
                </span>
              </span>
              <input
                value={effectiveRepairLabel || ""}
                onChange={handleRepairLabelChange}
                placeholder="예: 정품 액정 교체"
                style={inputStyle}
                required
              />
              <span style={helperTextStyle}>
                제목·검색 설명·FAQ에 사용하는 짧은 명칭입니다. 긴 수리 설명은
                바로 위 본문에 그대로 유지됩니다.
              </span>
              {repairLabelEdited && (
                <button
                  type="button"
                  onClick={resetGeneratedRepairLabel}
                  style={textButtonStyle}
                >
                  자동 제안으로 되돌리기
                </button>
              )}
            </label>

            <FactField
              label="작업 후 확인한 결과"
              name="verification"
              value={draft.verification}
              onChange={handleFactChange}
              placeholder="예: 화면 출력, 터치, 페이스 아이디를 반복 확인해 정상 작동"
              multiline
            />

            <FactField
              label="이 사례만의 추가 메모"
              name="notes"
              value={draft.notes}
              onChange={handleFactChange}
              placeholder="예: 침수 흔적 없음, 고객 요청으로 보호필름 함께 부착"
              multiline
              optional
            />
          </div>

          <div style={generatedContentStyle}>
            <div style={generatedHeaderStyle}>
              <div>
                <p style={eyebrowStyle}>자동 정리된 본문</p>
                <strong style={generatedDeviceStyle}>
                  {deviceModelLabel || "기기·모델 입력 전"}
                </strong>
              </div>
              <span style={autoBadgeStyle}>자동</span>
            </div>
            <p style={generatedBodyStyle}>
              {introContent ||
                "위의 실제 수리 사실을 입력하면 고객과 검색봇이 읽기 쉬운 본문으로 정리됩니다."}
            </p>
          </div>
        </section>

        <section style={stepSectionStyle}>
          <div style={stepHeaderStyle}>
            <span style={stepNumberStyle}>2</span>
            <div>
              <p style={eyebrowStyle}>사례마다 다른 실제 경험 보강</p>
              <h2 style={sectionTitleStyle}>검색용 상세 본문</h2>
            </div>
          </div>

          <p style={sectionIntroStyle}>
            위에서 입력한 핵심 사실은 제목과 검색 설명에 그대로 사용됩니다.
            아래에는 이번 기기에서 직접 확인한 판단 근거와 작업 과정을 문장으로
            보충해주세요. 입력하지 않은 사실을 추측하거나 같은 키워드를 반복하지
            마세요.
          </p>

          <div
            style={{
              ...contentQualityBoxStyle,
              borderColor: contentQuality.meetsInternalGuidance
                ? "#86efac"
                : "#fdba74",
              background: contentQuality.meetsInternalGuidance
                ? "#f0fdf4"
                : "#fff7ed",
            }}
          >
            <div style={contentQualityHeaderStyle}>
              <strong>
                사례 고유 본문 {contentQuality.characterCount.toLocaleString()}자
              </strong>
              <span
                style={{
                  ...contentQualityBadgeStyle,
                  background: contentQuality.meetsInternalGuidance
                    ? "#dcfce7"
                    : "#ffedd5",
                  color: contentQuality.meetsInternalGuidance
                    ? "#166534"
                    : "#9a3412",
                }}
              >
                {contentQuality.meetsInternalGuidance
                  ? "상세 본문 준비"
                  : "보완 권장"}
              </span>
            </div>

            {contentQuality.meetsInternalGuidance ? (
              <p style={contentQualityTextStyle}>
                네 단계에 실제 사례 설명이 고르게 포함되어 있습니다. 반복 문장이나
                과장 표현이 없는지 마지막으로 확인해주세요.
              </p>
            ) : (
              <p style={contentQualityTextStyle}>
                네이버가 정한 최소 글자 수는 없습니다. 이 수치는 등록을 막는 기준이
                아니라 작성 도움용 내부 점검입니다. 증상 발생 상황, 점검 판단 근거,
                실제 작업 순서, 수리 후 테스트를 각 단계에 2~4문장씩 보완하면 다양한
                검색 질문에 대응하기 좋습니다.
              </p>
            )}

            {contentQuality.shortStageIndexes.length > 0 && (
              <p style={contentQualityHintStyle}>
                설명 보강 권장: {contentQuality.shortStageIndexes
                  .map((index) => AUTHORING_STAGES[index]?.title)
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            {contentQuality.repeatedParagraphs.length > 0 && (
              <p style={contentQualityWarningStyle}>
                같은 긴 문장이 여러 구간에서 반복됩니다. 각 단계에서 실제로 다른
                내용을 적어주세요.
              </p>
            )}
          </div>

          <div style={contentSectionListStyle}>
            {AUTHORING_STAGES.map((stage, index) => {
              const generatedSection = generatedContentSections[index] || {};
              const detailValue = stageDetails[stage.key] || "";
              const guide = STAGE_DETAIL_GUIDES[stage.key] || {};
              const hasImages = Number(generatedSection.image_start) > 0;
              const imageRange = hasImages
                ? generatedSection.image_start === generatedSection.image_end
                  ? `사진 ${generatedSection.image_start} 자동 연결`
                  : `사진 ${generatedSection.image_start}~${generatedSection.image_end} 자동 연결`
                : "연결 사진 없음";

              return (
                <article key={stage.key} style={contentSectionCardStyle}>
                  <div style={contentSectionHeaderStyle}>
                    <div>
                      <span style={contentSectionNumberStyle}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 style={contentSectionTitleStyle}>{stage.title}</h3>
                    </div>
                    <span style={imageRangeBadgeStyle}>{imageRange}</span>
                  </div>

                  <div style={baseFactPreviewStyle}>
                    <span>위에서 입력한 핵심 사실</span>
                    <p>
                      {generatedSection.content ||
                        "1단계의 핵심 사실을 먼저 입력해주세요."}
                    </p>
                  </div>

                  <label style={fieldLabelStyle}>
                    <span style={fieldLabelTextStyle}>
                      단계별 상세 설명
                      <span style={optionalTextStyle}>선택·권장</span>
                    </span>
                    <span style={detailQuestionStyle}>{guide.question}</span>
                    <textarea
                      value={detailValue}
                      onChange={(event) =>
                        handleStageDetailChange(stage.key, event.target.value)
                      }
                      placeholder={guide.placeholder}
                      style={richTextAreaStyle}
                    />
                  </label>

                  <div style={sectionCardFooterStyle}>
                    <span>
                      공백 제외 {detailValue.replace(/\s+/gu, "").length}자
                    </span>
                    {detailValue && (
                      <button
                        type="button"
                        onClick={() => resetStageDetail(stage.key)}
                        style={textButtonStyle}
                      >
                        상세 설명 비우기
                      </button>
                    )}
                  </div>
                </article>
              );
            })}

            {extraSections.map((section, index) => {
              const sectionIncomplete =
                submitAttempted &&
                (!isFilled(section.title) || !isFilled(section.content));
              const sectionErrorId = `extra-section-${section.client_id}-error`;

              return (
              <article key={section.client_id} style={contentSectionCardStyle}>
                <div style={contentSectionHeaderStyle}>
                  <div>
                    <span style={contentSectionNumberStyle}>추가</span>
                    <h3 style={contentSectionTitleStyle}>
                      별도 수리 과정 {index + 1}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExtraSection(section.client_id)}
                    aria-label={`별도 수리 과정 ${index + 1} 삭제`}
                    style={removeSectionButtonStyle}
                  >
                    구간 삭제
                  </button>
                </div>

                <p style={sectionCardHelpStyle}>
                  기본 네 단계에 들어가지 않는 실제 점검·작업 내용만 작성해주세요.
                  이 구간에는 사진이 중복되지 않도록 텍스트만 연결됩니다.
                </p>

                <label style={fieldLabelStyle}>
                  <span style={fieldLabelTextStyle}>소제목</span>
                  <input
                    value={section.title}
                    onChange={(event) =>
                      updateExtraSection(
                        section.client_id,
                        "title",
                        event.target.value,
                      )
                    }
                    required
                    aria-invalid={sectionIncomplete}
                    aria-describedby={
                      sectionIncomplete ? sectionErrorId : undefined
                    }
                    placeholder="예: 커넥터 이상 신호와 원인 판단"
                    style={inputStyle}
                  />
                </label>

                <label style={fieldLabelStyle}>
                  <span style={fieldLabelTextStyle}>상세 설명</span>
                  <textarea
                    value={section.content}
                    onChange={(event) =>
                      updateExtraSection(
                        section.client_id,
                        "content",
                        event.target.value,
                      )
                    }
                    required
                    aria-invalid={sectionIncomplete}
                    aria-describedby={
                      sectionIncomplete ? sectionErrorId : undefined
                    }
                    placeholder="이번 사례에서만 확인한 추가 내용과 판단 근거를 작성해주세요."
                    style={richTextAreaStyle}
                  />
                </label>

                {sectionIncomplete && (
                  <p
                    id={sectionErrorId}
                    role="alert"
                    style={contentQualityWarningStyle}
                  >
                    소제목과 상세 설명을 모두 입력하거나 이 구간을 삭제해주세요.
                  </p>
                )}
              </article>
              );
            })}

            {closingSection && (
              <article style={closingEditorStyle}>
                <div style={contentSectionHeaderStyle}>
                  <div>
                    <span style={closingBadgeStyle}>마무리</span>
                    <h3 style={contentSectionTitleStyle}>수리 후 추가 안내</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClosingSection(null)}
                    aria-label="마무리 구간 삭제"
                    style={removeSectionButtonStyle}
                  >
                    구간 삭제
                  </button>
                </div>

                <p style={sectionCardHelpStyle}>
                  주소·전화번호를 반복하기보다 이번 기기의 사용 주의점, 백업 권장,
                  재점검이 필요한 증상처럼 고객에게 실제로 도움이 되는 내용을
                  작성해주세요.
                </p>

                <label style={fieldLabelStyle}>
                  <span style={fieldLabelTextStyle}>소제목</span>
                  <input
                    value={closingSection.title || ""}
                    onChange={(event) =>
                      updateClosingSection("title", event.target.value)
                    }
                    required
                    aria-invalid={
                      submitAttempted &&
                      (!isFilled(closingSection.title) ||
                        !isFilled(closingSection.content))
                    }
                    aria-describedby={
                      submitAttempted &&
                      (!isFilled(closingSection.title) ||
                        !isFilled(closingSection.content))
                        ? "closing-section-error"
                        : undefined
                    }
                    style={inputStyle}
                  />
                </label>

                <label style={fieldLabelStyle}>
                  <span style={fieldLabelTextStyle}>상세 설명</span>
                  <textarea
                    value={closingSection.content || ""}
                    onChange={(event) =>
                      updateClosingSection("content", event.target.value)
                    }
                    required
                    aria-invalid={
                      submitAttempted &&
                      (!isFilled(closingSection.title) ||
                        !isFilled(closingSection.content))
                    }
                    aria-describedby={
                      submitAttempted &&
                      (!isFilled(closingSection.title) ||
                        !isFilled(closingSection.content))
                        ? "closing-section-error"
                        : undefined
                    }
                    placeholder="예: 동일 증상이 다시 나타날 때 확인할 사항과 수리 후 사용 주의점을 작성해주세요."
                    style={richTextAreaStyle}
                  />
                </label>

                {submitAttempted &&
                  (!isFilled(closingSection.title) ||
                    !isFilled(closingSection.content)) && (
                    <p
                      id="closing-section-error"
                      role="alert"
                      style={contentQualityWarningStyle}
                    >
                      소제목과 상세 설명을 모두 입력하거나 마무리 구간을
                      삭제해주세요.
                    </p>
                  )}
              </article>
            )}
          </div>

          <div style={contentActionRowStyle}>
            <button
              type="button"
              onClick={addExtraSection}
              style={secondaryButtonStyle}
            >
              과정 구간 추가
            </button>
            {!closingSection && (
              <button
                type="button"
                onClick={addClosingSection}
                style={secondaryButtonStyle}
              >
                마무리 구간 추가
              </button>
            )}
          </div>

          <p style={nonBlockingGuideStyle}>
            상세 본문이 짧아도 등록할 수 있습니다. 다만 같은 양식에서 문장 몇 개만
            바꾼 글을 반복하기보다, 이번 기기에서 직접 확인한 고유 정보를 충분히
            남기는 것이 네이버 검색 경쟁력에 유리합니다.
          </p>
        </section>

        <section style={stepSectionStyle}>
          <div style={stepHeaderStyle}>
            <span style={stepNumberStyle}>3</span>
            <div>
              <p style={eyebrowStyle}>사진을 보고 직접 확인</p>
              <h2 style={sectionTitleStyle}>수리 사진</h2>
            </div>
          </div>

          <p style={sectionIntroStyle}>
            사진을 한 번에 올린 뒤 각 사진의 단계와 실제로 보이는 내용만
            입력하세요. 대표사진은 홈페이지 목록과 검색 공유 이미지에 사용되며,
            본문에서는 선택한 수리 단계 위치가 그대로 유지됩니다.
          </p>

          <label style={uploadBoxStyle}>
            <strong>상세사진 여러 장 선택</strong>
            <span>
              첫 번째 사진이 자동 선택되며, 업로드 후 원하는 사진을
              대표사진으로 바꿀 수 있습니다.
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleDetailImagesUpload}
              disabled={uploading}
              style={fileInputStyle}
            />
          </label>

          {uploading && (
            <p style={uploadingTextStyle}>
              사진을 안전하게 업로드하고 있습니다...
            </p>
          )}

          {preparedImages.length === 0 ? (
            <div style={emptyImageStyle}>
              <strong>사진은 선택 사항입니다.</strong>
              <p>
                사진을 올리면 모든 사진에 단계와 실제 설명을 입력해야 등록할 수
                있습니다.
              </p>
            </div>
          ) : (
            <div style={imageListStyle}>
              {preparedImages.map((image, index) => {
                const isMain = draft.image_url === image.image_url;
                const imageIncomplete =
                  !isFilled(image.stage) || !isFilled(image.description);

                return (
                  <article
                    key={image.client_id || image.image_url}
                    style={{
                      ...imageCardStyle,
                      borderColor:
                        submitAttempted && imageIncomplete
                          ? "#ef4444"
                          : "#dbeafe",
                    }}
                  >
                    <div style={imagePreviewWrapStyle}>
                      <img
                        src={image.image_url}
                        alt={image.alt_text || "수리 사진 " + (index + 1)}
                        style={imagePreviewStyle}
                      />

                      <div style={imageBadgeRowStyle}>
                        <span style={imageNumberBadgeStyle}>
                          사진 {index + 1}
                        </span>
                        {isMain && <span style={mainBadgeStyle}>대표사진</span>}
                      </div>
                    </div>

                    <div style={imageEditorStyle}>
                      <div style={imageCardHeaderStyle}>
                        <div>
                          <strong>{getStageLabel(image.stage)}</strong>
                          <p style={imageOrderTextStyle}>
                            단계 기준으로 고객 화면 순서가 자동 정리됩니다.
                          </p>
                        </div>

                        {!isMain && (
                          <button
                            type="button"
                            onClick={() => selectMainImage(image)}
                            style={secondaryButtonStyle}
                          >
                            대표사진으로 선택
                          </button>
                        )}
                      </div>

                      <label style={fieldLabelStyle}>
                        <span style={fieldLabelTextStyle}>
                          사진 단계 <RequiredMark />
                        </span>
                        <select
                          value={image.stage || ""}
                          onChange={(event) =>
                            handleImageStageChange(
                              image.client_id,
                              event.target.value,
                            )
                          }
                          style={inputStyle}
                          required
                        >
                          <option value="">직접 선택해주세요</option>
                          {STAGE_OPTIONS.map((stage) => (
                            <option key={stage.value} value={stage.value}>
                              {stage.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={fieldLabelStyle}>
                        <span style={fieldLabelTextStyle}>
                          사진에 실제로 보이는 내용 <RequiredMark />
                        </span>
                        <textarea
                          value={image.description || ""}
                          onChange={(event) =>
                            handleImageDescriptionChange(
                              image.client_id,
                              event.target.value,
                            )
                          }
                          placeholder="예: 파손된 기존 액정을 기기에서 분리한 상태"
                          style={imageDescriptionStyle}
                          required
                        />
                      </label>

                      <div style={autoAltBoxStyle}>
                        <span>자동 ALT</span>
                        <p>
                          {image.alt_text ||
                            "사진 설명을 입력하면 생성됩니다."}
                        </p>
                      </div>

                      <details style={imageAdvancedStyle}>
                        <summary style={detailsSummaryStyle}>
                          이미지 주소·ALT 고급 설정
                        </summary>

                        <div style={detailsBodyStyle}>
                          <label style={fieldLabelStyle}>
                            <span style={fieldLabelTextStyle}>이미지 주소</span>
                            <input
                              value={image.image_url || ""}
                              onChange={(event) =>
                                handleImageUrlChange(image, event.target.value)
                              }
                              style={inputStyle}
                            />
                          </label>

                          <label style={fieldLabelStyle}>
                            <span style={fieldLabelTextStyle}>
                              직접 수정 ALT
                            </span>
                            <textarea
                              value={image.alt_text || ""}
                              onChange={(event) =>
                                handleImageAltChange(
                                  image.client_id,
                                  event.target.value,
                                )
                              }
                              style={compactTextAreaStyle}
                            />
                          </label>

                          {image.altEdited && (
                            <button
                              type="button"
                              onClick={() =>
                                resetGeneratedImageAlt(image.client_id)
                              }
                              style={textButtonStyle}
                            >
                              ALT 자동 생성으로 되돌리기
                            </button>
                          )}
                        </div>
                      </details>

                      <button
                        type="button"
                        onClick={() => removeDetailImage(image.client_id)}
                        style={removeButtonStyle}
                      >
                        이 사진 삭제
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {preparedImages.length > 0 && (
            <div style={sectionPreviewStyle}>
              <p style={eyebrowStyle}>고객 화면 구성</p>
              <strong>
                {processContentSections.length}개 수리 단계로 자동 정리
              </strong>
              <p style={helperTextStyle}>
                {processContentSections
                  .map((section) => section.title)
                  .filter(Boolean)
                  .join(" → ") || "사진 단계 선택 후 구성됩니다."}
              </p>
            </div>
          )}
        </section>

        <section style={stepSectionStyle}>
          <div style={stepHeaderStyle}>
            <span style={stepNumberStyle}>4</span>
            <div>
              <p style={eyebrowStyle}>등록 전 마지막 확인</p>
              <h2 style={sectionTitleStyle}>검색 노출 준비</h2>
            </div>
          </div>

          <div style={reviewGridStyle}>
            <div style={checklistStyle}>
              <ChecklistItem
                ok={coreFactsReady}
                label="기기·모델·증상이 입력됨"
                detail="검색 제목과 사례 분류에 사용됩니다."
              />
              <ChecklistItem
                ok={workFactsReady}
                label="점검·수리·완료 결과가 입력됨"
                detail="이번 사례만의 실제 본문을 만드는 핵심 정보입니다."
              />
              <ChecklistItem
                ok={imageFactsReady}
                label={
                  preparedImages.length > 0
                    ? "모든 사진의 단계·설명이 입력됨"
                    : "사진 없이 등록"
                }
                detail={
                  preparedImages.length > 0
                    ? "사진과 본문의 의미가 일치하는지 확인해주세요."
                    : "사진은 선택 사항이며 나중에 편집 화면에서 추가할 수 있습니다."
                }
              />
              <ChecklistItem
                ok={generatedSearchReady}
                label="제목·주소·검색 설명이 준비됨"
                detail="직접 수정하지 않으면 실제 수리 사실에 맞춰 계속 갱신됩니다."
              />
            </div>

            <div style={validationBoxStyle}>
              <strong>
                {canSubmit ? "등록 준비 완료" : "확인이 필요합니다"}
              </strong>

              {(validation?.errors?.length > 0 ||
                supplementarySectionErrors.length > 0) && (
                <ul style={validationListStyle}>
                  {validation.errors.map((error, index) => (
                    <li key={"error-" + index}>
                      {typeof error === "string" ? error : error?.message}
                    </li>
                  ))}
                  {supplementarySectionErrors.map((error, index) => (
                    <li key={"section-error-" + index}>{error}</li>
                  ))}
                </ul>
              )}

              {validation?.warnings?.length > 0 && (
                <ul style={warningListStyle}>
                  {validation.warnings.map((warning, index) => (
                    <li key={"warning-" + index}>
                      {typeof warning === "string" ? warning : warning?.message}
                    </li>
                  ))}
                </ul>
              )}

              {!validation?.errors?.length &&
                supplementarySectionErrors.length === 0 && (
                <p style={validationSuccessTextStyle}>
                  숫자 점수가 아니라 실제 사실과 사진 설명의 누락 여부만
                  확인합니다.
                </p>
                )}
            </div>
          </div>

          <SearchPreview
            title={effectiveTitle}
            slug={effectiveSlug}
            description={searchSummary}
          />
        </section>

        <details style={advancedSettingsStyle}>
          <summary style={advancedSummaryStyle}>고급 설정 열기</summary>

          <div style={advancedBodyStyle}>
            <p style={advancedIntroStyle}>
              아래 항목은 자동 생성됩니다. 특별한 이유가 있을 때만 직접
              수정하세요. 직접 수정한 값은 이후 필수 사실을 바꿔도 덮어쓰지
              않습니다.
            </p>

            <div style={advancedGridStyle}>
              <label style={fieldLabelStyle}>
                <span style={fieldLabelTextStyle}>
                  제목 {titleEdited ? "· 직접 수정 중" : "· 자동 생성"}
                </span>
                <input
                  value={effectiveTitle || ""}
                  onChange={handleTitleChange}
                  style={inputStyle}
                />
                {titleEdited && (
                  <button
                    type="button"
                    onClick={resetGeneratedTitle}
                    style={textButtonStyle}
                  >
                    제목 자동 생성으로 되돌리기
                  </button>
                )}
              </label>

              <label style={fieldLabelStyle}>
                <span style={fieldLabelTextStyle}>
                  SEO 주소 {slugEdited ? "· 직접 수정 중" : "· 자동 생성"}
                </span>
                <input
                  value={slugEdited ? draft.slug : effectiveSlug}
                  onChange={handleSlugChange}
                  style={inputStyle}
                  placeholder="영문 소문자, 숫자, 하이픈"
                />
                {slugEdited && (
                  <button
                    type="button"
                    onClick={resetGeneratedSlug}
                    style={textButtonStyle}
                  >
                    주소 자동 생성으로 되돌리기
                  </button>
                )}
              </label>

              <label style={fieldLabelStyle}>
                <span style={fieldLabelTextStyle}>
                  네이버 블로그 링크
                </span>
                <input
                  name="blog_url"
                  value={draft.blog_url}
                  onChange={handleFactChange}
                  placeholder="https://blog.naver.com/..."
                  style={inputStyle}
                />
              </label>

              <label style={fieldLabelStyle}>
                <span style={fieldLabelTextStyle}>블로그 글 제목</span>
                <input
                  name="blog_title"
                  value={draft.blog_title}
                  onChange={handleFactChange}
                  placeholder="연결할 블로그 글 제목"
                  style={inputStyle}
                />
              </label>

              <label style={fieldLabelStyle}>
                <span style={fieldLabelTextStyle}>대표 이미지 주소</span>
                <input
                  name="image_url"
                  value={draft.image_url}
                  onChange={handleFactChange}
                  placeholder="첫 상세사진을 자동 사용합니다."
                  style={inputStyle}
                />
              </label>

              <label style={fieldLabelStyle}>
                <span style={fieldLabelTextStyle}>
                  대표 이미지 ALT ·{" "}
                  {mainAltEdited ? "직접 수정" : "자동 생성"}
                </span>
                <textarea
                  value={effectiveMainAlt || ""}
                  onChange={handleMainAltChange}
                  style={compactTextAreaStyle}
                />
                {mainAltEdited && (
                  <button
                    type="button"
                    onClick={resetGeneratedMainAlt}
                    style={textButtonStyle}
                  >
                    대표 ALT 자동 생성으로 되돌리기
                  </button>
                )}
              </label>
            </div>
          </div>
        </details>

        <button
          type="submit"
          disabled={saving || uploading}
          style={{
            ...submitButtonStyle,
            opacity: saving || uploading ? 0.6 : 1,
          }}
        >
          {saving ? "저장 중입니다..." : "실제 수리사례 등록하기"}
        </button>

        {message && (
          <p
            role="status"
            style={{
              ...messageStyle,
              borderColor: canSubmit ? "#bbf7d0" : "#fed7aa",
            }}
          >
            {message}
          </p>
        )}

        {registeredCaseUrl && (
          <section style={registeredBoxStyle}>
            <p style={eyebrowStyle}>등록 완료</p>
            <h2 style={registeredTitleStyle}>
              새 수리사례가 공개되었습니다.
            </h2>
            <p style={registeredUrlStyle}>{registeredCaseUrl}</p>

            <div style={actionRowStyle}>
              <a
                href={registeredCaseUrl}
                target="_blank"
                rel="noreferrer"
                style={primaryLinkStyle}
              >
                새 글 열기
              </a>
              <button
                type="button"
                onClick={copyRegisteredUrl}
                style={darkButtonStyle}
              >
                주소 복사
              </button>
            </div>

            <div style={submissionGuideStyle}>
              <strong>검색 서비스 반영 확인</strong>
              <div style={actionRowStyle}>
                <a
                  href={NAVER_SEARCH_ADVISOR_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={naverLinkStyle}
                >
                  네이버 수집 요청
                </a>
                <a
                  href={GOOGLE_SEARCH_CONSOLE_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={googleLinkStyle}
                >
                  구글 색인 요청
                </a>
                <a
                  href={SITEMAP_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={neutralLinkStyle}
                >
                  sitemap 확인
                </a>
                <a
                  href={RSS_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={neutralLinkStyle}
                >
                  RSS 확인
                </a>
              </div>
            </div>
          </section>
        )}
      </form>
    </main>
  );
}

const pageStyle = {
  maxWidth: "1120px",
  margin: "52px auto 90px",
  padding: "20px",
  color: "#0f172a",
};

const backButtonStyle = {
  display: "inline-flex",
  padding: "10px 14px",
  borderRadius: "10px",
  background: "#f1f5f9",
  color: "#111827",
  textDecoration: "none",
  fontWeight: 800,
  border: "1px solid #cbd5e1",
};

const pageHeaderStyle = {
  marginBottom: "28px",
};

const pageEyebrowStyle = {
  margin: "0 0 8px",
  color: "#1d4ed8",
  fontWeight: 900,
  fontSize: "14px",
};

const pageTitleStyle = {
  margin: 0,
  fontSize: "40px",
  lineHeight: 1.2,
};

const pageDescriptionStyle = {
  maxWidth: "820px",
  margin: "14px 0 0",
  color: "#475569",
  lineHeight: 1.75,
  fontSize: "17px",
};

const formStyle = {
  display: "grid",
  gap: "22px",
};

const stepSectionStyle = {
  padding: "clamp(18px, 4vw, 28px)",
  borderRadius: "24px",
  background: "#ffffff",
  border: "1px solid #dbe4f0",
  boxShadow: "0 12px 34px rgba(15, 23, 42, 0.07)",
};

const stepHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
};

const stepNumberStyle = {
  width: "44px",
  height: "44px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "14px",
  background: "#1d4ed8",
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: 900,
  flexShrink: 0,
};

const eyebrowStyle = {
  margin: "0 0 5px",
  color: "#1d4ed8",
  fontSize: "13px",
  fontWeight: 900,
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: "27px",
  lineHeight: 1.35,
};

const sectionIntroStyle = {
  margin: "16px 0 22px",
  color: "#475569",
  lineHeight: 1.7,
};

const twoColumnGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
  gap: "16px",
};

const factStackStyle = {
  display: "grid",
  gap: "16px",
  marginTop: "18px",
};

const contentQualityBoxStyle = {
  marginBottom: "20px",
  padding: "18px",
  border: "1px solid",
  borderRadius: "16px",
};

const contentQualityHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
};

const contentQualityBadgeStyle = {
  display: "inline-flex",
  padding: "5px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 900,
};

const contentQualityTextStyle = {
  margin: "10px 0 0",
  color: "#475569",
  lineHeight: 1.7,
};

const contentQualityHintStyle = {
  margin: "10px 0 0",
  color: "#9a3412",
  fontWeight: 800,
  lineHeight: 1.6,
};

const contentQualityWarningStyle = {
  margin: "10px 0 0",
  color: "#b91c1c",
  fontWeight: 800,
  lineHeight: 1.6,
};

const contentSectionListStyle = {
  display: "grid",
  gap: "18px",
};

const contentSectionCardStyle = {
  display: "grid",
  gap: "16px",
  padding: "20px",
  border: "1px solid #dbeafe",
  borderRadius: "18px",
  background: "#f8fbff",
};

const closingEditorStyle = {
  ...contentSectionCardStyle,
  borderColor: "#c4b5fd",
  background: "#faf5ff",
};

const contentSectionHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
};

const contentSectionNumberStyle = {
  display: "inline-flex",
  marginBottom: "6px",
  padding: "4px 9px",
  borderRadius: "999px",
  background: "#dbeafe",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: 900,
};

const closingBadgeStyle = {
  ...contentSectionNumberStyle,
  background: "#ede9fe",
  color: "#6d28d9",
};

const contentSectionTitleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "20px",
  lineHeight: 1.4,
};

const imageRangeBadgeStyle = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#ffffff",
  border: "1px solid #bfdbfe",
  color: "#1e40af",
  fontSize: "12px",
  fontWeight: 800,
};

const baseFactPreviewStyle = {
  padding: "14px 16px",
  borderRadius: "14px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
};

const detailQuestionStyle = {
  color: "#475569",
  fontSize: "14px",
  lineHeight: 1.6,
};

const richTextAreaStyle = {
  width: "100%",
  minHeight: "150px",
  boxSizing: "border-box",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: "16px",
  lineHeight: 1.75,
  resize: "vertical",
  whiteSpace: "pre-wrap",
};

const sectionCardFooterStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  color: "#64748b",
  fontSize: "13px",
};

const removeSectionButtonStyle = {
  padding: "8px 11px",
  borderRadius: "10px",
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#be123c",
  fontWeight: 850,
  cursor: "pointer",
};

const sectionCardHelpStyle = {
  margin: 0,
  color: "#64748b",
  lineHeight: 1.65,
};

const contentActionRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const nonBlockingGuideStyle = {
  margin: "16px 0 0",
  padding: "14px 16px",
  borderRadius: "14px",
  background: "#f8fafc",
  color: "#475569",
  lineHeight: 1.7,
};

const fieldLabelStyle = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const fieldLabelTextStyle = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  fontWeight: 850,
  color: "#1e293b",
};

const requiredMarkStyle = {
  display: "inline-block",
  padding: "2px 7px",
  borderRadius: "999px",
  background: "#fee2e2",
  color: "#b91c1c",
  fontSize: "11px",
  fontWeight: 900,
};

const optionalTextStyle = {
  display: "inline-block",
  padding: "2px 7px",
  borderRadius: "999px",
  background: "#f1f5f9",
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 900,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 14px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: "16px",
  lineHeight: 1.45,
};

const factTextAreaStyle = {
  ...inputStyle,
  minHeight: "92px",
  resize: "vertical",
  lineHeight: 1.65,
};

const compactTextAreaStyle = {
  ...inputStyle,
  minHeight: "82px",
  resize: "vertical",
};

const generatedContentStyle = {
  marginTop: "22px",
  padding: "20px",
  borderRadius: "18px",
  border: "1px solid #bfdbfe",
  background: "#eff6ff",
};

const generatedHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "14px",
};

const generatedDeviceStyle = {
  fontSize: "18px",
};

const autoBadgeStyle = {
  padding: "5px 10px",
  borderRadius: "999px",
  background: "#dbeafe",
  color: "#1e40af",
  fontSize: "12px",
  fontWeight: 900,
};

const generatedBodyStyle = {
  margin: "14px 0 0",
  color: "#334155",
  lineHeight: 1.8,
  whiteSpace: "pre-wrap",
};

const uploadBoxStyle = {
  display: "grid",
  gap: "7px",
  padding: "22px",
  borderRadius: "18px",
  border: "2px dashed #93c5fd",
  background: "#f8fbff",
  color: "#1e3a8a",
  cursor: "pointer",
};

const fileInputStyle = {
  marginTop: "8px",
  color: "#334155",
};

const uploadingTextStyle = {
  margin: "12px 0 0",
  color: "#1d4ed8",
  fontWeight: 850,
};

const emptyImageStyle = {
  marginTop: "18px",
  padding: "22px",
  borderRadius: "16px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#475569",
  lineHeight: 1.7,
};

const imageListStyle = {
  display: "grid",
  gap: "18px",
  marginTop: "20px",
};

const imageCardStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
  overflow: "hidden",
  borderRadius: "20px",
  border: "1px solid #dbeafe",
  background: "#ffffff",
  boxShadow: "0 8px 22px rgba(15, 23, 42, 0.06)",
};

const imagePreviewWrapStyle = {
  position: "relative",
  minHeight: "290px",
  background: "#f1f5f9",
};

const imagePreviewStyle = {
  width: "100%",
  height: "100%",
  minHeight: "290px",
  maxHeight: "430px",
  objectFit: "contain",
  display: "block",
};

const imageBadgeRowStyle = {
  position: "absolute",
  top: "12px",
  left: "12px",
  right: "12px",
  display: "flex",
  justifyContent: "space-between",
  gap: "8px",
};

const imageNumberBadgeStyle = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "rgba(15, 23, 42, 0.84)",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 900,
};

const mainBadgeStyle = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#16a34a",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 900,
};

const imageEditorStyle = {
  display: "grid",
  alignContent: "start",
  gap: "15px",
  padding: "22px",
  minWidth: 0,
};

const imageCardHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
};

const imageOrderTextStyle = {
  margin: "5px 0 0",
  color: "#64748b",
  fontSize: "13px",
};

const secondaryButtonStyle = {
  padding: "9px 12px",
  borderRadius: "999px",
  border: "1px solid #93c5fd",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontWeight: 850,
  cursor: "pointer",
};

const imageDescriptionStyle = {
  ...factTextAreaStyle,
  minHeight: "96px",
};

const autoAltBoxStyle = {
  padding: "13px 14px",
  borderRadius: "13px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: "13px",
  overflowWrap: "anywhere",
};

const imageAdvancedStyle = {
  borderTop: "1px solid #e2e8f0",
  paddingTop: "12px",
};

const detailsSummaryStyle = {
  cursor: "pointer",
  color: "#475569",
  fontWeight: 850,
};

const detailsBodyStyle = {
  display: "grid",
  gap: "14px",
  paddingTop: "14px",
};

const textButtonStyle = {
  justifySelf: "start",
  padding: 0,
  border: "none",
  background: "transparent",
  color: "#1d4ed8",
  textDecoration: "underline",
  fontWeight: 800,
  cursor: "pointer",
};

const removeButtonStyle = {
  justifySelf: "start",
  padding: "9px 12px",
  borderRadius: "10px",
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#be123c",
  fontWeight: 850,
  cursor: "pointer",
};

const sectionPreviewStyle = {
  marginTop: "20px",
  padding: "18px",
  borderRadius: "16px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const helperTextStyle = {
  margin: "8px 0 0",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.65,
};

const reviewGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
  gap: "18px",
  marginTop: "22px",
};

const checklistStyle = {
  display: "grid",
  gap: "10px",
};

const checklistItemStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "11px",
  padding: "14px",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const checkIconStyle = {
  width: "28px",
  height: "28px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  fontWeight: 900,
  flexShrink: 0,
};

const checkDetailStyle = {
  margin: "4px 0 0",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.55,
};

const validationBoxStyle = {
  padding: "18px",
  borderRadius: "16px",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  color: "#1e3a8a",
};

const validationListStyle = {
  margin: "12px 0 0 18px",
  padding: 0,
  color: "#b91c1c",
  lineHeight: 1.7,
};

const warningListStyle = {
  margin: "12px 0 0 18px",
  padding: 0,
  color: "#92400e",
  lineHeight: 1.7,
};

const validationSuccessTextStyle = {
  margin: "10px 0 0",
  color: "#475569",
  lineHeight: 1.65,
};

const searchPreviewStyle = {
  marginTop: "22px",
  padding: "20px",
  borderRadius: "18px",
  background: "#ffffff",
  border: "1px solid #dbeafe",
};

const searchResultCardStyle = {
  marginTop: "16px",
  padding: "18px",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const searchSiteStyle = {
  margin: 0,
  color: "#334155",
  fontSize: "14px",
  fontWeight: 800,
};

const searchUrlStyle = {
  margin: "4px 0 0",
  color: "#15803d",
  fontSize: "13px",
  overflowWrap: "anywhere",
};

const searchTitleStyle = {
  margin: "9px 0 0",
  color: "#1d4ed8",
  fontSize: "20px",
  lineHeight: 1.4,
  fontWeight: 800,
};

const searchDescriptionStyle = {
  margin: "7px 0 0",
  color: "#475569",
  lineHeight: 1.65,
};

const advancedSettingsStyle = {
  borderRadius: "20px",
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  overflow: "hidden",
};

const advancedSummaryStyle = {
  padding: "18px 22px",
  cursor: "pointer",
  fontWeight: 900,
  color: "#334155",
};

const advancedBodyStyle = {
  padding: "0 22px 24px",
};

const advancedIntroStyle = {
  margin: "0 0 18px",
  color: "#64748b",
  lineHeight: 1.7,
};

const advancedGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
  gap: "18px",
};

const submitButtonStyle = {
  width: "100%",
  padding: "17px 20px",
  border: "none",
  borderRadius: "999px",
  background: "#1d4ed8",
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: 900,
  cursor: "pointer",
};

const messageStyle = {
  margin: 0,
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid",
  background: "#ffffff",
  color: "#334155",
  fontWeight: 800,
};

const registeredBoxStyle = {
  padding: "24px",
  borderRadius: "22px",
  background: "#ecfdf5",
  border: "1px solid #bbf7d0",
  color: "#064e3b",
};

const registeredTitleStyle = {
  margin: 0,
  fontSize: "25px",
};

const registeredUrlStyle = {
  margin: "14px 0 0",
  padding: "13px",
  borderRadius: "12px",
  background: "#ffffff",
  border: "1px solid #bbf7d0",
  overflowWrap: "anywhere",
  fontWeight: 800,
};

const actionRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "9px",
  marginTop: "14px",
};

const baseActionStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "11px 14px",
  borderRadius: "999px",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: "14px",
};

const primaryLinkStyle = {
  ...baseActionStyle,
  background: "#16a34a",
};

const darkButtonStyle = {
  ...baseActionStyle,
  background: "#111827",
  border: "none",
  cursor: "pointer",
};

const submissionGuideStyle = {
  marginTop: "18px",
  padding: "16px",
  borderRadius: "14px",
  background: "#ffffff",
  border: "1px solid #d1fae5",
};

const naverLinkStyle = {
  ...baseActionStyle,
  background: "#03c75a",
};

const googleLinkStyle = {
  ...baseActionStyle,
  background: "#2563eb",
};

const neutralLinkStyle = {
  ...baseActionStyle,
  background: "#475569",
};
