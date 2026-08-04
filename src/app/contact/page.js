"use client"

import { useState } from "react"
import Link from "next/link"
import { trackNaverLead } from "@/components/NaverConversionTracker"

export default function ContactPage() {
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    device: "",
    model: "",
    symptom: "",
    preferred_branch: "강변점",
    contact_time: "",
    memo: "",
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.customer_name.trim()) return alert("성함을 입력해 주세요.")
    if (!form.phone.trim()) return alert("연락처를 입력해 주세요.")
    if (!form.symptom.trim()) return alert("증상을 입력해 주세요.")

    setLoading(true)

    const response = await fetch("/api/online-inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const result = await response.json()

    setLoading(false)

if (!response.ok) {
  alert(result.message || "접수 저장에 실패했습니다.")
  return
}

await fetch("/api/send-telegram", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(form),
})

alert("온라인 접수가 완료되었습니다. 확인 후 연락드리겠습니다.")

trackNaverLead()
window.location.href = "/"
return

    setForm({
      customer_name: "",
      phone: "",
      device: "",
      model: "",
      symptom: "",
      preferred_branch: "강변점",
      contact_time: "",
      memo: "",
    })
  }

  return (
    <main style={styles.page}>
      <section style={styles.box}>
  <Link href="/" style={styles.backButton}>
    ← 홈페이지로 돌아가기
  </Link>

  <h1 style={styles.title}>온라인 접수</h1>
        <p style={styles.desc}>수리 문의 내용을 남겨주시면 확인 후 빠르게 연락드리겠습니다.</p>

        <form method="post" onSubmit={handleSubmit} style={styles.form}>
          <label htmlFor="contact-name" style={styles.label}>성함 <span aria-hidden="true">*</span></label>
          <input id="contact-name" name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="성함" autoComplete="name" required style={styles.input} />
          <label htmlFor="contact-phone" style={styles.label}>연락처 <span aria-hidden="true">*</span></label>
          <input id="contact-phone" type="tel" inputMode="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="010-0000-0000" autoComplete="tel" required style={styles.input} />

          <label htmlFor="contact-branch" style={styles.label}>희망 지점</label>
          <select id="contact-branch" name="preferred_branch" value={form.preferred_branch} onChange={handleChange} style={styles.input}>
            <option>강변점</option>
            <option>선릉점</option>
            <option>신도림점</option>
          </select>

          <label htmlFor="contact-device" style={styles.label}>기기 종류</label>
          <input id="contact-device" name="device" value={form.device} onChange={handleChange} placeholder="예: 아이폰, 아이패드, 맥북, 서피스" style={styles.input} />
          <label htmlFor="contact-model" style={styles.label}>모델명</label>
          <input id="contact-model" name="model" value={form.model} onChange={handleChange} placeholder="예: 아이폰15프로, 아이패드프로12.9" style={styles.input} />
          <label htmlFor="contact-time" style={styles.label}>연락 가능 시간</label>
          <input id="contact-time" name="contact_time" value={form.contact_time} onChange={handleChange} placeholder="예: 오후 2시 이후" style={styles.input} />

          <label htmlFor="contact-symptom" style={styles.label}>고장 증상 또는 문의 내용 <span aria-hidden="true">*</span></label>
          <textarea id="contact-symptom" name="symptom" value={form.symptom} onChange={handleChange} placeholder="고장 증상 또는 문의 내용을 입력해 주세요." required style={styles.textarea} />
          <label htmlFor="contact-memo" style={styles.label}>추가 메모 <span style={styles.optional}>(선택)</span></label>
          <textarea id="contact-memo" name="memo" value={form.memo} onChange={handleChange} placeholder="추가로 전달할 내용을 입력해 주세요." style={styles.textareaSmall} />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "접수 중..." : "온라인 접수하기"}
          </button>
        </form>
      </section>
    </main>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f4f8fc",
    padding: "60px 24px",
  },
  box: {
    maxWidth: "760px",
    margin: "0 auto",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "28px",
    padding: "34px",
    boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
  },
  title: {
    fontSize: "38px",
    fontWeight: 900,
    margin: "0 0 10px",
  },
  desc: {
    color: "#64748b",
    marginBottom: "24px",
  },
  form: {
    display: "grid",
    gap: "12px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 800,
    color: "#334155",
    marginTop: "4px",
  },
  optional: {
    color: "#64748b",
    fontWeight: 500,
  },
  input: {
    padding: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    fontSize: "15px",
  },
  textarea: {
    minHeight: "140px",
    padding: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    fontSize: "15px",
  },
  textareaSmall: {
    minHeight: "90px",
    padding: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    fontSize: "15px",
  },
  button: {
    padding: "15px",
    border: "none",
    borderRadius: "14px",
    backgroundColor: "#1d4ed8",
    color: "#fff",
    fontWeight: 900,
    fontSize: "16px",
    cursor: "pointer",
  },

  backButton: {
    display: "inline-block",
    marginBottom: "18px",
    color: "#1d4ed8",
    fontWeight: 900,
    textDecoration: "none",
  },
}
