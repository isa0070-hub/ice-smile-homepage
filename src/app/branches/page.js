import Link from "next/link"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export const metadata = {
  title: {
    absolute:
      "아이스마일어게인 지점안내 | 강변·선릉·신도림 수리센터",
  },

  description:
    "아이스마일어게인 강변점, 선릉점, 신도림점의 주소와 전화번호, 약도, 방문 안내를 확인하세요. 아이폰·아이패드·맥북·서피스·노트북 수리를 진행합니다.",

  alternates: {
    canonical: "https://www.ismileagain.co.kr/branches",
  },

  openGraph: {
    title: "아이스마일어게인 지점안내",
    description:
      "강변점·선릉점·신도림점의 위치, 연락처와 방문 안내를 확인하세요.",
    url: "https://www.ismileagain.co.kr/branches",
    siteName: "아이스마일어게인",
    locale: "ko_KR",
    type: "website",
  },

  robots: {
    index: true,
    follow: true,
  },
}

const branchSlugByPhone = {
  "02-3424-5295": "gangbyeon",
  "02-554-5295": "seolleung",
  "02-2111-8899": "sindorim",
}

export default async function BranchesPage() {
  const { data: branches } = await supabase
    .from("branches")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.breadcrumb}>
          <Link href="/" style={styles.breadcrumbLink}>
            홈
          </Link>
          {" > "}
          지점안내
        </p>

        <h1 style={styles.title}>아이스마일어게인 지점안내</h1>

        <p style={styles.subtitle}>
          강변점·선릉점·신도림점의 약도, 주소, 연락처와 방문 정보를
          확인하실 수 있습니다.
        </p>
      </section>

      <section style={styles.list}>
        {(branches || []).map((branch) => {
          const slug = branchSlugByPhone[branch.phone]
          const detailUrl = slug ? `/branches/${slug}` : null

          return (
            <article
              key={branch.id}
              className="branch-card"
              style={styles.card}
            >
              <div style={styles.mapBox}>
                {detailUrl ? (
                  <Link
                    href={detailUrl}
                    aria-label={`${branch.name} 상세 안내 보기`}
                  >
                    <img
                      src={branch.map_image}
                      alt={`${branch.name} 위치 약도`}
                      style={styles.mapImage}
                    />
                  </Link>
                ) : (
                  <img
                    src={branch.map_image}
                    alt={`${branch.name} 위치 약도`}
                    style={styles.mapImage}
                  />
                )}
              </div>

              <div style={styles.info}>
                {detailUrl ? (
                  <h2 style={styles.branchName}>
                    <Link
                      href={detailUrl}
                      style={styles.branchNameLink}
                    >
                      {branch.name}
                    </Link>
                  </h2>
                ) : (
                  <h2 style={styles.branchName}>{branch.name}</h2>
                )}

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
                    <a
                      href={`tel:${branch.phone}`}
                      style={styles.phone}
                    >
                      {branch.phone}
                    </a>
                  </p>
                </div>

                <div style={styles.infoRow}>
                  <strong>방문안내</strong>
                  <p>{branch.visit_info}</p>
                </div>

                <div
                  className="branch-buttons"
                  style={styles.buttons}
                >
                  {detailUrl && (
                    <Link
                      href={detailUrl}
                      style={styles.detailButton}
                    >
                      {branch.name} 상세보기
                    </Link>
                  )}

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

                  <Link
                    href="/contact"
                    style={styles.secondaryButton}
                  >
                    온라인 문의
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
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
    fontSize: "17px",
    color: "#475569",
    marginTop: "14px",
    lineHeight: 1.8,
  },

  list: {
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
  },

  mapImage: {
    width: "100%",
    display: "block",
  },

  info: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  branchName: {
    fontSize: "32px",
    fontWeight: 900,
    margin: "0 0 22px",
  },

  branchNameLink: {
    color: "#111827",
    textDecoration: "none",
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

  detailButton: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "13px 18px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 800,
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
}