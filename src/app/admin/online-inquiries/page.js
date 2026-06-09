"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function OnlineInquiriesAdminPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const loadItems = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("online_inquiries")
      .select("*")
      .order("created_at", { ascending: false })

    setLoading(false)

    if (error) {
      alert("온라인 접수 목록을 불러오지 못했습니다: " + error.message)
      return
    }

    setItems(data || [])
  }

  useEffect(() => {
    loadItems()
  }, [])

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from("online_inquiries")
      .update({ status })
      .eq("id", id)

    if (error) {
      alert("상태 변경 실패: " + error.message)
      return
    }

    loadItems()
  }

  const deleteItem = async (id) => {
    if (!confirm("정말 삭제할까?")) return

    const { error } = await supabase
      .from("online_inquiries")
      .delete()
      .eq("id", id)

    if (error) {
      alert("삭제 실패: " + error.message)
      return
    }

    loadItems()
  }

  return (
    <main style={styles.page}>
      <div style={styles.topButtons}>
        <a href="/admin" style={styles.backButton}>← 관리자 메인</a>
        <a href="/contact" style={styles.linkButton}>온라인 접수 페이지 보기</a>
      </div>

      <h1 style={styles.title}>온라인접수조회</h1>
      <p style={styles.desc}>홈페이지에서 접수된 고객 문의를 확인하고 상태를 변경할 수 있습니다.</p>

      <div style={styles.tableBox}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>접수일</th>
              <th style={styles.th}>성함</th>
              <th style={styles.th}>연락처</th>
              <th style={styles.th}>희망지점</th>
              <th style={styles.th}>기기/모델</th>
              <th style={styles.th}>증상</th>
              <th style={styles.th}>상태</th>
              <th style={styles.th}>관리</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={styles.empty}>불러오는 중...</td>
              </tr>
            )}

            {!loading && items.map((item) => (
              <tr key={item.id}>
                <td style={styles.td}>{new Date(item.created_at).toLocaleString("ko-KR")}</td>
                <td style={styles.td}>{item.customer_name}</td>
                <td style={styles.td}>
                  <a href={`tel:${item.phone}`} style={styles.phone}>{item.phone}</a>
                </td>
                <td style={styles.td}>{item.preferred_branch}</td>
                <td style={styles.td}>
                  {item.device || "-"}
                  <br />
                  {item.model || "-"}
                </td>
                <td style={styles.td}>
                  <strong>{item.symptom}</strong>
                  {item.contact_time && <><br />연락가능: {item.contact_time}</>}
                  {item.memo && <><br />메모: {item.memo}</>}
                </td>
                <td style={styles.td}>
                  <select value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)} style={styles.select}>
                    <option>접수대기</option>
                    <option>확인중</option>
                    <option>연락완료</option>
                    <option>처리완료</option>
                  </select>
                </td>
                <td style={styles.td}>
                  <button onClick={() => deleteItem(item.id)} style={styles.deleteButton}>삭제</button>
                </td>
              </tr>
            ))}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={8} style={styles.empty}>접수된 문의가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f4f8fc",
    padding: "34px",
  },
  topButtons: {
    display: "flex",
    gap: "10px",
    marginBottom: "18px",
  },
  backButton: {
    padding: "10px 14px",
    borderRadius: "10px",
    backgroundColor: "#f1f5f9",
    color: "#111827",
    textDecoration: "none",
    fontWeight: 800,
    border: "1px solid #cbd5e1",
  },
  linkButton: {
    padding: "10px 14px",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 800,
  },
  title: {
    fontSize: "34px",
    fontWeight: 900,
    margin: "0 0 8px",
  },
  desc: {
    color: "#64748b",
    marginBottom: "22px",
  },
  tableBox: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    overflow: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1000px",
  },
  th: {
    backgroundColor: "#f8fafc",
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "left",
    fontSize: "14px",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "top",
    fontSize: "14px",
  },
  phone: {
    color: "#1d4ed8",
    fontWeight: 900,
    textDecoration: "none",
  },
  select: {
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
  },
  deleteButton: {
    padding: "8px 10px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#ef4444",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  empty: {
    padding: "24px",
    textAlign: "center",
    color: "#64748b",
  },
}
