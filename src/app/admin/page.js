"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const emptyCase = {
  title: "",
  slug: "",
  branch: "강변점",
  category: "",
  device: "",
  model: "",
  symptom: "",
  repair_summary: "",
  content: "",
  seo_keyword: "",
  image_url: "",
  is_published: true,
}

export default function AdminPage() {
  const [isLogin, setIsLogin] = useState(false)

  useEffect(() => {
    setIsLogin(localStorage.getItem("homepageAdminLogin") === "true")
  }, [])
  const [login, setLogin] = useState({ id: "", password: "" })
  const [activeMenu, setActiveMenu] = useState("repairCases")

  const handleLogin = (e) => {
    e.preventDefault()
    if (login.id === "admin" && login.password === "1234") {
      localStorage.setItem("homepageAdminLogin", "true")
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
        <button style={menuStyle(false)} onClick={() => window.location.href = "/admin/repair-cases"}>
          수리사례등록
        </button>
        <button style={menuStyle(activeMenu === "inquiries")} onClick={() => { window.location.href = "/admin/online-inquiries" }}>
          온라인접수조회
        </button>
        <button style={menuStyle(activeMenu === "notice")} onClick={() => setActiveMenu("notice")}>
          공지/팝업관리
        </button>

        <button
          style={styles.logoutButton}
          onClick={() => {
            localStorage.removeItem("homepageAdminLogin")
            setIsLogin(false)
          }}
        >
          로그아웃
        </button>
      </aside>

      <section style={styles.content}>
        {activeMenu === "branches" && <BranchManager />}
        {activeMenu === "repairCases" && <EmptyManager title="수리사례등록" />}
        {activeMenu === "inquiries" && <EmptyManager title="온라인접수조회" />}
        {activeMenu === "notice" && <EmptyManager title="공지/팝업관리" />}
      </section>
    </main>
  )
}

function RepairCaseManager() {
  const [cases, setCases] = useState([])
  const [form, setForm] = useState(emptyCase)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadCases = async () => {
    const { data, error } = await supabase
      .from("repair_cases")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      alert("수리사례를 불러오지 못했어: " + error.message)
      return
    }

    setCases(data || [])
  }

  useEffect(() => {
    loadCases()
  }, [])

  const makeSlug = (text) => {
    return text
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w가-힣-]/g, "")
      .toLowerCase()
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === "title") {
      setForm((prev) => ({
        ...prev,
        title: value,
        slug: prev.slug || makeSlug(value),
      }))
      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.title.trim()) return alert("제목을 입력해줘.")
    if (!form.slug.trim()) return alert("slug를 입력해줘.")

    setLoading(true)

    const payload = {
      ...form,
      slug: makeSlug(form.slug),
    }

    const result = editingId
      ? await supabase.from("repair_cases").update(payload).eq("id", editingId)
      : await supabase.from("repair_cases").insert([payload])

    setLoading(false)

    if (result.error) {
      alert("저장 실패: " + result.error.message)
      return
    }

    alert(editingId ? "수리사례가 수정됐어." : "수리사례가 등록됐어.")
    setForm(emptyCase)
    setEditingId(null)
    loadCases()
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setForm({
      title: item.title || "",
      slug: item.slug || "",
      branch: item.branch || "강변점",
      category: item.category || "",
      device: item.device || "",
      model: item.model || "",
      symptom: item.symptom || "",
      repair_summary: item.repair_summary || "",
      content: item.content || "",
      seo_keyword: item.seo_keyword || "",
      image_url: item.image_url || "",
      is_published: item.is_published ?? true,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id) => {
    if (!confirm("정말 삭제할까?")) return

    const { error } = await supabase.from("repair_cases").delete().eq("id", id)

    if (error) {
      alert("삭제 실패: " + error.message)
      return
    }

    alert("삭제됐어.")
    loadCases()
  }

  return (
    <div>
      <h1 style={styles.contentTitle}>수리사례등록</h1>
      <p style={styles.contentDesc}>수리사례를 등록하면 홈페이지 수리사례 페이지에 노출돼.</p>

      <form onSubmit={handleSubmit} style={styles.formBox}>
        <div style={styles.formGrid}>
          <input name="title" value={form.title} onChange={handleChange} placeholder="제목" style={styles.input} />
          <input name="slug" value={form.slug} onChange={handleChange} placeholder="주소 slug" style={styles.input} />

          <select name="branch" value={form.branch} onChange={handleChange} style={styles.input}>
            <option>강변점</option>
            <option>선릉점</option>
            <option>신도림점</option>
          </select>

          <input name="category" value={form.category} onChange={handleChange} placeholder="분류 예: 애플, 마이크로소프트" style={styles.input} />
          <input name="device" value={form.device} onChange={handleChange} placeholder="기기 예: 아이폰, 아이패드, 서피스" style={styles.input} />
          <input name="model" value={form.model} onChange={handleChange} placeholder="모델명" style={styles.input} />
          <input name="symptom" value={form.symptom} onChange={handleChange} placeholder="증상" style={styles.input} />
          <input name="seo_keyword" value={form.seo_keyword} onChange={handleChange} placeholder="SEO 키워드" style={styles.input} />
          <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="대표 이미지 URL" style={styles.input} />
        </div>

        <textarea
          name="repair_summary"
          value={form.repair_summary}
          onChange={handleChange}
          placeholder="수리 요약"
          style={styles.textarea}
        />

        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="본문 내용"
          style={{ ...styles.textarea, minHeight: "180px" }}
        />

        <label style={styles.checkboxRow}>
          <input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} />
          홈페이지에 공개
        </label>

        <div style={styles.buttonRow}>
          <button type="submit" style={styles.primaryButton} disabled={loading}>
            {loading ? "저장 중..." : editingId ? "수정 저장" : "수리사례 등록"}
          </button>

          {editingId && (
            <button
              type="button"
              style={styles.cancelButton}
              onClick={() => {
                setEditingId(null)
                setForm(emptyCase)
              }}
            >
              취소
            </button>
          )}
        </div>
      </form>

      <div style={styles.tableBox}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>제목</th>
              <th style={styles.th}>지점</th>
              <th style={styles.th}>기기</th>
              <th style={styles.th}>공개</th>
              <th style={styles.th}>관리</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((item) => (
              <tr key={item.id}>
                <td style={styles.td}>{item.title}</td>
                <td style={styles.td}>{item.branch}</td>
                <td style={styles.td}>{item.device}</td>
                <td style={styles.td}>{item.is_published ? "공개" : "비공개"}</td>
                <td style={styles.td}>
                  <button style={styles.smallButton} onClick={() => handleEdit(item)}>수정</button>
                  <button style={styles.deleteButton} onClick={() => handleDelete(item.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BranchManager() {
  return (
    <div>
      <h1 style={styles.contentTitle}>지점관리</h1>
      <p style={styles.contentDesc}>지점 정보 수정 기능은 다음 단계에서 연결하면 돼.</p>
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
  loginPage: { minHeight: "100vh", backgroundColor: "#f4f8fc", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  loginBox: { width: "380px", backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "24px", padding: "28px", boxShadow: "0 18px 45px rgba(15,23,42,0.08)" },
  title: { fontSize: "28px", fontWeight: 900, margin: "0 0 8px" },
  desc: { color: "#64748b", marginBottom: "20px" },
  input: { width: "100%", padding: "13px", border: "1px solid #cbd5e1", borderRadius: "12px", fontSize: "15px", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "13px", border: "1px solid #cbd5e1", borderRadius: "12px", fontSize: "15px", boxSizing: "border-box", marginTop: "10px" },
  primaryButton: { padding: "13px 18px", border: "none", borderRadius: "12px", backgroundColor: "#2563eb", color: "#fff", fontWeight: 900, cursor: "pointer" },
  cancelButton: { padding: "13px 18px", border: "1px solid #cbd5e1", borderRadius: "12px", backgroundColor: "#fff", fontWeight: 900, cursor: "pointer" },
  hint: { fontSize: "13px", color: "#64748b", marginTop: "14px" },
  page: { minHeight: "100vh", display: "grid", gridTemplateColumns: "240px 1fr", backgroundColor: "#f4f8fc" },
  sidebar: { backgroundColor: "#fff", borderRight: "1px solid #e2e8f0", padding: "24px", display: "flex", flexDirection: "column", gap: "10px" },
  logo: { fontSize: "22px", fontWeight: 900, marginBottom: "18px" },
  logoutButton: { marginTop: "auto", padding: "12px", border: "1px solid #fecaca", borderRadius: "10px", backgroundColor: "#fff", color: "#dc2626", fontWeight: 800, cursor: "pointer" },
  content: { padding: "34px" },
  contentTitle: { fontSize: "32px", fontWeight: 900, margin: "0 0 8px" },
  contentDesc: { color: "#64748b", marginBottom: "24px" },
  formBox: { backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "22px", padding: "20px", marginBottom: "24px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" },
  checkboxRow: { display: "flex", gap: "8px", alignItems: "center", marginTop: "12px", fontWeight: 800 },
  buttonRow: { display: "flex", gap: "10px", marginTop: "14px" },
  tableBox: { backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "22px", overflow: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { backgroundColor: "#f8fafc", padding: "12px", borderBottom: "1px solid #e2e8f0", textAlign: "left" },
  td: { padding: "12px", borderBottom: "1px solid #e2e8f0" },
  smallButton: { padding: "7px 10px", marginRight: "6px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#fff", cursor: "pointer" },
  deleteButton: { padding: "7px 10px", border: "none", borderRadius: "8px", backgroundColor: "#ef4444", color: "#fff", cursor: "pointer" },
}
