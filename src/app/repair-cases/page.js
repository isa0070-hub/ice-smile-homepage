import { supabase } from "@/lib/supabase";

const BASE_URL = "https://www.ismileagain.co.kr";

const categories = ["전체", "애플", "마이크로소프트 서피스", "노트북 및 태블릿"];

function getCategoryTitle(category) {
  if (!category || category === "전체") {
    return "수리사례 | 아이폰 아이패드 맥북 서피스 수리전문 공식서비스센터";
  }

  return `${category} 수리사례 | 아이스마일어게인 수리전문 공식서비스센터`;
}

function getCategoryDescription(category) {
  if (!category || category === "전체") {
    return "아이스마일어게인의 실제 수리사례 모음입니다. 아이폰, 아이패드, 맥북, 애플워치, 마이크로소프트 서피스, 레노버, LG그램 등 다양한 수리 과정을 확인할 수 있습니다.";
  }

  return `아이스마일어게인의 ${category} 실제 수리사례 모음입니다. 증상 확인, 수리 과정, 지점별 접수 사례를 확인할 수 있습니다.`;
}

function getCanonicalUrl(category) {
  if (!category || category === "전체") {
    return `${BASE_URL}/repair-cases`;
  }

  return `${BASE_URL}/repair-cases?category=${encodeURIComponent(category)}`;
}

function toAbsoluteUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function makeJsonLd({ cases = [], category = "전체" }) {
  const title = getCategoryTitle(category);
  const description = getCategoryDescription(category);
  const canonicalUrl = getCanonicalUrl(category);

  const itemListElement = cases.slice(0, 20).map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${BASE_URL}/repair-cases/${item.slug}`,
    name: item.title,
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "아이스마일어게인",
        url: BASE_URL,
        telephone: "02-3424-5295",
        sameAs: [
          "https://talk.naver.com/WCH5S2X",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        url: BASE_URL,
        name: "아이스마일어게인",
        publisher: {
          "@id": `${BASE_URL}/#organization`,
        },
      },
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
        name: category === "전체" ? "전체 수리사례 목록" : `${category} 수리사례 목록`,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        numberOfItems: cases.length,
        itemListElement,
      },
      {
        "@type": "CollectionPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: title,
        description,
        isPartOf: {
          "@id": `${BASE_URL}/#website`,
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
  const category = currentParams?.category || "전체";

  const title = getCategoryTitle(category);
  const description = getCategoryDescription(category);
  const canonicalUrl = getCanonicalUrl(category);

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
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function RepairCasesPage({ searchParams }) {
  const currentParams = await searchParams;
  const category = currentParams?.category || "전체";

  let query = supabase
    .from("repair_cases")
    .select("*")
    .order("created_at", { ascending: false });

  if (category !== "전체") {
    query = query.eq("category", category);
  }

  const { data: cases } = await query;
  const safeCases = cases || [];
  const jsonLd = makeJsonLd({ cases: safeCases, category });

  return (
    <main style={{ maxWidth: "1180px", margin: "70px auto", padding: "24px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <nav aria-label="breadcrumb" style={breadcrumbStyle}>
        <a href="/" style={breadcrumbLinkStyle}>
          홈
        </a>
        <span style={breadcrumbSeparatorStyle}>›</span>
        <span style={breadcrumbCurrentStyle}>수리사례</span>
      </nav>

      <section style={heroSectionStyle}>
        <p style={heroLabelStyle}>Repair Case Archive</p>

        <h1 style={heroTitleStyle}>실제 수리사례</h1>

        <p style={heroDescriptionStyle}>
          아이스마일어게인 수리사례에서는 아이폰, 아이패드, 맥북,
          애플워치, 마이크로소프트 서피스, 레노버, LG그램 등 실제 접수된
          기기의 수리 과정을 확인할 수 있습니다. 강변점, 선릉점, 신도림점에서
          진행한 액정수리, 배터리교체, 충전불량, 후면유리, 카메라렌즈,
          메인보드 점검 사례를 정리하고 있습니다.
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
            <h3 style={seoGuideCardTitleStyle}>노트북 및 태블릿 수리사례</h3>
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
            href={
              item === "전체"
                ? "/repair-cases"
                : `/repair-cases?category=${encodeURIComponent(item)}`
            }
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

      <section style={currentListInfoStyle}>
        <h2 style={currentListTitleStyle}>
          {category === "전체" ? "전체 수리사례" : `${category} 수리사례`}
        </h2>

        <p style={currentListTextStyle}>
          총 {safeCases.length}개의 수리사례가 등록되어 있습니다. 각 사례에서
          기기 상태, 모델명, 증상, 수리 과정, 관련 키워드를 함께 확인할 수
          있습니다.
        </p>
      </section>

      <div style={gridStyle}>
        {safeCases.length > 0 ? (
          safeCases.map((item) => (
            <article key={item.id} style={cardStyle}>
              {item.image_url ? (
                <a href={`/repair-cases/${item.slug}`}>
                  <img
                    src={item.image_url}
                    alt={item.alt_text || item.title || "수리사례 이미지"}
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
                href={`/repair-cases/${item.slug}`}
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

              <a href={`/repair-cases/${item.slug}`} style={detailButtonStyle}>
                자세히 보기
              </a>
            </article>
          ))
        ) : (
          <p>등록된 수리사례가 없습니다.</p>
        )}
      </div>

      <section style={bottomSeoBoxStyle}>
        <h2 style={bottomSeoTitleStyle}>방문 수리와 택배 수리 상담 안내</h2>

        <p style={bottomSeoTextStyle}>
          아이스마일어게인은 강변점, 선릉점, 신도림점에서 방문 상담을 진행하고
          있으며, 방문이 어려운 경우 택배 접수 상담도 가능합니다. 수리 전
          기기 모델명, 고장 증상, 파손 상태를 알려주시면 예상 수리 가능 여부와
          소요 시간을 안내해드립니다.
        </p>

        <div style={bottomLinkWrapStyle}>
          <a href="/contact" style={bottomLinkStyle}>
            온라인 수리문의
          </a>
          <a href="https://talk.naver.com/WCH5S2X" target="_blank" style={bottomTalkLinkStyle}>
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
  width: "100%",
  height: "190px",
  objectFit: "cover",
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