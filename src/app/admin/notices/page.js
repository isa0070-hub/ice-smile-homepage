"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const emptyForm = {
  title: "",
  content: "",
  button_text: "",
  button_link: "",
  image_url: "",
  popup_position: "center",
  is_popup: true,
  is_active: true,
  start_date: "",
  end_date: "",
  sort_order: 0,
}

export default function AdminNoticesPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadItems = async () => {
    const { data, error } = await supabase
      .from("homepage_notices")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) {
      alert("공지/팝업을 불러오지 못했습니다: " + error.message)
      return
    }

    setItems(data || [])
  }

  useEffect(() => {
    loadItems()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const saveNotice = async (e) => {
    e.preventDefault()

    if (!form.title.trim()) return alert("제목을 입력해 주세요.")

    setLoading(true)

    const payload = {
      title: form.title,
      content: form.content,
      button_text: form.button_text,
      button_link: form.button_link,
      image_url: form.image_url,
      popup_position: form.popup_position,
      is_popup: form.is_popup,
      is_active: form.is_active,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      sort_order: Number(form.sort_order || 0),
    }

    const result = editingId
      ? await supabase.from("homepage_notices").update(payload).eq("id", editingId)
      : await supabase.from("homepage_notices").insert([payload])

    setLoading(false)

    if (result.error) {
      alert("저장 실패: " + result.error.message)
      return
    }

    alert(editingId ? "수정되었습니다." : "등록되었습니다.")
    resetForm()
    loadItems()
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setForm({
      title: item.title || "",
      content: item.content || "",
      button_text: item.button_text || "",
      button_link: item.button_link || "",
      image_url: item.image_url || "",
      popup_position: item.popup_position || "center",
      is_popup: item.is_popup ?? true,
      is_active: item.is_active ?? true,
      start_date: item.start_date || "",
      end_date: item.end_date || "",
      sort_order: item.sort_order || 0,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const deleteNotice = async (id) => {
    if (!confirm("정말 삭제할까요?")) return

    const { error } = await supabase.from("homepage_notices").delete().eq("id", id)

    if (error) {
      alert("삭제 실패: " + error.message)
      return
    }

    alert("삭제되었습니다.")
    loadItems()
  }

  return (
    <main style={styles.page}>
      <div style={styles.topButtons}>
        <a href="/admin" style={styles.backButton}>← 관리자 메인</a>
        <a href="/" style={styles.linkButton}>홈페이지 보기</a>
      </div>

      <h1 style={styles.title}>공지 / 팝업 관리</h1>
      <p style={styles.desc}>홈페이지 접속 시 보여줄 공지와 팝업을 등록하고 관리할 수 있습니다.</p>

      <form onSubmit={saveNotice} style={styles.formBox}>
        <h2 style={styles.subTitle}>{editingId ? "공지/팝업 수정" : "공지/팝업 등록"}</h2>

        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="제목"
          style={styles.input}
        />

        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="내용"
          style={styles.textarea}
        />

        <div style={styles.grid}>
          <input
            name="button_text"
            value={form.button_text}
            onChange={handleChange}
            placeholder="버튼 문구 예: 자세히 보기"
            style={styles.input}
          />

          <input
            name="button_link"
            value={form.button_link}
            onChange={handleChange}
            placeholder="버튼 링크 예: /repair-cases"
            style={styles.input}
          />

          <input
            name="image_url"
            value={form.image_url}
            onChange={handleChange}
            placeholder="팝업 이미지 URL 예: /images/event-popup.jpg"
            style={styles.input}
          />

          <select
            name="popup_position"
            value={form.popup_position}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="center">가운데</option>
            <option value="right-bottom">오른쪽 아래</option>
            <option value="left-bottom">왼쪽 아래</option>
            <option value="right-top">오른쪽 위</option>
            <option value="left-top">왼쪽 위</option>
          </select>

          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            type="number"
            name="sort_order"
            value={form.sort_order}
            onChange={handleChange}
            placeholder="정렬순서"
            style={styles.input}
          />
        </div>

        <div style={styles.checkWrap}>
          <label style={styles.checkLabel}>
            <input type="checkbox" name="is_popup" checked={form.is_popup} onChange={handleChange} />
            팝업으로 표시
          </label>

          <label style={styles.checkLabel}>
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
            사용
          </label>
        </div>

        <div style={styles.buttonRow}>
          <button type="submit" disabled={loading} style={styles.saveButton}>
            {loading ? "저장 중..." : editingId ? "수정 저장" : "등록"}
          </button>

          {editingId && (
            <button type="button" onClick={resetForm} style={styles.cancelButton}>
              취소
            </button>
          )}
        </div>
      </form>

      <section style={styles.listBox}>
        <h2 style={styles.subTitle}>등록 목록</h2>

        {items.length === 0 && <p style={styles.empty}>등록된 공지/팝업이 없습니다.</p>}

        {items.map((item) => (
          <article key={item.id} style={styles.noticeCard}>
            <div>
              <h3 style={styles.noticeTitle}>{item.title}</h3>
              <p style={styles.noticeContent}>{item.content}</p>
              <p style={styles.meta}>
                {item.is_active ? "사용중" : "미사용"} / {item.is_popup ? "팝업" : "공지"} / 위치 {item.popup_position || "center"} / 정렬 {item.sort_order || 0}
              </p>
              {(item.start_date || item.end_date) && (
                <p style={styles.meta}>
                  기간: {item.start_date || "시작일 없음"} ~ {item.end_date || "종료일 없음"}
                </p>
              )}
            </div>

            <div style={styles.actionButtons}>
              <button type="button" onClick={() => startEdit(item)} style={styles.editButton}>수정</button>
              <button type="button" onClick={() => deleteNotice(item.id)} style={styles.deleteButton}>삭제</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f4f8fc", padding: "34px" },
  topButtons: { display: "flex", gap: "10px", marginBottom: "18px" },
  backButton: { padding: "10px 14px", borderRadius: "10px", backgroundColor: "#f1f5f9", color: "#111827", textDecoration: "none", fontWeight: 800, border: "1px solid #cbd5e1" },
  linkButton: { padding: "10px 14px", borderRadius: "10px", backgroundColor: "#2563eb", color: "#fff", textDecoration: "none", fontWeight: 800 },
  title: { fontSize: "34px", fontWeight: 900, margin: "0 0 8px" },
  desc: { color: "#64748b", marginBottom: "22px" },
  subTitle: { fontSize: "20px", fontWeight: 900, margin: "0 0 14px" },
  formBox: { backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "22px", padding: "22px", marginBottom: "24px", boxShadow: "0 14px 35px rgba(15,23,42,0.06)" },
  input: { width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "12px", fontSize: "15px", boxSizing: "border-box" },
  textarea: { width: "100%", minHeight: "130px", marginTop: "10px", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "12px", fontSize: "15px", boxSizing: "border-box" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginTop: "10px" },
  checkWrap: { display: "flex", gap: "18px", marginTop: "14px" },
  checkLabel: { display: "flex", alignItems: "center", gap: "8px", fontWeight: 800 },
  buttonRow: { display: "flex", gap: "10px", marginTop: "16px" },
  saveButton: { padding: "12px 18px", border: "none", borderRadius: "12px", backgroundColor: "#2563eb", color: "#fff", fontWeight: 900, cursor: "pointer" },
  cancelButton: { padding: "12px 18px", border: "1px solid #cbd5e1", borderRadius: "12px", backgroundColor: "#fff", fontWeight: 900, cursor: "pointer" },
  listBox: { backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "22px", padding: "22px" },
  empty: { color: "#64748b" },
  noticeCard: { display: "flex", justifyContent: "space-between", gap: "16px", borderTop: "1px solid #e2e8f0", padding: "16px 0" },
  noticeTitle: { fontSize: "18px", fontWeight: 900, margin: "0 0 8px" },
  noticeContent: { color: "#334155", whiteSpace: "pre-line", margin: "0 0 8px" },
  meta: { color: "#64748b", fontSize: "13px", margin: "4px 0" },
  actionButtons: { display: "flex", gap: "8px", alignItems: "flex-start" },
  editButton: { padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#fff", cursor: "pointer" },
  deleteButton: { padding: "8px 10px", border: "none", borderRadius: "8px", backgroundColor: "#ef4444", color: "#fff", cursor: "pointer" },
}
