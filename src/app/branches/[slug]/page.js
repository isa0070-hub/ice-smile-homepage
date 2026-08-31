import Link from "next/link"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  getBranchCanonicalUrl,
  getBranchDisplayData,
  getBranchLocalBusinessJsonLd,
  getBranchSeo,
  getBranchSeoForRecord,
  branchSlugs,
} from "@/lib/branchSeo"
import { getOrganizationJsonLd, getWebSiteJsonLd } from "@/lib/siteSeo"

export const revalidate = 3600

const serviceHubLinks = [
  { href: "/repair-services/iphone", label: "아이폰 수리 안내" },
  { href: "/repair-services/ipad", label: "아이패드 수리 안내" },
  { href: "/repair-services/macbook", label: "맥북 수리 안내" },
  { href: "/repair-services/surface", label: "서피스 수리 안내" },
  { href: "/repair-services/lenovo", label: "레노버 수리 안내" },
  { href: "/repair-services/apple", label: "애플 제품 수리 안내" },
  {
    href: "/repair-services/notebook-tablet",
    label: "ASUS·HP·LG 노트북 수리 안내",
  },
]

export function generateStaticParams() {
  return branchSlugs.map((slug) => ({ slug }))
}

function getBranchFaqs(seo) {
  return [
    {
      question: `${seo.shortName} 방문 전에 무엇을 확인해야 하나요?`,
      answer:
        "기기 모델명과 고장 증상을 먼저 알려주세요. 액정 파손은 사진을 함께 보내주시면 부품 재고와 점검 범위를 확인하는 데 도움이 됩니다.",
    },
    {
      question: "수리 비용과 시간은 바로 알 수 있나요?",
      answer:
        "같은 모델도 손상 상태와 필요한 부품이 다를 수 있습니다. 기기 상태를 확인한 뒤 예상 비용과 소요 시간을 안내하며, 부품 재고에 따라 일정이 달라질 수 있습니다.",
    },
    {
      question: "방문이 어려우면 택배 접수도 가능한가요?",
      answer:
        "방문이 어려운 경우 전국 택배 접수를 상담할 수 있습니다. 발송 전에 기기 모델과 증상을 알려주시면 포장과 접수 방법을 안내합니다.",
    },
  ]
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const seo = getBranchSeo(slug)

  if (!seo) {
    return {
      title: {
        absolute: "지점 정보를 찾을 수 없습니다 | 아이스마일어게인",
      },
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const canonicalUrl = getBranchCanonicalUrl(seo)

  return {
    title: {
      absolute: seo.title,
    },
    description: seo.description,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonicalUrl,
      siteName: "아이스마일어게인",
      locale: "ko_KR",
      type: "website",
      images: [
        {
          url: new URL(seo.image, canonicalUrl).href,
          alt: `${seo.name} 위치 및 수리 안내`,
        },
      ],
    },

    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function BranchDetailPage({ params }) {
  const { slug } = await params
  const seo = getBranchSeo(slug)

  if (!seo) {
    notFound()
  }

  const { data: branchRows, error } = await supabase
    .from("branches")
    .select(
      "id,name,phone,address1,address2,visit_info,naver_map,map_image,is_active,sort_order",
    )

  const databaseBranch = error
    ? null
    : (branchRows || []).find(
        (branch) => getBranchSeoForRecord(branch)?.slug === seo.slug,
      )

  // An explicitly disabled branch remains unavailable. A missing row or a
  // transient database error must not turn a verified, static branch URL into
  // a temporary 404 that search engines could deindex.
  if (!error && databaseBranch?.is_active === false) {
    notFound()
  }

  const branch = getBranchDisplayData(seo, databaseBranch)
  const canonicalUrl = getBranchCanonicalUrl(seo)
  const branchFaqs = getBranchFaqs(seo)
  const contactHref = `/contact?branch=${encodeURIComponent(seo.slug)}`
  const seolleungIpadContactHref =
    seo.slug === "seolleung"
      ? "/contact?branch=seolleung&device=ipad"
      : null

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      getWebSiteJsonLd(),
      getOrganizationJsonLd(),
      getBranchLocalBusinessJsonLd(seo),
    ],
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: "https://www.ismileagain.co.kr",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "지점안내",
        item: "https://www.ismileagain.co.kr/branches",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: seo.shortName,
        item: canonicalUrl,
      },
    ],
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${canonicalUrl}#faq`,
    mainEntity: branchFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }

  return (
    <main style={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />

      <section style={styles.hero}>
        <p style={styles.breadcrumb}>
          <Link href="/" style={styles.breadcrumbLink}>
            홈
          </Link>
          {" > "}
          <Link href="/branches" style={styles.breadcrumbLink}>
            지점안내
          </Link>
          {" > "}
          {seo.shortName}
        </p>

        <h1 className="branch-detail-title" style={styles.title}>
  {seo.h1 || "아이스마일어게인"}{" · "}
  <br className="seo-mobile-title-break" aria-hidden="true" />
  <span className="seo-mobile-title-line">{seo.shortName}</span>
</h1>
        <p style={styles.subtitle}>{seo.description}</p>
      </section>

      <section style={styles.content}>
        <article className="branch-card" style={styles.card}>
        <div className="branch-detail-map-box" style={styles.mapBox}>
            {branch.map_image ? (
              // Map URLs can be replaced in admin and have mixed dimensions.
              // eslint-disable-next-line @next/next/no-img-element
              <img
              className="branch-detail-map-image"
              src={branch.map_image}
              alt={`${seo.name} 위치 약도`}
              style={styles.mapImage}
            />
            ) : (
              <div style={styles.noImage}>지점 약도 준비 중</div>
            )}
          </div>

          <div style={styles.info}>
            <h2 style={styles.sectionTitle}>지점 위치 및 연락처</h2>

            <div style={styles.infoRow}>
              <strong>주소</strong>
              <p>
                {branch.address1}
                <br />
                {branch.address2}
              </p>
            </div>

            <div style={styles.infoRow}>
              <strong>전화번호</strong>
              <p>
                <a href={`tel:${branch.phone}`} style={styles.phone}>
                  {branch.phone}
                </a>
              </p>
            </div>

            <div style={styles.infoRow}>
              <strong>방문안내</strong>
              <p>{branch.visit_info}</p>
            </div>

            {branch.business_hours && (
              <div style={styles.infoRow}>
                <strong>영업시간</strong>
                <p>
                  {branch.business_hours.weekdays}
                  <br />
                  {branch.business_hours.closed}
                  <br />
                  {branch.business_hours.breakTime}
                </p>
              </div>
            )}

            {branch.parking_info && (
              <div style={styles.infoRow}>
                <strong>주차안내</strong>
                <p>{branch.parking_info}</p>
              </div>
            )}

            <div className="branch-buttons" style={styles.buttons}>
              {branch.naver_map && (
                <a
                  href={branch.naver_map}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.primaryButton}
                >
                  네이버지도 보기
                </a>
              )}

              <Link href={contactHref} style={styles.secondaryButton}>
                온라인 문의
              </Link>

              {seolleungIpadContactHref && (
                <Link
                  href={seolleungIpadContactHref}
                  style={styles.secondaryButton}
                >
                  아이패드 수리 문의
                </Link>
              )}
            </div>
          </div>
        </article>

        <article style={styles.textCard}>
          <h2 style={styles.sectionTitle}>{seo.shortName} 수리 안내</h2>

          <p style={styles.paragraph}>{seo.intro}</p>

          <ul style={styles.serviceList}>
            {seo.services.map((service) => (
              <li key={service} style={styles.serviceItem}>
                {service}
              </li>
            ))}
          </ul>

          <nav
            aria-label={`${seo.shortName} 기기별 수리 안내`}
            style={styles.serviceHubLinks}
          >
            {serviceHubLinks.map((item) => (
              <Link key={item.href} href={item.href} style={styles.serviceHubLink}>
                {item.label}
              </Link>
            ))}
          </nav>

          <p style={styles.independentNotice}>
            아이스마일어게인은 제조사가 직접 운영하거나 공인한 공식 서비스센터가
            아닌 독립 스마트기기 전문 수리센터입니다.
          </p>
        </article>

        <article style={styles.textCard}>
          <h2 style={styles.sectionTitle}>인근 지역 방문 안내</h2>

          <p style={styles.paragraph}>
            {seo.nearbyAreas.join(", ")} 등 인근 지역에서도 방문하실 수
            있습니다. 제품의 증상과 부품 재고에 따라 수리 시간은 달라질
            수 있으므로 방문 전에 전화 또는 온라인 문의로 확인해 주세요.
          </p>

          <Link href="/repair-cases" style={styles.caseButton}>
            최근 수리사례 확인하기
          </Link>
        </article>

        <article style={styles.textCard}>
          <h2 style={styles.sectionTitle}>방문·택배 접수 전 확인사항</h2>

          <div style={styles.checkGrid}>
            <section style={styles.checkItem}>
              <h3 style={styles.checkTitle}>1. 정확한 모델명</h3>
              <p style={styles.checkText}>
                설정 화면 또는 제품 뒷면의 모델명을 확인하면 호환 부품과
                재고를 더 정확하게 안내할 수 있습니다.
              </p>
            </section>

            <section style={styles.checkItem}>
              <h3 style={styles.checkTitle}>2. 증상과 파손 사진</h3>
              <p style={styles.checkText}>
                화면, 배터리, 충전, 전원 등 불편한 증상과 파손 사진을 함께
                보내주시면 필요한 점검 범위를 정하는 데 도움이 됩니다.
              </p>
            </section>

            <section style={styles.checkItem}>
              <h3 style={styles.checkTitle}>3. 재고·일정 확인</h3>
              <p style={styles.checkText}>
                부품 재고와 기기 상태에 따라 비용과 시간이 달라질 수 있으므로
                방문 또는 발송 전에 상담해 주세요.
              </p>
            </section>
          </div>

          <div style={styles.buttons}>
            <a href={`tel:${branch.phone}`} style={styles.primaryButton}>
              {seo.shortName} 전화 상담
            </a>
            <Link href={contactHref} style={styles.secondaryButton}>
              사진·증상 온라인 문의
            </Link>
          </div>
        </article>

        <article style={styles.textCard}>
          <h2 style={styles.sectionTitle}>{seo.shortName} 자주 묻는 질문</h2>

          <div style={styles.faqList}>
            {branchFaqs.map((faq) => (
              <section key={faq.question} style={styles.faqItem}>
                <h3 style={styles.faqQuestion}>{faq.question}</h3>
                <p style={styles.faqAnswer}>{faq.answer}</p>
              </section>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}

const styles = {
    page: {
        backgroundColor: "#f4f8fc",
        minHeight: "100vh",
        padding: "140px 24px 80px",
        color: "#111827",
      },

  hero: {
    maxWidth: "1180px",
    margin: "0 auto 34px",
    textAlign: "center",
  },

  breadcrumb: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "12px",
  },

  breadcrumbLink: {
    color: "#64748b",
    textDecoration: "none",
  },

  title: {
    fontSize: "42px",
    fontWeight: 900,
    margin: 0,
  },

  subtitle: {
    maxWidth: "760px",
    margin: "14px auto 0",
    fontSize: "17px",
    color: "#475569",
    lineHeight: 1.8,
  },

  content: {
    maxWidth: "1180px",
    margin: "0 auto",
    display: "grid",
    gap: "28px",
  },

  card: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "28px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
  },

  mapBox: {
    borderRadius: "22px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    backgroundColor: "#f8fafc",
    minHeight: "320px",
  },

  mapImage: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
  },

  noImage: {
    minHeight: "320px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
  },

  info: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  sectionTitle: {
    fontSize: "28px",
    fontWeight: 900,
    margin: "0 0 22px",
  },

  infoRow: {
    marginBottom: "18px",
    fontSize: "16px",
    lineHeight: 1.7,
  },

  phone: {
    color: "#1d4ed8",
    fontWeight: 900,
    textDecoration: "none",
    fontSize: "22px",
  },

  buttons: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
    flexWrap: "wrap",
  },

  primaryButton: {
    backgroundColor: "#1d4ed8",
    color: "#ffffff",
    padding: "13px 18px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 800,
  },

  secondaryButton: {
    backgroundColor: "#ffffff",
    color: "#1d4ed8",
    padding: "13px 18px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 800,
    border: "1px solid #bfdbfe",
  },

  textCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 12px 35px rgba(15,23,42,0.06)",
  },

  paragraph: {
    margin: 0,
    color: "#475569",
    fontSize: "17px",
    lineHeight: 1.9,
  },

  serviceList: {
    margin: "24px 0 0",
    paddingLeft: "22px",
    display: "grid",
    gap: "12px",
  },

  serviceItem: {
    color: "#1f2937",
    fontSize: "16px",
    lineHeight: 1.7,
  },

  serviceHubLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "24px",
  },

  serviceHubLink: {
    display: "inline-block",
    padding: "10px 14px",
    border: "1px solid #bfdbfe",
    borderRadius: "999px",
    color: "#1d4ed8",
    backgroundColor: "#eff6ff",
    textDecoration: "none",
    fontWeight: 800,
  },

  independentNotice: {
    margin: "24px 0 0",
    padding: "14px 16px",
    borderRadius: "14px",
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.7,
  },

  caseButton: {
    display: "inline-block",
    marginTop: "24px",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "13px 18px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 800,
  },

  checkGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },

  checkItem: {
    border: "1px solid #dbeafe",
    borderRadius: "16px",
    backgroundColor: "#f8fbff",
    padding: "20px",
  },

  checkTitle: {
    margin: "0 0 10px",
    fontSize: "18px",
    color: "#1e3a8a",
  },

  checkText: {
    margin: 0,
    color: "#475569",
    fontSize: "15px",
    lineHeight: 1.75,
  },

  faqList: {
    display: "grid",
    gap: "14px",
  },

  faqItem: {
    borderTop: "1px solid #e2e8f0",
    paddingTop: "18px",
  },

  faqQuestion: {
    margin: "0 0 8px",
    fontSize: "18px",
    color: "#111827",
  },

  faqAnswer: {
    margin: 0,
    color: "#475569",
    fontSize: "16px",
    lineHeight: 1.8,
  },
}
