"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)

  const loadBranches = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .order("sort_order", { ascending: true })

    setLoading(false)

    if (error) {
      alert("지점 정보를 불러오지 못했습니다: " + error.message)
      return
    }

    setBranches(data || [])
  }

  useEffect(() => {
    loadBranches()
  }, [])

  const updateBranch = (id, field, value) => {
    setBranches((prev) =>
      prev.map((branch) =>
        branch.id === id ? { ...branch, [field]: value } : branch
      )
    )
  }

  const saveBranch = async (branch) => {
    const { error } = await supabase
      .from("branches")
      .update({
        name: branch.name,
        phone: branch.phone,
        address1: branch.address1,
        address2: branch.address2,
        visit_info: branch.visit_info,
        naver_map: branch.naver_map,
        map_image: branch.map_image,
        is_active: branch.is_active,
        sort_order: Number(branch.sort_order || 0),
      })
      .eq("id", branch.id)

    if (error) {
      alert("저장 실패: " + error.message)
      return
    }

    alert("지점 정보가 저장되었습니다.")
    loadBranches()
  }

  return (
    <main style={styles.page}>
      <div style={styles.topButtons}>
        <a href="/admin" style={styles.backButton}>
          ← 관리자 메인
        </a>
        <a href="/branches" style={styles.linkButton}>
          지점안내 페이지 보기
        </a>
      </div>

      <h1 style={styles.title}>지점관리</h1>
      <p style={styles.desc}>
        지점 주소, 전화번호, 방문안내, 네이버지도 링크, 약도 이미지를 수정할 수 있습니다.
      </p>

      {loading && <p>불러오는 중...</p>}

      <div style={styles.list}>
        {branches.map((branch) => (
          <section key={branch.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.branchTitle}>{branch.name}</h2>

              <label style={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={branch.is_active}
                  onChange={(e) =>
                    updateBranch(branch.id, "is_active", e.target.checked)
                  }
                />
                공개
              </label>
            </div>

            {branch.map_image && (
              <img
                src={branch.map_image}
                alt={`${branch.name} 약도`}
                style={styles.mapPreview}
              />
            )}

            <div style={styles.grid}>
              <input
                value={branch.name || ""}
                onChange={(e) => updateBranch(branch.id, "name", e.target.value)}
                placeholder="지점명"
                style={styles.input}
              />

              <input
                value={branch.phone || ""}
                onChange={(e) => updateBranch(branch.id, "phone", e.target.value)}
                placeholder="전화번호"
                style={styles.input}
              />

              <input
                value={branch.address1 || ""}
                onChange={(e) =>
                  updateBranch(branch.id, "address1", e.target.value)
                }
                placeholder="주소 1"
                style={styles.input}
              />

              <input
                value={branch.address2 || ""}
                onChange={(e) =>
                  updateBranch(branch.id, "address2", e.target.value)
                }
                placeholder="주소 2"
                style={styles.input}
              />

              <input
                value={branch.naver_map || ""}
                onChange={(e) =>
                  updateBranch(branch.id, "naver_map", e.target.value)
                }
                placeholder="네이버지도 링크"
                style={styles.input}
              />

              <input
                value={branch.map_image || ""}
                onChange={(e) =>
                  updateBranch(branch.id, "map_image", e.target.value)
                }
                placeholder="약도 이미지 경로"
                style={styles.input}
              />

              <input
                type="number"
                value={branch.sort_order || 0}
                onChange={(e) =>
                  updateBranch(branch.id, "sort_order", e.target.value)
                }
                placeholder="정렬순서"
                style={styles.input}
              />
            </div>

            <textarea
              value={branch.visit_info || ""}
              onChange={(e) =>
                updateBranch(branch.id, "visit_info", e.target.value)
              }
              placeholder="방문안내"
              style={styles.textarea}
            />

            <button
              type="button"
              onClick={() => saveBranch(branch)}
              style={styles.saveButton}
            >
              저장
            </button>
          </section>
        ))}
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
  list: {
    display: "grid",
    gap: "22px",
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 14px 35px rgba(15,23,42,0.06)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  branchTitle: {
    fontSize: "24px",
    fontWeight: 900,
    margin: 0,
  },
  checkLabel: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    fontWeight: 800,
  },
  mapPreview: {
    width: "100%",
    maxWidth: "520px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    marginBottom: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "10px",
  },
  input: {
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    fontSize: "15px",
  },
  textarea: {
    width: "100%",
    minHeight: "90px",
    marginTop: "10px",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  saveButton: {
    marginTop: "12px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "12px",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
}
