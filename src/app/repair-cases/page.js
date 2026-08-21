import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublicRepairCasePath,
  isPublicRepairCaseSlug,
} from "@/lib/publicRepairCases";
import {
  getOrganizationJsonLd,
  getWebSiteJsonLd,
  WEBSITE_ID,
} from "@/lib/siteSeo";

const BASE_URL = "https://www.ismileagain.co.kr";
const PAGE_SIZE = 18;
const MAX_PAGE = 10000;

const categories = ["전체", "애플", "마이크로소프트 서피스", "노트북 및 태블릿"];

const deviceFilters = {
  iphone: {
    slug: "iphone",
    category: "애플",
    label: "아이폰",
    title: "아이폰 액정·배터리·침수 수리사례 | 아이스마일어게인",
    description:
      "아이폰 액정 파손, 배터리 저하, 침수, 충전·전원 불량의 실제 점검과 수리사례를 확인하세요.",
    terms: ["아이폰", "iphone"],
  },
  ipad: {
    slug: "ipad",
    category: "애플",
    label: "아이패드",
    title: "아이패드 액정·유리·배터리 수리사례 | 아이스마일어게인",
    description:
      "아이패드 전면유리·액정 파손, 배터리 스웰링, 침수, 충전·전원 불량의 실제 점검과 수리사례를 확인하세요.",
    terms: ["아이패드", "ipad"],
  },
  macbook: {
    slug: "macbook",
    category: "애플",
    label: "맥북",
    title: "맥북 액정·배터리·침수·전원 수리사례 | 아이스마일어게인",
    description:
      "맥북 에어·프로의 액정, 배터리, 침수, 충전·전원 관련 실제 점검과 수리사례를 확인하세요.",
    terms: ["맥북", "macbook"],
  },
};

// 기기·모델 입력값을 기준으로만 기기별 목록을 만든다. 제목에 다른 제품군을
// 함께 나열한 사례가 잘못 섞이는 것을 막기 위한 필터다.
const deviceSearchFields = ["device", "model"];

const categoryMetadata = {
  전체: {
    title:
      "아이폰·아이패드·맥북·서피스 수리사례 | 아이스마일어게인",
    description:
      "강변·선릉·신도림 아이스마일어게인의 실제 수리사례입니다. 아이폰, 아이패드, 맥북, 애플워치, 서피스, 레노버, LG그램의 증상 진단, 수리 과정, 기능 검수 결과를 확인하세요.",
  },
  애플: {
    title:
      "아이폰·아이패드·맥북·애플워치 수리사례 | 아이스마일어게인",
    description:
      "아이폰 액정·배터리·후면유리, 아이패드 액정·배터리, 맥북과 애플워치 등 실제 접수 기기의 증상 확인부터 수리·기능 검수까지 정리한 사례입니다.",
  },
  "마이크로소프트 서피스": {
    title: "서피스 프로·랩탑·북 수리사례 | 아이스마일어게인",
    description:
      "서피스 프로·랩탑·고·북의 액정 파손, 배터리 스웰링, 충전 및 전원 불량을 점검·수리한 실제 사례와 결과를 확인할 수 있습니다.",
  },
  "노트북 및 태블릿": {
    title:
      "레노버·LG그램·노트북·태블릿 수리사례 | 아이스마일어게인",
    description:
      "레노버, LG그램, 삼성 노트북과 태블릿의 액정, 배터리, 키보드, 충전, 전원 및 메인보드 점검·수리 사례를 확인할 수 있습니다.",
  },
};

function normalizeCategory(category) {
  return categories.includes(category) ? category : "전체";
}

function normalizeDevice(device) {
  const rawDevice = Array.isArray(device) ? device[0] : device;
  return deviceFilters[rawDevice] ? rawDevice : null;
}

function getDeviceFilter(device) {
  const normalizedDevice = normalizeDevice(device);
  return normalizedDevice ? deviceFilters[normalizedDevice] : null;
}

function getCategoryTitle(category) {
  return categoryMetadata[normalizeCategory(category)].title;
}

function getCategoryDescription(category) {
  return categoryMetadata[normalizeCategory(category)].description;
}

function getArchiveLabel(category, device) {
  const deviceFilter = getDeviceFilter(device);
  return deviceFilter ? deviceFilter.label : normalizeCategory(category);
}

function getArchiveTitle(category, page, device) {
  const deviceFilter = getDeviceFilter(device);
  const title = deviceFilter
    ? deviceFilter.title
    : getCategoryTitle(category);

  return page > 1 ? `${title} - ${page}페이지` : title;
}

function getArchiveDescription(category, page, device) {
  const deviceFilter = getDeviceFilter(device);
  const description = deviceFilter
    ? deviceFilter.description
    : getCategoryDescription(category);

  return page > 1 ? `${description} 현재 ${page}페이지입니다.` : description;
}

function normalizePage(value) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!/^\d+$/.test(String(rawValue || ""))) {
    return 1;
  }

  const page = Number.parseInt(rawValue, 10);
  return Number.isSafeInteger(page) && page > 0 && page <= MAX_PAGE ? page : 1;
}

function getArchivePath(category, page = 1, device = null) {
  const deviceFilter = getDeviceFilter(device);
  const safeCategory = deviceFilter
    ? deviceFilter.category
    : normalizeCategory(category);
  const params = new URLSearchParams();

  if (deviceFilter) {
    params.set("device", deviceFilter.slug);
  } else if (safeCategory !== "전체") {
    params.set("category", safeCategory);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return `/repair-cases${query ? `?${query}` : ""}`;
}

function getCanonicalUrl(category, page = 1, device = null) {
  return `${BASE_URL}${getArchivePath(category, page, device)}`;
}

function getDeviceSearchFilter(device) {
  const deviceFilter = getDeviceFilter(device);

  if (!deviceFilter) return "";

  return deviceFilter.terms
    .flatMap((term) =>
      deviceSearchFields.map((field) => `${field}.ilike.%${term}%`),
    )
    .join(",");
}

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pageSet = new Set([1, totalPages]);

  for (
    let page = Math.max(2, currentPage - 2);
    page <= Math.min(totalPages - 1, currentPage + 2);
    page += 1
  ) {
    pageSet.add(page);
  }

  const pages = Array.from(pageSet).sort((a, b) => a - b);
  const items = [];

  pages.forEach((page, index) => {
    const previousPage = pages[index - 1];

    if (previousPage && page - previousPage > 1) {
      items.push(`ellipsis-${previousPage}-${page}`);
    }

    items.push(page);
  });

  return items;
}

function makeJsonLd({
  cases = [],
  category = "전체",
  device = null,
  page = 1,
  totalCount = 0,
}) {
  const archiveLabel = getArchiveLabel(category, device);
  const title = getArchiveTitle(category, page, device);
  const description = getArchiveDescription(category, page, device);
  const canonicalUrl = getCanonicalUrl(category, page, device);
  const firstPosition = (page - 1) * PAGE_SIZE;

  const itemListElement = cases.map((item, index) => ({
    "@type": "ListItem",
    position: firstPosition + index + 1,
    url: `${BASE_URL}${getPublicRepairCasePath(item.slug)}`,
    name: item.title,
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      getOrganizationJsonLd(),
      getWebSiteJsonLd(),
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
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${canonicalUrl}#itemlist`,
        name: `${archiveLabel} 수리사례 목록`,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        numberOfItems: totalCount,
        itemListElement,
      },
      {
        "@type": "CollectionPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: title,
        description,
        isPartOf: {
          "@id": WEBSITE_ID,
        },
        about: [
          "아이폰수리",
          "아이패드수리",
          "맥북수리",
          "서피스수리",
          "애플워치수리",
          "레노버수리",
          "LG그램수리",
        ],
        breadcrumb: {
          "@id": `${canonicalUrl}#breadcrumb`,
        },
        mainEntity: {
          "@id": `${canonicalUrl}#itemlist`,
        },
      },
    ],
  };
}

export async function generateMetadata({ searchParams }) {
  const currentParams = await searchParams;
  const device = normalizeDevice(currentParams?.device);
  const category = device
    ? deviceFilters[device].category
    : normalizeCategory(currentParams?.category);
  const page = normalizePage(currentParams?.page);

  const title = getArchiveTitle(category, page, device);
  const description = getArchiveDescription(category, page, device);
  const canonicalUrl = getCanonicalUrl(category, page, device);

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
      type: "website",
      images: [
        {
          url: `${BASE_URL}/opengraph-image.jpg`,
          alt: "아이스마일어게인 실제 수리사례",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${BASE_URL}/opengraph-image.jpg`],
    },
  };
}

export default async function RepairCasesPage({ searchParams }) {
  const currentParams = await searchParams;
  const device = normalizeDevice(currentParams?.device);
  const category = device
    ? deviceFilters[device].category
    : normalizeCategory(currentParams?.category);
  const currentPage = normalizePage(currentParams?.page);
  const firstRow = (currentPage - 1) * PAGE_SIZE;
  const archiveLabel = getArchiveLabel(category, device);

  let query = supabase
    .from("repair_cases")
    .select(
      "id, slug, image_url, alt_text, title, branch, category, device, model, symptom, seo_keyword, repair_content, created_at",
      { count: "exact" },
    )
    .not("slug", "is", null)
    .neq("slug", "")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (device) {
    query = query
      .eq("category", deviceFilters[device].category)
      .or(getDeviceSearchFilter(device));
  } else if (category !== "전체") {
    query = query.eq("category", category);
  }

  const { data: cases, count, error } = await query.range(
    firstRow,
    firstRow + PAGE_SIZE - 1,
  );

  if (error) {
    console.error("repair_cases archive error:", error);
    throw new Error("수리사례 목록을 불러오지 못했습니다.");
  }

  const safeCases = (cases || []).filter((item) =>
    isPublicRepairCaseSlug(item?.slug),
  );
  const totalCount = typeof count === "number" ? count : safeCases.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (!error && currentPage > totalPages) {
    notFound();
  }

  const paginationItems = getPaginationItems(currentPage, totalPages);
  const jsonLd = makeJsonLd({
    cases: safeCases,
    category,
    device,
    page: currentPage,
    totalCount,
  });

  return (
    <main style={{ maxWidth: "1180px", margin: "70px auto", padding: "24px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <nav aria-label="breadcrumb" style={breadcrumbStyle}>
        <Link href="/" style={breadcrumbLinkStyle}>
          홈
        </Link>

        <span style={breadcrumbSeparatorStyle}>›</span>
        <span style={breadcrumbCurrentStyle}>수리사례</span>
      </nav>

      <section style={heroSectionStyle}>
        <p style={heroLabelStyle}>Repair Case Archive</p>

        <h1 style={heroTitleStyle}>
          {device ? `${archiveLabel} 실제 수리사례` : "실제 수리사례"}
        </h1>

        <p style={heroDescriptionStyle}>
          아이스마일어게인 수리사례에서는 아이폰, 아이패드, 맥북,
          애플워치, 마이크로소프트 서피스, 레노버, LG그램 등 실제 접수된
          기기의 수리 과정을 확인할 수 있습니다. 강변점, 선릉점,
          신도림점에서 진행한 액정수리, 배터리교체, 충전불량, 후면유리,
          카메라렌즈, 메인보드 점검 사례를 정리하고 있습니다.
        </p>
      </section>

      <section style={seoGuideBoxStyle}>
        <h2 style={seoGuideTitleStyle}>수리사례에서 확인할 수 있는 항목</h2>

        <div style={seoGuideGridStyle}>
          <div style={seoGuideCardStyle}>
            <h3 style={seoGuideCardTitleStyle}>애플 수리사례</h3>

            <p style={seoGuideCardTextStyle}>
              아이폰 액정수리, 아이폰 배터리교체, 아이패드 액정교체,
              맥북 수리, 애플워치 배터리 관련 사례를 확인할 수 있습니다.
            </p>
          </div>

          <div style={seoGuideCardStyle}>
            <h3 style={seoGuideCardTitleStyle}>서피스 수리사례</h3>

            <p style={seoGuideCardTextStyle}>
              서피스 프로, 서피스 랩탑, 서피스 고, 서피스 북의 액정파손,
              배터리 스웰링, 충전불량 수리 사례를 정리하고 있습니다.
            </p>
          </div>

          <div style={seoGuideCardStyle}>
            <h3 style={seoGuideCardTitleStyle}>
              노트북 및 태블릿 수리사례
            </h3>

            <p style={seoGuideCardTextStyle}>
              레노버, LG그램, 노트북 액정파손, 키보드 불량, 전원불량,
              메인보드 점검 등 다양한 수리 과정을 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      <div style={categoryWrapStyle}>
        {categories.map((item) => (
          <a
            key={item}
            href={getArchivePath(item)}
            style={{
              ...categoryButtonStyle,
              background: category === item ? "#1e3a8a" : "white",
              color: category === item ? "white" : "#1e3a8a",
            }}
          >
            {item}
          </a>
        ))}
      </div>

      {category === "애플" && (
        <nav aria-label="애플 기기별 수리사례" style={deviceFilterWrapStyle}>
          <span style={deviceFilterLabelStyle}>기기별 사례</span>
          {Object.values(deviceFilters).map((filter) => (
            <a
              key={filter.slug}
              href={getArchivePath(filter.category, 1, filter.slug)}
              style={{
                ...deviceFilterLinkStyle,
                background: device === filter.slug ? "#0f172a" : "#ffffff",
                color: device === filter.slug ? "#ffffff" : "#0f172a",
              }}
            >
              {filter.label}
            </a>
          ))}
        </nav>
      )}

      <section style={currentListInfoStyle}>
        <h2 style={currentListTitleStyle}>
          {archiveLabel === "전체"
            ? "전체 수리사례"
            : `${archiveLabel} 수리사례`}
        </h2>

        <p style={currentListTextStyle}>
          총 {totalCount}개의 수리사례 중 {currentPage}페이지입니다. 각
          사례에서 기기 상태, 모델명, 증상, 수리 과정, 관련 키워드를 함께
          확인할 수 있습니다.
        </p>
      </section>

      <div style={gridStyle}>
        {safeCases.length > 0 ? (
          safeCases.map((item) => {
            const detailPath = getPublicRepairCasePath(item.slug);

            return (
              <article key={item.id} style={cardStyle}>
                {item.image_url ? (
                  <a href={detailPath} style={imageLinkStyle}>
                    <Image
                      src={item.image_url}
                      alt={item.alt_text || item.title || "수리사례 이미지"}
                      fill
                      sizes="(max-width: 680px) 100vw, (max-width: 1040px) 50vw, 33vw"
                      quality={72}
                      loading="lazy"
                      style={imageStyle}
                    />
                  </a>
                ) : (
                  <div style={noImageStyle}>이미지 없음</div>
                )}

                <p style={cardMetaStyle}>
                  {item.branch || "지점"} · {item.category || "카테고리"}
                </p>

                <a
                  href={detailPath}
                  style={{ color: "#111827", textDecoration: "none" }}
                >
                  <h2 style={cardTitleStyle}>{item.title || "제목 없음"}</h2>
                </a>

                <p style={deviceTextStyle}>
                  {item.device || "기기"} · {item.model || "모델명"}
                </p>

                <p style={symptomTextStyle}>
                  증상 : {item.symptom || "증상 확인중"}
                </p>

                <p style={keywordTextStyle}>
                  대표 키워드 : {item.seo_keyword || "키워드 없음"}
                </p>

                <p style={excerptTextStyle}>
                  {item.repair_content
                    ? `${item.repair_content.slice(0, 90)}...`
                    : "수리 내용 준비중입니다."}
                </p>

                <a href={detailPath} style={detailButtonStyle}>
                  자세히 보기
                </a>
              </article>
            );
          })
        ) : (
          <p>등록된 수리사례가 없습니다.</p>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="수리사례 페이지" style={paginationStyle}>
          {currentPage > 1 && (
            <a
              href={getArchivePath(category, currentPage - 1, device)}
              rel="prev"
              style={paginationLinkStyle}
            >
              이전
            </a>
          )}

          {paginationItems.map((item) =>
            typeof item === "number" ? (
              <a
                key={item}
                href={getArchivePath(category, item, device)}
                aria-current={item === currentPage ? "page" : undefined}
                style={{
                  ...paginationLinkStyle,
                  ...(item === currentPage ? paginationCurrentStyle : {}),
                }}
              >
                {item}
              </a>
            ) : (
              <span
                key={item}
                aria-hidden="true"
                style={paginationEllipsisStyle}
              >
                …
              </span>
            ),
          )}

          {currentPage < totalPages && (
            <a
              href={getArchivePath(category, currentPage + 1, device)}
              rel="next"
              style={paginationLinkStyle}
            >
              다음
            </a>
          )}
        </nav>
      )}

      <section style={bottomSeoBoxStyle}>
        <h2 style={bottomSeoTitleStyle}>방문 수리와 택배 수리 상담 안내</h2>

        <p style={bottomSeoTextStyle}>
          아이스마일어게인은 강변점, 선릉점, 신도림점에서 방문 상담을
          진행하고 있으며, 방문이 어려운 경우 택배 접수 상담도 가능합니다.
          수리 전 기기 모델명, 고장 증상, 파손 상태를 알려주시면 예상 수리
          가능 여부와 소요 시간을 안내해드립니다.
        </p>

        <div style={bottomLinkWrapStyle}>
          <a href="/contact" style={bottomLinkStyle}>
            온라인 수리문의
          </a>

          <a
            href="https://talk.naver.com/WCH5S2X"
            target="_blank"
            style={bottomTalkLinkStyle}
          >
            네이버톡톡 문의
          </a>
        </div>
      </section>

      <FloatingButtons />
    </main>
  );
}

function FloatingButtons() {
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
<a href="tel:02-3424-5295" style={floatingPhoneButtonStyle}>
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

const heroSectionStyle = {
  marginBottom: "34px",
};

const heroLabelStyle = {
  color: "#1e3a8a",
  fontWeight: "900",
  letterSpacing: "0.04em",
  marginBottom: "10px",
};

const heroTitleStyle = {
  fontSize: "44px",
  lineHeight: 1.25,
  margin: "0 0 18px",
};

const heroDescriptionStyle = {
  fontSize: "18px",
  lineHeight: 1.85,
  color: "#475569",
  maxWidth: "960px",
};

const seoGuideBoxStyle = {
  marginBottom: "34px",
  padding: "28px",
  borderRadius: "22px",
  background: "linear-gradient(135deg, #f8fafc, #eef6ff)",
  border: "1px solid #dbeafe",
};

const seoGuideTitleStyle = {
  fontSize: "26px",
  margin: "0 0 20px",
};

const seoGuideGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
};

const seoGuideCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "20px",
};

const seoGuideCardTitleStyle = {
  fontSize: "19px",
  margin: "0 0 10px",
  color: "#1e3a8a",
};

const seoGuideCardTextStyle = {
  fontSize: "16px",
  lineHeight: 1.75,
  color: "#475569",
  margin: 0,
};

const categoryWrapStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "34px",
};

const deviceFilterWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
  margin: "-14px 0 34px",
  padding: "16px 18px",
  border: "1px solid #dbeafe",
  borderRadius: "16px",
  background: "#f8fbff",
};

const deviceFilterLabelStyle = {
  marginRight: "2px",
  color: "#475569",
  fontWeight: "800",
};

const deviceFilterLinkStyle = {
  display: "inline-block",
  padding: "9px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "800",
};

const categoryButtonStyle = {
  display: "inline-block",
  padding: "12px 18px",
  border: "1px solid #1e3a8a",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const currentListInfoStyle = {
  marginBottom: "24px",
};

const currentListTitleStyle = {
  fontSize: "28px",
  margin: "0 0 10px",
};

const currentListTextStyle = {
  fontSize: "16px",
  color: "#64748b",
  lineHeight: 1.7,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "22px",
};

const cardStyle = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
};

const imageStyle = {
  objectFit: "cover",
};

const imageLinkStyle = {
  position: "relative",
  display: "block",
  width: "100%",
  height: "190px",
  overflow: "hidden",
  borderRadius: "14px",
  marginBottom: "16px",
};

const noImageStyle = {
  width: "100%",
  height: "190px",
  borderRadius: "14px",
  background: "#f1f5f9",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  marginBottom: "16px",
};

const cardMetaStyle = {
  color: "#1e3a8a",
  fontWeight: "800",
};

const cardTitleStyle = {
  fontSize: "24px",
  marginBottom: "10px",
  lineHeight: 1.45,
};

const deviceTextStyle = {
  color: "#334155",
  fontWeight: "700",
};

const symptomTextStyle = {
  color: "#334155",
};

const keywordTextStyle = {
  color: "#475569",
};

const excerptTextStyle = {
  lineHeight: 1.7,
  color: "#334155",
};

const detailButtonStyle = {
  display: "inline-block",
  marginTop: "14px",
  padding: "10px 16px",
  background: "#1e3a8a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "800",
};

const paginationStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "36px",
};

const paginationLinkStyle = {
  minWidth: "42px",
  minHeight: "42px",
  padding: "10px 13px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#1e3a8a",
  textDecoration: "none",
  fontWeight: "800",
  boxSizing: "border-box",
};

const paginationCurrentStyle = {
  background: "#1e3a8a",
  borderColor: "#1e3a8a",
  color: "#ffffff",
};

const paginationEllipsisStyle = {
  minWidth: "24px",
  textAlign: "center",
  color: "#64748b",
  fontWeight: "800",
};

const bottomSeoBoxStyle = {
  marginTop: "58px",
  padding: "34px",
  borderRadius: "22px",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
};

const bottomSeoTitleStyle = {
  fontSize: "26px",
  margin: "0 0 14px",
};

const bottomSeoTextStyle = {
  fontSize: "17px",
  lineHeight: 1.85,
  color: "#475569",
};

const bottomLinkWrapStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "22px",
};

const bottomLinkStyle = {
  display: "inline-block",
  padding: "13px 18px",
  background: "#1e3a8a",
  color: "#ffffff",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const bottomTalkLinkStyle = {
  display: "inline-block",
  padding: "13px 18px",
  background: "#03c75a",
  color: "#ffffff",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
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
