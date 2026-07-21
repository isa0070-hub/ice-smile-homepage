import { supabase } from "@/lib/supabase";
import PhoneContactButton from "@/components/PhoneContactButton";
import { notFound } from "next/navigation";

const BASE_URL = "https://www.ismileagain.co.kr";

const BRANCH_INFO = {
  강변점: {
    phone: "02-3424-5295",
    address: "서울 광진구 광나루로56길 85 강변테크노마트 5층 B-20호",
    locality: "광진구",
    postalCode: "05116",
  },
  선릉점: {
    phone: "02-554-5295",
    address: "서울 강남구 테헤란로 406 샹제리제센터 A동 406호",
    locality: "강남구",
    postalCode: "06192",
  },
  신도림점: {
    phone: "02-2111-8899",
    address: "서울 구로구 새말로 97 신도림테크노마트 9층 57-1번 기둥",
    locality: "구로구",
    postalCode: "08288",
  },
};

function getBranchInfo(branch) {
  return BRANCH_INFO[branch] || BRANCH_INFO["강변점"];
}

function toAbsoluteUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeContentSections(value) {
  let sections = value;

  // jsonb 배열, JSON 문자열, 이중 인코딩 문자열을 모두 안전하게 처리합니다.
  for (let parseCount = 0; parseCount < 3; parseCount += 1) {
    if (typeof sections !== "string") break;

    try {
      sections = JSON.parse(sections);
    } catch {
      return [];
    }
  }

  // 이전 저장 형식이 객체로 감싸진 경우도 복원합니다.
  if (!Array.isArray(sections) && sections && typeof sections === "object") {
    if (Array.isArray(sections.sections)) {
      sections = sections.sections;
    } else if (Array.isArray(sections.content_sections)) {
      sections = sections.content_sections;
    } else {
      const objectValues = Object.values(sections);
      sections = objectValues.every(
        (section) => section && typeof section === "object",
      )
        ? objectValues
        : [];
    }
  }

  if (!Array.isArray(sections)) {
    return [];
  }

  let processIndex = 0;

  return sections
    .map((section) => {
      const isClosing =
        section?.type === "closing" ||
        section?.kind === "closing" ||
        section?.section_type === "closing" ||
        (section?.image_start == null &&
          section?.image_end == null &&
          cleanText(section?.title).includes("마무리"));
      const imageStart = Number(section?.image_start);
      const imageEnd = Number(section?.image_end);
      const currentProcessIndex = processIndex;

      if (!isClosing) {
        processIndex += 1;
      }

      return {
        type: isClosing ? "closing" : "process",
        title: cleanText(section?.title),
        content: String(section?.content || "").trim(),
        image_start: isClosing
          ? null
          : Number.isFinite(imageStart) && imageStart > 0
            ? Math.floor(imageStart)
            : currentProcessIndex * 3 + 1,
        image_end: isClosing
          ? null
          : Number.isFinite(imageEnd) && imageEnd > 0
            ? Math.floor(imageEnd)
            : currentProcessIndex * 3 + 3,
      };
    })
    .filter((section) => section.title || section.content);
}

function getSectionImages(section, detailImages = [], sectionIndex = 0) {
  const fallbackStart = sectionIndex * 3;
  const requestedStart = Number(section?.image_start) - 1;
  const requestedEnd = Number(section?.image_end);

  const startIndex = Number.isFinite(requestedStart)
    ? Math.max(0, Math.floor(requestedStart))
    : fallbackStart;
  const endIndex = Number.isFinite(requestedEnd)
    ? Math.max(startIndex, Math.floor(requestedEnd))
    : startIndex + 3;

  return detailImages.slice(startIndex, endIndex).map((image, offset) => ({
    image,
    absoluteIndex: startIndex + offset,
  }));
}

function getStructuredImageGridStyle(imageCount = 0) {
  let columnCount = Math.max(1, Math.min(imageCount, 3));

  // 이전 4장 묶음 글도 마지막 한 장이 홀로 밀리지 않도록 2열로 균형 배치
  if (imageCount === 4) {
    columnCount = 2;
  }

  return {
    ...structuredImageGridStyle,
    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
  };
}

function limitText(value, maxLength) {
  const text = cleanText(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

function escapeRegExp(value) {
  return cleanText(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeTextParts(text, parts = []) {
  let result = cleanText(text);

  parts
    .map(cleanText)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .forEach((part) => {
      result = result.replace(new RegExp(escapeRegExp(part), "gi"), " ");
    });

  return cleanText(result.replace(/[|｜·ㆍ,/]+/g, " ").replace(/\s+/g, " "));
}

function getBranchSearchLabel(branch) {
  if (branch === "강변점") return "강변";
  if (branch === "선릉점") return "선릉";
  if (branch === "신도림점") return "신도림";

  return cleanText(branch || "서울");
}

function getBranchIntro(branch) {
  if (branch === "강변점") {
    return "강변역 1번 출구 인근 아이스마일어게인 강변점";
  }

  if (branch === "선릉점") {
    return "선릉역 1번 출구 인근 아이스마일어게인 선릉점";
  }

  if (branch === "신도림점") {
    return "신도림테크노마트 9층 아이스마일어게인 신도림점";
  }

  return "아이스마일어게인";
}

function getBranchVisitGuide(branch) {
  if (branch === "강변점") {
    return "강변역 인근 강변테크노마트 5층 B-20호 아이스마일어게인 강변점으로 방문하시면 됩니다.";
  }

  if (branch === "선릉점") {
    return "선릉역 1번 출구 인근 샹제리제센터 A동 406호 아이스마일어게인 선릉점으로 방문하시면 됩니다.";
  }

  if (branch === "신도림점") {
    return "신도림테크노마트 9층 57-1번 기둥 아이스마일어게인 신도림점으로 방문하시면 됩니다.";
  }

  return "방문 전 상담 후 가까운 아이스마일어게인 지점으로 안내드립니다.";
}

function makeConsultTitle(item) {
  const deviceModel = makeDeviceModelText(item);
  const keyword = makeMetaKeyword(item);

  return `${deviceModel} ${keyword} 방문 전 상담 안내`;
}
function makeDeviceModelText(item) {
  const device = cleanText(item?.device);
  const model = cleanText(item?.model);

  if (!device && !model) return "기기";
  if (!device) return model;
  if (!model) return device;

  const normalizedDevice = device.replace(/\s+/g, "");
  const normalizedModel = model.replace(/\s+/g, "");

  if (normalizedModel.includes(normalizedDevice)) {
    return model;
  }

  return cleanText(`${device} ${model}`);
}

function normalizeComparable(value = "") {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "");
}

function dedupeAdjacentTerms(value = "") {
  let text = cleanText(value);

  // 띄어쓰기 형태가 다른 연속 중복까지 정리하기 위해 최대 4회 반복
  for (let pass = 0; pass < 4; pass += 1) {
    const tokens = text.split(/\s+/).filter(Boolean);
    const result = [];

    for (const token of tokens) {
      const current = normalizeComparable(token);
      const previousToken = result[result.length - 1] || "";
      const previous = normalizeComparable(previousToken);

      if (!current) {
        result.push(token);
        continue;
      }

      if (!previous) {
        result.push(token);
        continue;
      }

      if (current === previous) {
        continue;
      }

      if (current.includes(previous)) {
        result[result.length - 1] = token;
        continue;
      }

      if (previous.includes(current)) {
        continue;
      }

      result.push(token);
    }

    const nextText = cleanText(result.join(" "));

    if (nextText === text) {
      return nextText;
    }

    text = nextText;
  }

  return text;
}

function makeDisplayTitle(item) {
  let title = cleanText(item?.title);
  const device = cleanText(item?.device);
  const model = cleanText(item?.model);

  // 모델명에 기기명이 포함됐는데 제목에 둘이 연속되면 한 번만 표시
  // 예: 아이패드 아이패드9세대 → 아이패드9세대
  if (
    title &&
    device &&
    model &&
    normalizeComparable(model).includes(normalizeComparable(device))
  ) {
    title = title.replace(
      new RegExp(`${escapeRegExp(device)}\\s*${escapeRegExp(model)}`, "gi"),
      model,
    );
  }

  title = dedupeAdjacentTerms(title);

  if (title) {
    return title;
  }

  return cleanText(
    `${makeDeviceModelText(item)} ${makeMetaKeyword(item)} 수리사례`,
  );
}
function makeSafeAltText(value, fallback) {
  const source = cleanText(value) || cleanText(fallback);

  return dedupeAdjacentTerms(source);
}

function findRepairAction(item) {
  const source = normalizeComparable(
    `${item?.title || ""} ${item?.seo_keyword || ""} ${item?.symptom || ""}`,
  );

  const actions = [
    "후면유리교체",
    "카메라렌즈교체",
    "메인보드수리",
    "전원불량수리",
    "디스플레이교체",
    "디스플레이수리",
    "액정교체",
    "액정수리",
    "배터리교체",
    "충전단자교체",
    "키보드교체",
    "화면줄수리",
    "유리교체",
    "카메라교체",
    "보드수리",
    "침수수리",
  ];

  return (
    actions.find((action) => source.includes(normalizeComparable(action))) || ""
  );
}

function makeMetaKeyword(item) {
  const branchLabel = getBranchSearchLabel(item?.branch);
  const device = cleanText(item?.device);
  const model = cleanText(item?.model);
  const rawSymptom = cleanText(item?.symptom);
  const action = findRepairAction(item);

  // 증상에 기기명이나 모델명이 들어간 경우 제거
  const symptom = removeTextParts(rawSymptom, [device, model]);

  const cleanedSeoKeyword = removeTextParts(item?.seo_keyword, [
    item?.branch,
    branchLabel,
    "강변점",
    "강변역",
    "강변",
    "선릉점",
    "선릉역",
    "선릉",
    "신도림점",
    "신도림역",
    "신도림",
    device,
    model,
    "아이스마일어게인",
    "수리사례",
    "관련",
  ]);

  const keywordParts = [];

  if (symptom) {
    keywordParts.push(symptom);
  }

  const normalizedSymptom = normalizeComparable(symptom);
  const normalizedAction = normalizeComparable(action);

  if (action && !normalizedSymptom.includes(normalizedAction)) {
    keywordParts.push(action);
  }

  const combinedKeyword = dedupeAdjacentTerms(keywordParts.join(" "));

  if (combinedKeyword) {
    return combinedKeyword;
  }

  const fallbackKeyword = dedupeAdjacentTerms(cleanedSeoKeyword);

  if (fallbackKeyword) {
    return fallbackKeyword;
  }

  if (item?.category) {
    return dedupeAdjacentTerms(`${item.category} 수리`);
  }

  return "기기 수리";
}

function makeDescription(item) {
  if (!item) {
    return "아이스마일어게인 수리사례 상세페이지입니다. 아이폰, 아이패드, 맥북, 서피스, 레노버 수리 사례를 확인해보세요.";
  }

  const branchIntro = getBranchIntro(item.branch);
  const deviceModel = makeDeviceModelText(item);
  const keyword = makeMetaKeyword(item);
  const symptom = removeTextParts(item.symptom, [item.device, item.model]);

  const symptomText =
    symptom &&
    !normalizeComparable(keyword).includes(normalizeComparable(symptom))
      ? `${symptom} 증상 점검 후 `
      : "";

  const description = `${branchIntro}에서 진행한 ${deviceModel} ${keyword} 사례입니다. ${symptomText}방문 전 수리 가능 여부, 예상 비용, 소요 시간, 방문 및 택배 접수 방법을 안내해드립니다.`;

  return limitText(description, 155);
}

function makeTitle(item) {
  if (!item) {
    return "수리사례 | 아이스마일어게인 수리전문 공식서비스센터";
  }

  const branchLabel = getBranchSearchLabel(item.branch);
  const deviceModel = makeDeviceModelText(item);
  const keyword = makeMetaKeyword(item);

  const title = dedupeAdjacentTerms(
    `${branchLabel} ${deviceModel} ${keyword} 수리사례 | 아이스마일어게인 ${item.branch || ""}`,
  );

  return limitText(title, 65);
}

function makeCanonicalUrl(item) {
  return item
    ? `${BASE_URL}/repair-cases/${item.slug}`
    : `${BASE_URL}/repair-cases`;
}
function makeFaqItems(item, phoneNumber) {
  const deviceModel = makeDeviceModelText(item);
  const branch = item?.branch || "아이스마일어게인";
  const keyword = makeMetaKeyword(item);
  const visitGuide = getBranchVisitGuide(item?.branch);

  return [
    {
      question: `${deviceModel} ${keyword} 가능 여부는 어떻게 확인하나요?`,
      answer: `${branch} 방문 전 ${phoneNumber} 또는 네이버톡톡으로 모델명과 증상 사진을 보내주시면 ${keyword} 가능 여부와 예상 비용, 소요 시간을 확인해드립니다.`,
    },
    {
      question: `${deviceModel} 수리 시간과 데이터 유지 여부는 어떻게 확인하나요?`,
      answer:
        "수리 시간은 부품 재고와 내부 손상 정도에 따라 달라집니다. 액정, 배터리, 카메라 등 일반 부품 교체는 대부분 데이터 삭제 없이 진행되지만, 침수나 메인보드 손상은 점검 결과에 따라 안내드립니다.",
    },
    {
      question: `${branch} 방문과 택배 접수는 어떻게 진행하나요?`,
      answer: `${visitGuide} 방문이 어려운 경우 고객님이 선불로 발송해주시면 도착 후 점검하고, 수리 완료 후 매장에서 다시 발송해드립니다.`,
    },
  ];
}

function makeJsonLd({ item, detailImages = [], phoneNumber }) {
  if (!item) return null;

  const canonicalUrl = makeCanonicalUrl(item);
  const description = makeDescription(item);
  const branchInfo = getBranchInfo(item.branch);
  const displayTitle = makeDisplayTitle(item);
  const deviceModel = makeDeviceModelText(item);
  const displayKeyword = makeMetaKeyword(item);

  const imageUrls = [
    item.image_url,
    ...(detailImages || []).map((image) => image.image_url),
  ]
    .filter(Boolean)
    .map(toAbsoluteUrl);
  const faqItems = makeFaqItems(item, phoneNumber);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "홈",
            item: BASE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "수리사례",
            item: `${BASE_URL}/repair-cases`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: displayTitle,
            item: canonicalUrl,
          },
        ],
      },
      {
        "@type": "Article",
        "@id": `${canonicalUrl}#article`,
        headline: displayTitle,
        description,
        image: imageUrls.length > 0 ? imageUrls : undefined,
        datePublished: item.created_at,
        dateModified: item.updated_at || item.created_at,
        mainEntityOfPage: canonicalUrl,
        author: {
          "@type": "Organization",
          name: "아이스마일어게인",
          url: BASE_URL,
        },
        publisher: {
          "@type": "Organization",
          name: "아이스마일어게인",
          url: BASE_URL,
        },
        about: cleanText(`${deviceModel} ${displayKeyword}`),
      },
      {
        "@type": "Service",
        "@id": `${canonicalUrl}#service`,
        name: cleanText(`${deviceModel} ${displayKeyword}`),
        serviceType: displayKeyword,
        areaServed: {
          "@type": "Country",
          name: "대한민국",
        },
        provider: {
          "@type": "LocalBusiness",
          name: `아이스마일어게인 ${item.branch || ""}`.trim(),
          url: BASE_URL,
          telephone: phoneNumber,
          priceRange: "₩₩",
          image:
            imageUrls.length > 0 ? imageUrls[0] : `${BASE_URL}/favicon.ico`,
          address: {
            "@type": "PostalAddress",
            streetAddress: branchInfo.address,
            addressLocality: branchInfo.locality,
            addressRegion: "서울",
            postalCode: branchInfo.postalCode,
            addressCountry: "KR",
          },
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        mainEntity: faqItems.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };
}

function getRelatedBadge(item, related) {
  if (item?.device && related?.device === item.device) {
    return "같은 기기";
  }

  if (item?.branch && related?.branch === item.branch) {
    return "같은 지점";
  }

  if (item?.category && related?.category === item.category) {
    return "같은 분류";
  }

  return "추천 사례";
}

async function getRelatedCases(item) {
  if (!item) return [];

  const relatedMap = new Map();

  async function addRelated(query) {
    const { data } = await query;

    (data || []).forEach((related) => {
      if (
        related?.id &&
        related.id !== item.id &&
        !relatedMap.has(related.id)
      ) {
        relatedMap.set(related.id, related);
      }
    });
  }

  if (item.device) {
    await addRelated(
      supabase
        .from("repair_cases")
        .select("*")
        .eq("device", item.device)
        .neq("id", item.id)
        .order("created_at", { ascending: false })
        .limit(4),
    );
  }

  if (item.category) {
    await addRelated(
      supabase
        .from("repair_cases")
        .select("*")
        .eq("category", item.category)
        .neq("id", item.id)
        .order("created_at", { ascending: false })
        .limit(4),
    );
  }

  if (item.branch) {
    await addRelated(
      supabase
        .from("repair_cases")
        .select("*")
        .eq("branch", item.branch)
        .neq("id", item.id)
        .order("created_at", { ascending: false })
        .limit(4),
    );
  }

  return Array.from(relatedMap.values()).slice(0, 6);
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.slug);

  const { data: item } = await supabase
    .from("repair_cases")
    .select("*")
    .eq("slug", slug)
    .single();

  const title = makeTitle(item);
  const description = makeDescription(item);
  const canonicalUrl = makeCanonicalUrl(item);
  const imageUrl = toAbsoluteUrl(item?.image_url);
  const displayTitle = item
    ? makeDisplayTitle(item)
    : "아이스마일어게인 수리사례";

  const socialImageAlt = makeSafeAltText(item?.alt_text, displayTitle);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "아이스마일어게인",
      locale: "ko_KR",
      type: "article",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: socialImageAlt,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function RepairCaseDetailPage({ params }) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.slug);

  const { data: item } = await supabase
    .from("repair_cases")
    .select("*")
    .eq("slug", slug)
    .single();

  let phoneNumber = "02-3424-5295";

  if (item?.branch === "선릉점") {
    phoneNumber = "02-554-5295";
  }

  if (item?.branch === "신도림점") {
    phoneNumber = "02-2111-8899";
  }

  if (!item) {
    notFound();
  }

  const nextViews = (item.views || 0) + 1;

  await supabase
    .from("repair_cases")
    .update({ views: nextViews })
    .eq("id", item.id);

  item.views = nextViews;

  const { data: detailImages } = await supabase
    .from("repair_case_images")
    .select("*")
    .eq("repair_case_id", item.id)
    .order("sort_order", { ascending: true });

  const relatedCases = await getRelatedCases(item);
  const branchInfo = getBranchInfo(item.branch);
  const branchVisitGuide = getBranchVisitGuide(item.branch);
  const consultTitle = makeConsultTitle(item);

  const jsonLd = makeJsonLd({
    item,
    detailImages: detailImages || [],
    phoneNumber,
  });
  const faqItems = makeFaqItems(item, phoneNumber);
  const displayTitle = makeDisplayTitle(item);
  const deviceModel = makeDeviceModelText(item);
  const displayKeyword = makeMetaKeyword(item);
  const normalizedSections = normalizeContentSections(item.content_sections);
  const processSections = normalizedSections.filter(
    (section) => section.type === "process",
  );
  const closingSection = normalizedSections.find(
    (section) => section.type === "closing",
  );
  const hasStructuredContent =
    processSections.length > 0 || Boolean(closingSection?.content);

  return (
    <main style={{ maxWidth: "1280px", margin: "80px auto", padding: "24px" }}>
      <style>{`
        @media (max-width: 1100px) {
          .repair-structured-image-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .repair-related-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 720px) {
          .repair-structured-image-grid {
            grid-template-columns: 1fr !important;
          }

          .repair-structured-image {
            height: 320px !important;
          }

          .repair-related-grid {
            grid-template-columns: 1fr !important;
          }

          .repair-related-image {
            height: 220px !important;
          }
        }
      `}</style>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}

      <nav aria-label="breadcrumb" style={breadcrumbStyle}>
        <a href="/" style={breadcrumbLinkStyle}>
          홈
        </a>
        <span style={breadcrumbSeparatorStyle}>›</span>
        <a href="/repair-cases" style={breadcrumbLinkStyle}>
          수리사례
        </a>
        <span style={breadcrumbSeparatorStyle}>›</span>
        <span style={breadcrumbCurrentStyle}>{displayTitle}</span>
      </nav>

      <p style={{ color: "#1e3a8a", fontWeight: "800" }}>
        {item.branch} · {item.category}
      </p>

      <h1 style={{ fontSize: "42px", lineHeight: 1.3, marginBottom: "20px" }}>
        {displayTitle}
      </h1>

      <p style={{ fontSize: "18px", color: "#475569", marginBottom: "12px" }}>
        대표 키워드 : {displayKeyword}
      </p>

      <p style={{ color: "#64748b", fontWeight: "700", marginBottom: "30px" }}>
        조회수 : {item.views || 0}
      </p>

      {item.image_url && (
        <img
          src={item.image_url}
          alt={makeSafeAltText(item.alt_text, displayTitle)}
          style={mainImageStyle}
        />
      )}

      <section style={infoBoxStyle} aria-label="수리사례 핵심 요약">
        <p style={summaryLabelTopStyle}>수리사례 핵심 요약</p>

        <h2 style={summaryTitleStyle}>
          {item.branch} {deviceModel} 수리 정보
        </h2>

        <p style={summaryIntroStyle}>
          {displayTitle} 사례의 기기, 증상, 수리 지점과 상담 연락처를 방문 전에
          빠르게 확인할 수 있도록 정리했습니다.
        </p>

        <div style={summaryGridStyle}>
          <div style={summaryItemStyle}>
            <span style={summaryLabelStyle}>수리 지점</span>
            <strong style={summaryValueStyle}>{item.branch}</strong>
          </div>

          <div style={summaryItemStyle}>
            <span style={summaryLabelStyle}>지점 주소</span>
            <strong style={summaryValueStyle}>{branchInfo.address}</strong>
          </div>

          <div style={summaryItemStyle}>
            <span style={summaryLabelStyle}>기기</span>
            <strong style={summaryValueStyle}>
              {item.device || "수리 기기"}
            </strong>
          </div>

          <div style={summaryItemStyle}>
            <span style={summaryLabelStyle}>모델명</span>
            <strong style={summaryValueStyle}>
              {item.model || "모델 확인 필요"}
            </strong>
          </div>

          <div style={summaryItemStyle}>
            <span style={summaryLabelStyle}>고장 증상</span>
            <strong style={summaryValueStyle}>
              {item.symptom || "증상 점검 필요"}
            </strong>
          </div>

          <div style={summaryItemStyle}>
            <span style={summaryLabelStyle}>수리 키워드</span>
            <strong style={summaryValueStyle}>
              {displayKeyword || "기기 수리"}
            </strong>
          </div>

          <div style={summaryItemStyle}>
            <span style={summaryLabelStyle}>상담 전화</span>
            <a href={`tel:${phoneNumber}`} style={phoneLinkStyle}>
              {phoneNumber}
            </a>
          </div>

          <div style={summaryItemStyle}>
            <span style={summaryLabelStyle}>상담 방법</span>
            <strong style={summaryValueStyle}>
              전화 · 네이버톡톡 · 온라인 문의
            </strong>
          </div>
        </div>

        <div style={summaryActionBoxStyle}>
          <a
            href="https://talk.naver.com/WCH5S2X"
            target="_blank"
            rel="noreferrer"
            style={summaryTalkButtonStyle}
          >
            네이버톡톡 문의
          </a>

          <a href={`tel:${phoneNumber}`} style={summaryPhoneButtonStyle}>
            전화 상담
          </a>
        </div>
      </section>

      {item.repair_content && (
        <section style={contentStyle}>{item.repair_content}</section>
      )}

      {!hasStructuredContent && item.blog_url && (
        <section style={blogBoxStyle}>
          <p style={blogLabelStyle}>관련 네이버 블로그 후기</p>

          <a
            href={item.blog_url}
            target="_blank"
            rel="noreferrer"
            style={blogTitleLinkStyle}
          >
            {item.blog_title || "네이버 블로그에서 자세히 보기"}
          </a>

          <p style={blogDomainStyle}>blog.naver.com</p>
        </section>
      )}

      {hasStructuredContent ? (
        <section style={structuredProcessWrapStyle} aria-label="수리 과정">
          {processSections.map((section, sectionIndex) => {
            const sectionImages = getSectionImages(
              section,
              detailImages || [],
              sectionIndex,
            );

            return (
              <section
                key={`${section.image_start}-${section.image_end}-${sectionIndex}`}
                style={structuredProcessSectionStyle}
              >
                {section.title && (
                  <h2 style={structuredProcessTitleStyle}>{section.title}</h2>
                )}

                {section.content && (
                  <p style={structuredProcessTextStyle}>{section.content}</p>
                )}

                {sectionImages.length > 0 && (
                  <div
                    className="repair-structured-image-grid"
                    style={getStructuredImageGridStyle(sectionImages.length)}
                  >
                    {sectionImages.map(({ image, absoluteIndex }) => (
                      <figure
                        key={image.id || `${sectionIndex}-${absoluteIndex}`}
                        style={structuredFigureStyle}
                      >
                        {image.image_url && (
                          <img
                            className="repair-structured-image"
                            src={image.image_url}
                            alt={makeSafeAltText(
                              image.alt_text || image.description,
                              `${displayTitle} 수리 과정 이미지 ${absoluteIndex + 1}`,
                            )}
                            loading="lazy"
                            style={structuredImageStyle}
                          />
                        )}

                        {image.description && (
                          <figcaption style={structuredCaptionStyle}>
                            {image.description}
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </section>
      ) : (
        detailImages &&
        detailImages.length > 0 && (
          <section style={detailImageSectionStyle}>
            <h3 style={{ fontSize: "30px", marginBottom: "24px" }}>
              수리 과정 상세 이미지
            </h3>

            {detailImages.map((image, index) => (
              <div key={image.id} style={detailImageCardStyle}>
                {image.image_url && (
                  <img
                    src={image.image_url}
                    alt={makeSafeAltText(
                      image.alt_text || image.description,
                      `${displayTitle} 상세 이미지 ${index + 1}`,
                    )}
                    loading="lazy"
                    style={detailImageStyle}
                  />
                )}

                <div style={detailTextBoxStyle}>
                  <p style={detailImageNumberStyle}>사진 {index + 1}</p>

                  <p style={detailDescriptionStyle}>
                    {image.description || "수리 과정 상세 이미지입니다."}
                  </p>
                </div>
              </div>
            ))}
          </section>
        )
      )}

      {closingSection?.content && (
        <section style={closingContentStyle} aria-label="마무리 및 지점안내">
          {closingSection.title && (
            <h2 style={closingContentTitleStyle}>{closingSection.title}</h2>
          )}

          <p style={closingContentTextStyle}>{closingSection.content}</p>
        </section>
      )}

      {hasStructuredContent && item.blog_url && (
        <section style={blogBoxStyle}>
          <p style={blogLabelStyle}>관련 네이버 블로그 후기</p>

          <a
            href={item.blog_url}
            target="_blank"
            rel="noreferrer"
            style={blogTitleLinkStyle}
          >
            {item.blog_title || "네이버 블로그에서 자세히 보기"}
          </a>

          <p style={blogDomainStyle}>blog.naver.com</p>
        </section>
      )}

      {relatedCases && relatedCases.length > 0 && (
        <section style={relatedBoxStyle}>
          <h3 style={{ fontSize: "28px", marginBottom: "12px" }}>
            함께 보면 좋은 수리사례
          </h3>

          <p style={relatedIntroStyle}>
            같은 기기, 같은 분류, 같은 지점의 수리사례를 함께 확인해보세요. 내부
            연결이 자연스럽게 이어져 검색엔진이 수리사례 구조를 이해하는 데도
            도움이 됩니다.
          </p>

          <div className="repair-related-grid" style={relatedGridStyle}>
            {relatedCases.map((related) => (
              <a
                key={related.id}
                href={`/repair-cases/${related.slug}`}
                style={relatedCardStyle}
              >
                {related.image_url ? (
                  <img
                    className="repair-related-image"
                    src={related.image_url}
                    alt={makeSafeAltText(
                      related.alt_text,
                      makeDisplayTitle(related),
                    )}
                    style={relatedImageStyle}
                  />
                ) : (
                  <div
                    className="repair-related-image"
                    style={relatedNoImageStyle}
                  >
                    이미지 없음
                  </div>
                )}

                <p style={relatedBadgeStyle}>
                  {getRelatedBadge(item, related)}
                </p>

                <p style={{ color: "#1e3a8a", fontWeight: "800" }}>
                  {related.branch} · {related.category}
                </p>

                <h4 style={{ fontSize: "18px", lineHeight: 1.5 }}>
                  {makeDisplayTitle(related)}
                </h4>

                <p style={relatedMetaStyle}>
                  {makeDeviceModelText(related)} · {makeMetaKeyword(related)}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}
      <section style={faqBoxStyle} id="repair-case-faq">
        <p style={faqLabelStyle}>자주 묻는 질문</p>

        <h3 style={faqTitleStyle}>{deviceModel} 수리 전 확인할 내용</h3>

        <div style={faqListStyle}>
          {faqItems.map((faq, index) => (
            <div key={index} style={faqItemStyle}>
              <h4 style={faqQuestionStyle}>Q. {faq.question}</h4>
              <p style={faqAnswerStyle}>A. {faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={conversionBoxStyle} aria-label="방문 전 수리 상담 안내">
        <p style={conversionBadgeStyle}>방문 전 상담 안내</p>

        <h3 style={conversionTitleStyle}>{consultTitle}</h3>

        <p style={conversionLeadStyle}>
          수리사례를 확인하신 뒤 방문 전 문의를 남겨주시면 기기 모델명, 고장
          증상, 부품 재고, 예상 수리 시간과 비용을 더 빠르게 안내해드립니다.
          {` ${branchVisitGuide}`}
        </p>

        <div style={conversionGridStyle}>
          <div style={conversionCardStyle}>
            <h4 style={conversionCardTitleStyle}>1. 방문 전 준비</h4>
            <p style={conversionCardTextStyle}>
              기기 모델명, 고장 증상, 파손 사진, 침수 여부를 알려주시면 상담이
              빨라집니다. 모델명을 모르는 경우 기기 사진만 보내주셔도 확인을
              도와드립니다.
            </p>
          </div>

          <div style={conversionCardStyle}>
            <h4 style={conversionCardTitleStyle}>2. 수리 가능 여부 확인</h4>
            <p style={conversionCardTextStyle}>
              액정 파손, 배터리 성능저하, 충전불량, 전원불량, 침수, 메인보드
              고장은 기기 상태에 따라 수리 가능 여부와 비용이 달라질 수
              있습니다.
            </p>
          </div>

          <div style={conversionCardStyle}>
            <h4 style={conversionCardTitleStyle}>3. 택배 접수 가능</h4>
            <p style={conversionCardTextStyle}>
              방문이 어려운 경우 택배 접수도 가능합니다. 고객님 선불 발송 후
              매장 도착 기준으로 점검하고, 수리 완료 후 다시 발송해드립니다.
            </p>
          </div>

          <div style={conversionCardStyle}>
            <h4 style={conversionCardTitleStyle}>4. 수리 후 확인</h4>
            <p style={conversionCardTextStyle}>
              수리 후 화면, 충전, 터치, 카메라, 배터리, 전원 반응 등 기본 기능을
              확인하고 고객님께 안내드립니다.
            </p>
          </div>
        </div>

        <div style={conversionButtonWrapStyle}>
          <a
            href="https://talk.naver.com/WCH5S2X"
            target="_blank"
            rel="noreferrer"
            style={talkContactButtonStyle}
          >
            💬 네이버톡톡 문의
          </a>

          <PhoneContactButton buttonStyle={phoneContactButtonStyle} />

          <a href="/contact" style={onlineContactButtonStyle}>
            📝 온라인 수리문의
          </a>
        </div>

        <p style={conversionNoticeStyle}>
          ※ 정확한 비용과 수리 시간은 기기 상태, 부품 재고, 침수 여부, 내부 손상
          정도를 확인한 뒤 안내됩니다.
        </p>
      </section>

      <div style={{ marginTop: "50px" }}>
        <a href="/repair-cases" style={backButtonStyle}>
          수리사례 목록으로
        </a>
      </div>

      <FloatingButtons phoneNumber={phoneNumber} />
    </main>
  );
}

function FloatingButtons({ phoneNumber }) {
  return (
    <div style={floatingMenuStyle}>
      <a
        href="https://talk.naver.com/WCH5S2X"
        target="_blank"
        style={floatingTalkButtonStyle}
      >
        <span style={floatingIconStyle}>💬</span>
        <span>톡톡</span>
      </a>

      {/*
<a href={`tel:${phoneNumber}`} style={floatingPhoneButtonStyle}>
  <span style={floatingIconStyle}>📞</span>
  <span>전화</span>
</a>
*/}
    </div>
  );
}

const breadcrumbStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  marginBottom: "24px",
  fontSize: "14px",
  color: "#64748b",
};

const breadcrumbLinkStyle = {
  color: "#1e3a8a",
  textDecoration: "none",
  fontWeight: "800",
};

const breadcrumbSeparatorStyle = {
  color: "#94a3b8",
  fontWeight: "900",
};

const breadcrumbCurrentStyle = {
  color: "#64748b",
  fontWeight: "700",
};

const mainImageStyle = {
  width: "100%",
  height: "auto",
  maxHeight: "none",
  objectFit: "contain",
  borderRadius: "18px",
  marginBottom: "34px",
  display: "block",
};

const infoBoxStyle = {
  background: "linear-gradient(135deg, #f8fafc, #eef6ff)",
  border: "1px solid #dbeafe",
  borderRadius: "24px",
  padding: "30px",
  lineHeight: 1.8,
  marginBottom: "34px",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
};

const summaryLabelTopStyle = {
  display: "inline-block",
  margin: "0 0 10px",
  padding: "6px 12px",
  borderRadius: "999px",
  background: "#dbeafe",
  color: "#1e3a8a",
  fontSize: "14px",
  fontWeight: "900",
};

const summaryTitleStyle = {
  fontSize: "28px",
  lineHeight: 1.4,
  margin: "0 0 10px",
  color: "#0f172a",
};

const summaryIntroStyle = {
  fontSize: "16px",
  lineHeight: 1.7,
  color: "#475569",
  margin: "0 0 22px",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const summaryItemStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "16px",
};

const summaryLabelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "800",
};

const summaryValueStyle = {
  display: "block",
  color: "#0f172a",
  fontSize: "16px",
  lineHeight: 1.6,
};

const summaryActionBoxStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "22px",
};

const summaryTalkButtonStyle = {
  display: "inline-block",
  padding: "13px 18px",
  background: "#03c75a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const summaryPhoneButtonStyle = {
  display: "inline-block",
  padding: "13px 18px",
  background: "#1e3a8a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const phoneLinkStyle = {
  color: "#1e3a8a",
  fontWeight: "900",
  textDecoration: "none",
};

const contentStyle = {
  fontSize: "18px",
  lineHeight: 1.9,
  whiteSpace: "pre-wrap",
  marginTop: "34px",
};

const structuredProcessWrapStyle = {
  marginTop: "52px",
};

const structuredProcessSectionStyle = {
  marginBottom: "58px",
  paddingBottom: "6px",
};

const structuredProcessTitleStyle = {
  margin: "0 0 14px",
  fontSize: "30px",
  lineHeight: 1.45,
  color: "#0f172a",
};

const structuredProcessTextStyle = {
  margin: "0 0 24px",
  fontSize: "18px",
  lineHeight: 1.9,
  color: "#334155",
  whiteSpace: "pre-wrap",
};

const structuredImageGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "22px",
  alignItems: "stretch",
};

const structuredFigureStyle = {
  margin: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderRadius: "18px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 22px rgba(15, 23, 42, 0.08)",
};

const structuredImageStyle = {
  width: "100%",
  height: "380px",
  objectFit: "contain",
  display: "block",
  background: "#f1f5f9",
};

const structuredCaptionStyle = {
  display: "block",
  padding: "16px 18px",
  background: "#f8fafc",
  color: "#475569",
  fontSize: "15px",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
};

const closingContentStyle = {
  marginTop: "10px",
  marginBottom: "54px",
  padding: "30px",
  borderRadius: "20px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const closingContentTitleStyle = {
  margin: "0 0 14px",
  fontSize: "28px",
  lineHeight: 1.45,
  color: "#0f172a",
};

const closingContentTextStyle = {
  margin: 0,
  fontSize: "18px",
  lineHeight: 1.9,
  color: "#334155",
  whiteSpace: "pre-wrap",
};

const detailImageSectionStyle = {
  marginTop: "60px",
};

const detailImageCardStyle = {
  marginBottom: "34px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  overflow: "hidden",
  boxShadow: "0 8px 22px rgba(15, 23, 42, 0.08)",
};

const detailImageStyle = {
  width: "100%",
  height: "auto",
  maxHeight: "none",
  objectFit: "contain",
  display: "block",
};

const detailTextBoxStyle = {
  padding: "22px",
  background: "#f8fafc",
};

const detailImageNumberStyle = {
  color: "#1e3a8a",
  fontWeight: "900",
  marginBottom: "8px",
};

const detailDescriptionStyle = {
  fontSize: "17px",
  lineHeight: 1.8,
  color: "#334155",
  margin: 0,
  whiteSpace: "pre-wrap",
};

const relatedBoxStyle = {
  marginTop: "60px",
};

const relatedIntroStyle = {
  fontSize: "16px",
  color: "#64748b",
  lineHeight: 1.7,
  marginBottom: "22px",
};

const relatedGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "22px",
};

const relatedCardStyle = {
  display: "block",
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "16px",
  textDecoration: "none",
  color: "#111827",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
};

const relatedBadgeStyle = {
  display: "inline-block",
  margin: "0 0 10px",
  padding: "5px 10px",
  borderRadius: "999px",
  background: "#eff6ff",
  color: "#1e3a8a",
  fontWeight: "900",
  fontSize: "13px",
};

const relatedImageStyle = {
  width: "100%",
  height: "210px",
  objectFit: "contain",
  borderRadius: "14px",
  marginBottom: "12px",
  background: "#f8fafc",
};

const relatedNoImageStyle = {
  height: "210px",
  borderRadius: "14px",
  background: "#f1f5f9",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  marginBottom: "12px",
};

const relatedMetaStyle = {
  marginTop: "10px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.6,
};

const talkContactButtonStyle = {
  display: "inline-block",
  minWidth: "190px",
  textAlign: "center",
  padding: "14px 20px",
  background: "#03c75a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const phoneContactButtonStyle = {
  display: "inline-block",
  minWidth: "190px",
  textAlign: "center",
  padding: "14px 20px",
  background: "#1e3a8a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const onlineContactButtonStyle = {
  display: "inline-block",
  minWidth: "190px",
  textAlign: "center",
  padding: "14px 20px",
  background: "#111827",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const backButtonStyle = {
  display: "inline-block",
  padding: "14px 22px",
  background: "#1e3a8a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "800",
};

const floatingMenuStyle = {
  position: "fixed",
  right: "22px",
  bottom: "28px",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const floatingTalkButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  width: "118px",
  height: "48px",
  background: "#03c75a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
  fontSize: "15px",
  boxShadow: "0 8px 22px rgba(3, 199, 90, 0.28)",
};

const floatingPhoneButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  width: "118px",
  height: "48px",
  background: "#ffffff",
  color: "#1e3a8a",
  border: "1px solid #dbeafe",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
  fontSize: "15px",
  boxShadow: "0 8px 22px rgba(15, 23, 42, 0.12)",
};

const floatingIconStyle = {
  fontSize: "18px",
};

const blogBoxStyle = {
  marginTop: "34px",
  padding: "24px",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  background: "#ffffff",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
};

const blogLabelStyle = {
  margin: "0 0 10px",
  color: "#03c75a",
  fontWeight: "900",
};

const blogTitleLinkStyle = {
  display: "block",
  color: "#111827",
  fontSize: "28px",
  fontWeight: "900",
  lineHeight: 1.5,
  textDecoration: "none",
  padding: "0",
  border: "none",
  background: "transparent",
};

const blogDomainStyle = {
  marginTop: "12px",
  color: "#03c75a",
  fontWeight: "800",
};

const faqBoxStyle = {
  marginTop: "60px",
  padding: "34px",
  borderRadius: "22px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 22px rgba(15, 23, 42, 0.08)",
};

const faqLabelStyle = {
  display: "inline-block",
  margin: "0 0 12px",
  padding: "6px 12px",
  borderRadius: "999px",
  background: "#eff6ff",
  color: "#1e3a8a",
  fontSize: "14px",
  fontWeight: "900",
};

const faqTitleStyle = {
  fontSize: "28px",
  lineHeight: 1.4,
  margin: "0 0 22px",
  color: "#0f172a",
};

const faqListStyle = {
  display: "grid",
  gap: "14px",
};

const faqItemStyle = {
  padding: "20px",
  borderRadius: "18px",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
};

const faqQuestionStyle = {
  margin: "0 0 10px",
  fontSize: "18px",
  lineHeight: 1.6,
  color: "#111827",
};

const faqAnswerStyle = {
  margin: 0,
  fontSize: "16px",
  lineHeight: 1.8,
  color: "#475569",
};

const conversionBoxStyle = {
  marginTop: "60px",
  padding: "36px",
  borderRadius: "24px",
  background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
  color: "#ffffff",
  boxShadow: "0 14px 34px rgba(15, 23, 42, 0.22)",
};

const conversionBadgeStyle = {
  display: "inline-block",
  margin: "0 0 12px",
  padding: "6px 12px",
  borderRadius: "999px",
  background: "rgba(255, 255, 255, 0.14)",
  color: "#bfdbfe",
  fontSize: "14px",
  fontWeight: "900",
};

const conversionTitleStyle = {
  fontSize: "30px",
  lineHeight: 1.4,
  margin: "0 0 14px",
  color: "#ffffff",
};

const conversionLeadStyle = {
  fontSize: "17px",
  lineHeight: 1.9,
  color: "#dbeafe",
  margin: "0 0 26px",
};

const conversionGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const conversionCardStyle = {
  padding: "20px",
  borderRadius: "18px",
  background: "rgba(255, 255, 255, 0.1)",
  border: "1px solid rgba(255, 255, 255, 0.16)",
};

const conversionCardTitleStyle = {
  margin: "0 0 10px",
  color: "#ffffff",
  fontSize: "18px",
  lineHeight: 1.5,
};

const conversionCardTextStyle = {
  margin: 0,
  color: "#dbeafe",
  fontSize: "15px",
  lineHeight: 1.8,
};

const conversionButtonWrapStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "22px",
  flexWrap: "wrap",
  marginTop: "34px",
  width: "100%",
};

const conversionNoticeStyle = {
  margin: "22px 0 0",
  padding: "14px 16px",
  borderRadius: "16px",
  background: "rgba(255, 255, 255, 0.1)",
  color: "#dbeafe",
  fontSize: "14px",
  lineHeight: 1.7,
};
