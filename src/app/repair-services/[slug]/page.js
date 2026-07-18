import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getRepairService,
  getRepairServiceSlugs,
} from "@/lib/repairServices";

export const dynamic = "force-dynamic";

const baseUrl = "https://www.ismileagain.co.kr";

export function generateStaticParams() {
  return getRepairServiceSlugs().map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = getRepairService(slug);

  if (!service) {
    return {
      title: {
        absolute: "수리품목을 찾을 수 없습니다 | 아이스마일어게인",
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalUrl = `${baseUrl}/repair-services/${service.slug}`;

  return {
    title: {
      absolute: service.title,
    },

    description: service.description,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      title: service.title,
      description: service.description,
      url: canonicalUrl,
      siteName: "아이스마일어게인",
      locale: "ko_KR",
      type: "website",
      images: [
        {
          url: `${baseUrl}${service.image}`,
          alt: service.heading,
        },
      ],
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RepairServicePage({ params }) {
  const { slug } = await params;
  const service = getRepairService(slug);

  if (!service) {
    notFound();
  }

  const { data: repairCases, error } = await supabase
    .from("repair_cases")
    .select(
      "id, slug, title, image_url, alt_text, branch, model, symptom, created_at"
    )
    .eq("category", service.category)
    .not("slug", "is", null)
    .neq("slug", "")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("repair service cases error:", error);
  }

  const canonicalUrl = `${baseUrl}/repair-services/${service.slug}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: service.name,
        item: canonicalUrl,
      },
    ],
  };

  const cases = repairCases || [];

  return (
    <main style={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />

<section className="repair-service-hero" style={styles.hero}>
  <img
    src={service.image}
    alt=""
    aria-hidden="true"
    style={styles.heroBgImage}
  />

  <div style={styles.heroOverlay} />

  <div style={styles.heroInner}>
    <p style={styles.breadcrumb}>
      <Link href="/" style={styles.heroLink}>
        홈
      </Link>
      {" > "}
      {service.name}
    </p>

    <h1 style={styles.heroTitle}>
  {service.heading.split("\n").map((line, index) => (
    <span
      key={`${service.slug}-${index}`}
      style={styles.heroTitleLine}
    >
      {line}
    </span>
  ))}
</h1>

    <p style={styles.heroDescription}>
  {service.heroDescription || service.description}
</p>
  </div>
</section>

      <div style={styles.container}>
        <section style={styles.introCard}>
          <h2 style={styles.sectionTitle}>{service.name} 안내</h2>
          <p style={styles.paragraph}>{service.intro}</p>
        </section>

        <section style={styles.threeGrid}>
          <article style={styles.infoCard}>
            <h2 style={styles.cardTitle}>수리 가능한 제품</h2>

            <ul style={styles.list}>
              {service.models.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article style={styles.infoCard}>
            <h2 style={styles.cardTitle}>주요 수리 항목</h2>

            <ul style={styles.list}>
              {service.repairs.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article style={styles.infoCard}>
            <h2 style={styles.cardTitle}>자주 접수되는 증상</h2>

            <ul style={styles.list}>
              {service.symptoms.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section style={styles.noticeCard}>
          <h2 style={styles.cardTitle}>접수 전 확인사항</h2>
          <p style={styles.paragraph}>{service.notice}</p>

          <div style={styles.buttonWrap}>
            <Link href="/contact" style={styles.primaryButton}>
              온라인 수리문의
            </Link>

            <Link href="/branches" style={styles.secondaryButton}>
              가까운 지점 확인
            </Link>
          </div>
        </section>

        <section style={styles.caseSection}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.sectionLabel}>실제 작업 사례</p>
              <h2 style={styles.sectionTitle}>
                최근 {service.name} 수리사례
              </h2>
            </div>

            <Link
              href={`/repair-cases?category=${encodeURIComponent(
                service.category
              )}`}
              style={styles.textLink}
            >
              전체 수리사례 보기
            </Link>
          </div>

          {cases.length > 0 ? (
            <div style={styles.caseGrid}>
              {cases.map((item) => (
                <Link
                  key={item.id}
                  href={`/repair-cases/${item.slug}`}
                  style={styles.caseLink}
                >
                  <article style={styles.caseCard}>
                    <img
                      src={item.image_url || service.image}
                      alt={item.alt_text || item.title}
                      style={styles.caseImage}
                    />

                    <div style={styles.caseBody}>
                      <p style={styles.caseMeta}>
                        {item.branch || "아이스마일어게인"}
                        {item.model ? ` · ${item.model}` : ""}
                      </p>

                      <h3 style={styles.caseTitle}>{item.title}</h3>

                      {item.symptom && (
                        <p style={styles.caseSymptom}>
                          증상: {item.symptom}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div style={styles.emptyCard}>
              해당 품목의 수리사례를 준비 중입니다.
            </div>
          )}
        </section>

        <section style={styles.branchSection}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.sectionLabel}>방문 접수</p>
              <h2 style={styles.sectionTitle}>
                강변점·선릉점·신도림점 안내
              </h2>
            </div>
          </div>

          <div style={styles.branchGrid}>
            <Link
              href="/branches/gangbyeon"
              style={styles.branchCard}
            >
              <strong style={styles.branchName}>강변점</strong>
              <span>강변테크노마트 5층 B-20호</span>
              <span style={styles.phone}>02-3424-5295</span>
            </Link>

            <Link
              href="/branches/seolleung"
              style={styles.branchCard}
            >
              <strong style={styles.branchName}>선릉점</strong>
              <span>샹제리제센터 A동 406호</span>
              <span style={styles.phone}>02-554-5295</span>
            </Link>

            <Link
              href="/branches/sindorim"
              style={styles.branchCard}
            >
              <strong style={styles.branchName}>신도림점</strong>
              <span>신도림테크노마트 9층 57-1번 기둥</span>
              <span style={styles.phone}>02-2111-8899</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    paddingTop: "96px",
    paddingBottom: "80px",
    background: "#f4f8fc",
    color: "#111827",
  },

  hero: {
    position: "relative",
    overflow: "hidden",
  
    /* 아래 텍스트 박스와 좌우 선 맞춤 */
    width: "calc(100% - 40px)",
    maxWidth: "1180px",
    margin: "0 auto",
  
    /* 위아래 높이는 다시 넉넉하게 */
    minHeight: "390px",
  
    borderRadius: "26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#ffffff",
    boxSizing: "border-box",
    boxShadow: "0 14px 38px rgba(15, 23, 42, 0.12)",
  },
  
  heroBgImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center center",
    filter: "brightness(1.12) contrast(1.02)",
  },
  
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.22), rgba(15,23,42,0.34))",
  },
  
  heroInner: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    padding: "58px 36px",
    boxSizing: "border-box",
  },

  breadcrumb: {
    margin: "0 0 18px",
    fontSize: "14px",
    opacity: 0.9,
  },

  heroLink: {
    color: "#ffffff",
    textDecoration: "none",
  },

  heroTitle: {
    maxWidth: "900px",
    margin: "0 auto",
    fontSize: "clamp(32px, 4vw, 48px)",
    lineHeight: 1.2,
    letterSpacing: "-1.4px",
    fontWeight: 900,
    wordBreak: "keep-all",
    textAlign: "center",
    textShadow: "0 3px 14px rgba(0,0,0,0.72)",
  },
  heroTitleLine: {
    display: "block",
    width: "100%",
    textAlign: "center",
    whiteSpace: "nowrap",
  },

  heroDescription: {
    width: "fit-content",
    maxWidth: "780px",
    margin: "24px auto 0",
    padding: "13px 20px",
    borderRadius: "16px",
    background: "rgba(15, 23, 42, 0.07)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    color: "#ffffff",
    fontSize: "clamp(16px, 1.8vw, 19px)",
    fontWeight: 700,
    lineHeight: 1.75,
    letterSpacing: "-0.2px",
    textAlign: "center",
    textShadow: "0 2px 9px rgba(0,0,0,0.7)",
    wordBreak: "keep-all",
    whiteSpace: "pre-line",
  },

  container: {
    maxWidth: "1180px",
    margin: "30px auto 0",
    padding: "0 24px",
    boxSizing: "border-box",
  },

  introCard: {
    padding: "34px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    boxShadow: "0 12px 35px rgba(15, 23, 42, 0.06)",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "clamp(27px, 4vw, 36px)",
    lineHeight: 1.3,
    fontWeight: 900,
    wordBreak: "keep-all",
  },

  paragraph: {
    margin: "18px 0 0",
    color: "#475569",
    fontSize: "17px",
    lineHeight: 1.9,
    wordBreak: "keep-all",
  },

  threeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "22px",
    marginTop: "24px",
  },

  infoCard: {
    padding: "28px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
  },

  cardTitle: {
    margin: 0,
    fontSize: "23px",
    lineHeight: 1.4,
    fontWeight: 900,
  },

  list: {
    margin: "20px 0 0",
    paddingLeft: "21px",
    display: "grid",
    gap: "12px",
    color: "#334155",
    fontSize: "16px",
    lineHeight: 1.75,
  },

  noticeCard: {
    marginTop: "24px",
    padding: "32px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "24px",
  },

  buttonWrap: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "24px",
  },

  primaryButton: {
    display: "inline-block",
    padding: "14px 20px",
    borderRadius: "12px",
    background: "#1d4ed8",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 900,
  },

  secondaryButton: {
    display: "inline-block",
    padding: "14px 20px",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#1d4ed8",
    border: "1px solid #93c5fd",
    textDecoration: "none",
    fontWeight: 900,
  },

  caseSection: {
    marginTop: "58px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "22px",
    flexWrap: "wrap",
  },

  sectionLabel: {
    margin: "0 0 8px",
    color: "#1d4ed8",
    fontSize: "14px",
    fontWeight: 900,
  },

  textLink: {
    color: "#1d4ed8",
    textDecoration: "none",
    fontWeight: 900,
  },

  caseGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "22px",
  },

  caseLink: {
    color: "inherit",
    textDecoration: "none",
  },

  caseCard: {
    height: "100%",
    overflow: "hidden",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
  },

  caseImage: {
    display: "block",
    width: "100%",
    height: "210px",
    objectFit: "cover",
    background: "#e2e8f0",
  },

  caseBody: {
    padding: "20px",
  },

  caseMeta: {
    margin: "0 0 8px",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: 700,
  },

  caseTitle: {
    margin: 0,
    fontSize: "20px",
    lineHeight: 1.5,
    fontWeight: 900,
    wordBreak: "keep-all",
  },

  caseSymptom: {
    margin: "12px 0 0",
    color: "#475569",
    fontSize: "15px",
    lineHeight: 1.6,
  },

  emptyCard: {
    padding: "34px",
    textAlign: "center",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    color: "#64748b",
  },

  branchSection: {
    marginTop: "58px",
  },

  branchGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },

  branchCard: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    padding: "24px",
    background: "#0f172a",
    color: "#ffffff",
    borderRadius: "18px",
    textDecoration: "none",
  },

  branchName: {
    fontSize: "23px",
    fontWeight: 900,
  },

  phone: {
    marginTop: "6px",
    color: "#bfdbfe",
    fontWeight: 900,
    fontSize: "18px",
  },
};