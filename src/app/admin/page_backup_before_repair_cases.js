"use client"

import { useState } from "react"

export default function AdminPage() {
  const [isLogin, setIsLogin] = useState(false)
  const [login, setLogin] = useState({ id: "", password: "" })
  const [activeMenu, setActiveMenu] = useState("branches")

  const handleLogin = (e) => {
    e.preventDefault()

    if (login.id === "admin" && login.password === "1234") {
      setIsLogin(true)
      return
    }

    alert("아이디 또는 비밀번호가 맞지 않아.")
  }

  if (!isLogin) {
    return (
      <main style={styles.loginPage}>
        <form onSubmit={handleLogin} style={styles.loginBox}>
          <h1 style={styles.title}>홈페이지 관리자</h1>
          <p style={styles.desc}>관리자 로그인 후 홈페이지 내용을 관리할 수 있어.</p>

          <input
            value={login.id}
            onChange={(e) => setLogin({ ...login, id: e.target.value })}
            placeholder="아이디"
            style={styles.input}
          />

          <input
            type="password"
            value={login.password}
            onChange={(e) => setLogin({ ...login, password: e.target.value })}
            placeholder="비밀번호"
            style={styles.input}
          />

          <button style={styles.primaryButton}>로그인</button>

          <p style={styles.hint}>임시 계정: admin / 1234</p>
        </form>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>관리자 모드</h2>

        <button style={menuStyle(activeMenu === "branches")} onClick={() => setActiveMenu("branches")}>
          지점관리
        </button>
        <button style={menuStyle(activeMenu === "repairCases")} onClick={() => setActiveMenu("repairCases")}>
          수리사례관리
        </button>
        <button style={menuStyle(activeMenu === "inquiries")} onClick={() => setActiveMenu("inquiries")}>
          온라인접수조회
        </button>
        <button style={menuStyle(activeMenu === "notice")} onClick={() => setActiveMenu("notice")}>
          공지/팝업관리
        </button>

        <button style={styles.logoutButton} onClick={() => setIsLogin(false)}>
          로그아웃
        </button>
      </aside>

      <section style={styles.content}>
        {activeMenu === "branches" && <BranchManager />}
        {activeMenu === "repairCases" && <EmptyManager title="수리사례관리" />}
        {activeMenu === "inquiries" && <EmptyManager title="온라인접수조회" />}
        {activeMenu === "notice" && <EmptyManager title="공지/팝업관리" />}
      </section>
    </main>
  )
}

function BranchManager() {
  const branches = [
    {
      name: "강변점",
      phone: "02-3424-5295",
      address: "서울특별시 광진구 광나루로56길 85 강변테크노마트 5층 B-20호",
      map: "/images/map-gangbyeon.svg",
    },
    {
      name: "선릉점",
      phone: "02-554-5295",
      address: "서울특별시 강남구 테헤란로 406 샹제리제센터 A동 406호",
      map: "/images/map-seolleung.svg",
    },
    {
      name: "신도림점",
      phone: "02-2111-8899",
      address: "서울특별시 구로구 새말로 97 신도림테크노마트 9층 57-1번 기둥",
      map: "/images/map-sindorim.svg",
    },
  ]

  return (
    <div>
      <h1 style={styles.contentTitle}>지점관리</h1>
      <p style={styles.contentDesc}>현재는 지점 정보 확인용이야. 다음 단계에서 수정/저장 기능을 붙이면 돼.</p>

      <div style={styles.cardGrid}>
        {branches.map((branch) => (
          <div key={branch.name} style={styles.card}>
            <img src={branch.map} alt={`${branch.name} 약도`} style={styles.mapImage} />
            <h2>{branch.name}</h2>
            <p><strong>전화:</strong> {branch.phone}</p>
            <p><strong>주소:</strong> {branch.address}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyManager({ title }) {
  return (
    <div>
      <h1 style={styles.contentTitle}>{title}</h1>
      <p style={styles.contentDesc}>이 메뉴는 다음 단계에서 관리 기능을 연결하면 돼.</p>
    </div>
  )
}

const menuStyle = (active) => ({
  width: "100%",
  padding: "12px",
  border: "none",
  borderRadius: "10px",
  backgroundColor: active ? "#2563eb" : "#f1f5f9",
  color: active ? "#fff" : "#111827",
  fontWeight: 800,
  cursor: "pointer",
  textAlign: "left",
})

const styles = {
  loginPage: {
    minHeight: "100vh",
    backgroundColor: "#f4f8fc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  loginBox: {
    width: "380px",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
  },
  title: {
    fontSize: "28px",
    fontWeight: 900,
    margin: "0 0 8px",
  },
  desc: {
    color: "#64748b",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "13px",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    marginBottom: "10px",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  primaryButton: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "12px",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  hint: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "14px",
  },
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    backgroundColor: "#f4f8fc",
  },
  sidebar: {
    backgroundColor: "#fff",
    borderRight: "1px solid #e2e8f0",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  logo: {
    fontSize: "22px",
    fontWeight: 900,
    marginBottom: "18px",
  },
  logoutButton: {
    marginTop: "auto",
    padding: "12px",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    backgroundColor: "#fff",
    color: "#dc2626",
    fontWeight: 800,
    cursor: "pointer",
  },
  content: {
    padding: "34px",
  },
  contentTitle: {
    fontSize: "32px",
    fontWeight: 900,
    margin: "0 0 8px",
  },
  contentDesc: {
    color: "#64748b",
    marginBottom: "24px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
  },
  mapImage: {
    width: "100%",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
  },
}
