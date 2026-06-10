"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function HomeNoticePopup() {
  const [notice, setNotice] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const loadNotice = async () => {
      const today = new Date().toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from("homepage_notices")
        .select("*")
        .eq("is_active", true)
        .eq("is_popup", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })

      if (error || !data || data.length === 0) return

      const validNotice = data.find((item) => {
        const startOk = !item.start_date || item.start_date <= today
        const endOk = !item.end_date || item.end_date >= today
        return startOk && endOk
      })

      if (!validNotice) return

      const hiddenId = localStorage.getItem("hideNoticeToday")
      const hiddenDate = localStorage.getItem("hideNoticeDate")

      if (hiddenId === String(validNotice.id) && hiddenDate === today) return

      setNotice(validNotice)
      setIsOpen(true)
    }

    loadNotice()
  }, [])

  const closeToday = () => {
    const today = new Date().toISOString().slice(0, 10)

    if (notice) {
      localStorage.setItem("hideNoticeToday", String(notice.id))
      localStorage.setItem("hideNoticeDate", today)
    }

    setIsOpen(false)
  }

  if (!isOpen || !notice) return null

  return (
    <div style={getOverlayStyle(notice.popup_position)}>
      <div style={styles.popup}>
        <button type="button" onClick={() => setIsOpen(false)} style={styles.closeButton}>
          ×
        </button>

        {notice.image_url && (
          <img src={notice.image_url} alt={notice.title} style={styles.image} />
        )}

        <h2 style={styles.title}>{notice.title}</h2>
        <p style={styles.content}>{notice.content}</p>

        {notice.button_text && notice.button_link && (
          <a href={notice.button_link} style={styles.mainButton}>
            {notice.button_text}
          </a>
        )}

        <button type="button" onClick={closeToday} style={styles.todayButton}>
          오늘 하루 보지 않기
        </button>
      </div>
    </div>
  )
}

function getOverlayStyle(position) {
  const base = {
    position: "fixed",
    inset: 0,
    zIndex: 20000,
    backgroundColor: position === "center" ? "rgba(15,23,42,0.55)" : "transparent",
    display: "flex",
    padding: "24px",
    pointerEvents: "none",
  }

  if (position === "right-bottom") {
    return { ...base, alignItems: "flex-end", justifyContent: "flex-end" }
  }

  if (position === "left-bottom") {
    return { ...base, alignItems: "flex-end", justifyContent: "flex-start" }
  }

  if (position === "right-top") {
    return { ...base, alignItems: "flex-start", justifyContent: "flex-end", paddingTop: "98px" }
  }

  if (position === "left-top") {
    return { ...base, alignItems: "flex-start", justifyContent: "flex-start", paddingTop: "98px" }
  }

  return { ...base, alignItems: "center", justifyContent: "center" }
}

const styles = {
  popup: {
    pointerEvents: "auto",
    position: "relative",
    width: "100%",
    maxWidth: "460px",
    backgroundColor: "#fff",
    borderRadius: "26px",
    padding: "30px",
    boxShadow: "0 24px 70px rgba(15,23,42,0.28)",
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    top: "14px",
    right: "14px",
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: "1px solid #e2e8f0",
    backgroundColor: "#fff",
    fontSize: "24px",
    cursor: "pointer",
    zIndex: 1,
  },
  image: {
    width: "100%",
    borderRadius: "18px",
    marginBottom: "16px",
    border: "1px solid #e5e7eb",
  },
  title: {
    fontSize: "26px",
    fontWeight: 900,
    margin: "12px 0 12px",
  },
  content: {
    color: "#334155",
    whiteSpace: "pre-line",
    lineHeight: 1.7,
    marginBottom: "20px",
  },
  mainButton: {
    display: "block",
    backgroundColor: "#2563eb",
    color: "#fff",
    padding: "13px 16px",
    borderRadius: "13px",
    textDecoration: "none",
    fontWeight: 900,
    marginBottom: "10px",
  },
  todayButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 700,
  },
}
