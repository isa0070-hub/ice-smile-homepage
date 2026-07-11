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
    address: "서울 구로구 새말로 97 신도림테크노마트 9층 47번 기둥 뒷편",
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

function limitText(value, maxLength) {
  const text = cleanText(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
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

function makeMetaKeyword(item) {
  const keyword = cleanText(item?.seo_keyword);
  const symptom = cleanText(item?.symptom);
  const device = cleanText(item?.device);
  const model = cleanText(item?.model);

  if (keyword) return keyword;
  if (symptom) return symptom;
  if (device || model) return cleanText(`${device} ${model} 수리`);

  return "기기 수리";
}

function makeDeviceModelText(item) {
  return cleanText(`${item?.device || ""} ${item?.model || ""}`);
}

function makeDescription(item) {
  if (!item) {
    return "아이스마일어게인 수리사례 상세페이지입니다. 아이폰, 아이패드, 맥북, 서피스, 레노버 수리 사례를 확인해보세요.";
  }

  const branchIntro = getBranchIntro(item.branch);
  const deviceModel = makeDeviceModelText(item);
  const keyword = makeMetaKeyword(item);
  const symptom = cleanText(item.symptom);

  const description = `${branchIntro}에서 진행한 ${deviceModel || keyword} 수리사례입니다. ${
    symptom ? `${symptom} 증상 점검 후 ` : ""
  }${keyword} 상담과 수리 가능 여부, 예상 소요 시간, 방문 및 택배 접수 방법을 안내해드립니다.`;

  return limitText(description, 155);
}

function makeTitle(item) {
  if (!item) {
    return "수리사례 | 아이스마일어게인 수리전문 공식서비스센터";
  }

  const branchLabel = getBranchSearchLabel(item.branch);
  const deviceModel = makeDeviceModelText(item);
  const keyword = makeMetaKeyword(item);

  const title = `${branchLabel} ${deviceModel || item.device || ""} ${keyword} 수리사례 | 아이스마일어게인 ${item.branch || ""}`;

  return limitText(title, 65);
}

function makeCanonicalUrl(item) {
  return item
    ? `${BASE_URL}/repair-cases/${item.slug}`
    : `${BASE_URL}/repair-cases`;
}
function makeFaqItems(item, phoneNumber) {
  const deviceModel = `${item?.device || "기기"} ${item?.model || ""}`
    .replace(/\s+/g, " ")
    .trim();

  const branch = item?.branch || "아이스마일어게인";
  const symptom = item?.symptom || "고장 증상";
  const keyword = item?.seo_keyword || item?.category || "수리";

  return [
    {
      question: `${deviceModel} ${symptom} 수리 가능 여부는 어떻게 확인하나요?`,
      answer: `${branch}에 방문 전 ${phoneNumber} 또는 네이버톡톡으로 기기 모델명과 증상 사진을 보내주시면 ${keyword} 가능 여부, 예상 비용, 소요 시간을 안내해드립니다.`,
    },
    {
      question: "수리 시간은 얼마나 걸리나요?",
      answer:
        "수리 시간은 기종, 고장 증상, 부품 재고, 내부 손상 정도에 따라 달라질 수 있습니다. 방문 전 문의 주시면 현재 접수 상황을 기준으로 예상 시간을 안내해드립니다.",
    },
    {
      question: "수리하면 데이터는 그대로 유지되나요?",
      answer:
        "대부분의 액정, 배터리, 카메라, 충전단자 등 부품 교체 수리는 데이터 삭제 없이 진행됩니다. 다만 침수, 메인보드 손상, 전원불량처럼 내부 손상이 큰 경우에는 점검 결과에 따라 안내드립니다.",
    },
    {
      question: "택배 수리도 가능한가요?",
      answer:
        "방문이 어려운 경우 택배 접수도 가능합니다. 고객님이 선불로 발송해주시면 매장 도착 후 점검과 수리를 진행하고, 수리 완료 후에는 매장에서 고객님께 다시 발송해드립니다.",
    },
    {
      question: "방문 전에 예약이 필요한가요?",
      answer:
        "예약 없이 방문도 가능하지만, 부품 재고와 대기 시간을 줄이려면 전화 또는 네이버톡톡으로 먼저 문의 후 방문하시는 것을 권장드립니다.",
    },
  ];
}
function makeJsonLd({ item, detailImages = [], phoneNumber }) {
  if (!item) return null;

  const canonicalUrl = makeCanonicalUrl(item);
  const title = makeTitle(item);
  const description = makeDescription(item);
  const branchInfo = getBranchInfo(item.branch);

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
            name: item.title,
            item: canonicalUrl,
          },
        ],
      },
      {
        "@type": "Article",
        "@id": `${canonicalUrl}#article`,
        headline: item.title,
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
        about: `${item.device || ""} ${item.model || ""} ${
          item.symptom || ""
        }`
          .replace(/\s+/g, " ")
          .trim(),
      },
      {
        "@type": "Service",
        "@id": `${canonicalUrl}#service`,
        name: `${item.device || ""} ${item.model || ""} ${
          item.symptom || "수리"
        }`
          .replace(/\s+/g, " ")
          .trim(),
        serviceType: item.symptom || `${item.device || "기기"} 수리`,
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
          image: imageUrls.length > 0 ? imageUrls[0] : `${BASE_URL}/favicon.ico`,
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
      if (related?.id && related.id !== item.id && !relatedMap.has(related.id)) {
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
        .limit(4)
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
        .limit(4)
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
        .limit(4)
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
              alt:
                item?.alt_text ||
                item?.title ||
                "아이스마일어게인 수리사례 이미지",
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
    notFound ();
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
    
    const jsonLd = makeJsonLd({
      item,
      detailImages: detailImages || [],
      phoneNumber,
    });
    const faqItems = makeFaqItems(item, phoneNumber);

  return (
    <main style={{ maxWidth: "900px", margin: "80px auto", padding: "24px" }}>
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
        <span style={breadcrumbCurrentStyle}>{item.title}</span>
      </nav>

      <p style={{ color: "#1e3a8a", fontWeight: "800" }}>
        {item.branch} · {item.category}
      </p>

      <h1 style={{ fontSize: "42px", lineHeight: 1.3, marginBottom: "20px" }}>
        {item.title}
      </h1>

      <p style={{ fontSize: "18px", color: "#475569", marginBottom: "12px" }}>
        대표 키워드 : {item.seo_keyword}
      </p>

      <p style={{ color: "#64748b", fontWeight: "700", marginBottom: "30px" }}>
        조회수 : {item.views || 0}
      </p>

      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.alt_text || item.title}
          style={mainImageStyle}
        />
      )}

<section style={infoBoxStyle} aria-label="수리사례 핵심 요약">
  <p style={summaryLabelTopStyle}>수리사례 핵심 요약</p>

  <h2 style={summaryTitleStyle}>
    {item.branch} {item.device} {item.model} 수리 정보
  </h2>

  <p style={summaryIntroStyle}>
    {item.title} 사례를 방문 전 빠르게 확인할 수 있도록 기기, 증상,
    수리 지점, 상담 연락처를 한눈에 정리했습니다.
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
      <strong style={summaryValueStyle}>{item.device || "수리 기기"}</strong>
    </div>

    <div style={summaryItemStyle}>
      <span style={summaryLabelStyle}>모델명</span>
      <strong style={summaryValueStyle}>{item.model || "모델 확인 필요"}</strong>
    </div>

    <div style={summaryItemStyle}>
      <span style={summaryLabelStyle}>고장 증상</span>
      <strong style={summaryValueStyle}>{item.symptom || "증상 점검 필요"}</strong>
    </div>

    <div style={summaryItemStyle}>
      <span style={summaryLabelStyle}>수리 키워드</span>
      <strong style={summaryValueStyle}>
        {item.seo_keyword || item.category || "기기 수리"}
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
      <strong style={summaryValueStyle}>전화 · 네이버톡톡 · 온라인 문의</strong>
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

      <section style={contentStyle}>{item.repair_content}</section>

      {item.blog_url && (
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

      {detailImages && detailImages.length > 0 && (
        <section style={detailImageSectionStyle}>
          <h3 style={{ fontSize: "30px", marginBottom: "24px" }}>
            수리 과정 상세 이미지
          </h3>

          {detailImages.map((image, index) => (
            <div key={image.id} style={detailImageCardStyle}>
              {image.image_url && (
                <img
                  src={image.image_url}
                  alt={
                    image.alt_text ||
                    image.description ||
                    `${item.title} 상세 이미지 ${index + 1}`
                  }
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
      )}

      {relatedCases && relatedCases.length > 0 && (
        <section style={relatedBoxStyle}>
          <h3 style={{ fontSize: "28px", marginBottom: "12px" }}>
            함께 보면 좋은 수리사례
          </h3>

          <p style={relatedIntroStyle}>
            같은 기기, 같은 분류, 같은 지점의 수리사례를 함께 확인해보세요.
            내부 연결이 자연스럽게 이어져 검색엔진이 수리사례 구조를 이해하는 데도
            도움이 됩니다.
          </p>

          <div style={relatedGridStyle}>
            {relatedCases.map((related) => (
              <a
                key={related.id}
                href={`/repair-cases/${related.slug}`}
                style={relatedCardStyle}
              >
                {related.image_url ? (
                  <img
                    src={related.image_url}
                    alt={related.alt_text || related.title}
                    style={relatedImageStyle}
                  />
                ) : (
                  <div style={relatedNoImageStyle}>이미지 없음</div>
                )}

                <p style={relatedBadgeStyle}>
                  {getRelatedBadge(item, related)}
                </p>

                <p style={{ color: "#1e3a8a", fontWeight: "800" }}>
                  {related.branch} · {related.category}
                </p>

                <h4 style={{ fontSize: "18px", lineHeight: 1.5 }}>
                  {related.title}
                </h4>

                <p style={relatedMetaStyle}>
                  {related.device} {related.model} {related.symptom}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

      <section style={contactBoxStyle}>
        <h3 style={{ fontSize: "26px", marginBottom: "12px" }}>
          수리 상담 및 접수
        </h3>
      <section style={faqBoxStyle} id="repair-case-faq">
        <p style={faqLabelStyle}>자주 묻는 질문</p>

        <h3 style={faqTitleStyle}>
          {item.device} {item.model} 수리 전 확인할 내용
        </h3>

        <div style={faqListStyle}>
          {faqItems.map((faq, index) => (
            <div key={index} style={faqItemStyle}>
              <h4 style={faqQuestionStyle}>Q. {faq.question}</h4>
              <p style={faqAnswerStyle}>A. {faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

        <p style={{ fontSize: "17px", lineHeight: 1.8, color: "#475569" }}>
          방문 전 문의 주시면 수리 가능 여부, 예상 비용, 소요 시간,
          방문 또는 택배 접수 방법을 빠르게 안내해드립니다.
        </p>

        <div style={{ marginTop: "22px" }}>
          <a
            href="https://talk.naver.com/WCH5S2X"
            target="_blank"
            style={talkContactButtonStyle}
          >
            💬 네이버톡톡 문의
          </a>

          <PhoneContactButton buttonStyle={phoneContactButtonStyle} />

          <a href="/contact" style={onlineContactButtonStyle}>
            📝 온라인 수리문의
          </a>
        </div>
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
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
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
  height: "140px",
  objectFit: "contain",
  borderRadius: "14px",
  marginBottom: "12px",
};

const relatedNoImageStyle = {
  height: "140px",
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

const contactBoxStyle = {
  marginTop: "60px",
  padding: "36px",
  borderRadius: "22px",
  background: "linear-gradient(135deg, #f8fafc, #eef6ff)",
  border: "1px solid #dbeafe",
  textAlign: "center",
};

const talkContactButtonStyle = {
  display: "inline-block",
  margin: "6px",
  padding: "14px 20px",
  background: "#03c75a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const phoneContactButtonStyle = {
  display: "inline-block",
  margin: "6px",
  padding: "14px 20px",
  background: "#1e3a8a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const onlineContactButtonStyle = {
  display: "inline-block",
  margin: "6px",
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