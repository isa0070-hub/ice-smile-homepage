import { supabase } from "@/lib/supabase"

export default async function BranchesPage() {
  const { data: branches } = await supabase
    .from("branches")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.breadcrumb}>홈 &gt; 지점안내</p>
        <h1 style={styles.title}>아이스마일어게인 지점안내</h1>
        <p style={styles.subtitle}>
          가까운 지점의 약도, 주소, 연락처, 방문 안내를 확인하실 수 있습니다.
        </p>
      </section>

      <section style={styles.list}>
        {(branches || []).map((branch) => (
          <article key={branch.id} className="branch-card" style={styles.card}>
            <div style={styles.mapBox}>
              <img
                src={branch.map_image}
                alt={`${branch.name} 약도`}
                style={styles.mapImage}
              />
            </div>

            <div style={styles.info}>
              <h2 style={styles.branchName}>{branch.name}</h2>

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
                <a
                  href={branch.naver_map}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.primaryButton}
                >
                  네이버지도 보기
                </a>

                <a href={`tel:${branch.phone}`} style={styles.secondaryButton}>
                  전화 문의
                </a>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

const styles = {
  page: {
    backgroundColor: "#f4f8fc",
    minHeight: "100vh",
    padding: "48px 24px 80px",
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
  title: {
    fontSize: "42px",
    fontWeight: 900,
    margin: 0,
  },
  subtitle: {
    fontSize: "17px",
    color: "#475569",
    marginTop: "14px",
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
    backgroundColor: "#fff",
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
    color: "#fff",
    padding: "13px 18px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 800,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    color: "#1d4ed8",
    padding: "13px 18px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 800,
    border: "1px solid #bfdbfe",
  },
}
