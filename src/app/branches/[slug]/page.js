import Link from "next/link"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getBranchSeo } from "@/lib/branchSeo"

export const dynamic = "force-dynamic"

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

  const canonicalUrl = `https://www.ismileagain.co.kr/branches/${seo.slug}`

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

  const { data: branch, error } = await supabase
    .from("branches")
    .select("*")
    .eq("phone", seo.phone)
    .eq("is_active", true)
    .maybeSingle()

  if (error || !branch) {
    notFound()
  }

  const canonicalUrl = `https://www.ismileagain.co.kr/branches/${seo.slug}`

  const fullAddress = [branch.address1, branch.address2]
    .filter(Boolean)
    .join(" ")

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${canonicalUrl}#localbusiness`,
    name: seo.name,
    url: canonicalUrl,
    telephone: branch.phone,

    address: {
      "@type": "PostalAddress",
      streetAddress: fullAddress,
      addressLocality: seo.locality,
      addressRegion: "서울특별시",
      addressCountry: "KR",
    },

    ...(branch.map_image
      ? {
          image: branch.map_image,
        }
      : {}),

    ...(branch.naver_map
      ? {
          hasMap: branch.naver_map,
        }
      : {}),
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
  <span className="branch-detail-title-desktop">
    {seo.name}
  </span>

  <span className="branch-detail-title-mobile">
    <span>아이스마일어게인</span>
    <span>{seo.shortName}</span>
  </span>
</h1>

        <p style={styles.subtitle}>{seo.description}</p>
      </section>

      <section style={styles.content}>
        <article className="branch-card" style={styles.card}>
        <div className="branch-detail-map-box" style={styles.mapBox}>
            {branch.map_image ? (
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

              <Link href="/contact" style={styles.secondaryButton}>
                온라인 문의
              </Link>
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
}