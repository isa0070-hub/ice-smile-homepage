"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import PhoneContactButton from "@/components/PhoneContactButton"
import { trackNaverLead } from "@/components/NaverConversionTracker"
import {
  createInquirySubmissionToken,
  submitOnlineInquiry,
} from "@/lib/inquiryClient"

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    device: "",
    model: "",
    symptom: "",
    preferred_branch: "강변점",
    contact_time: "",
    memo: "",
    website: "",
    privacy_consent: false,
  })
  const submissionTokenRef = useRef(null)

  const handleChange = (e) => {
    const { checked, name, type, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const openInquiry = () => {
    setIsMenuOpen(false)
    setIsOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.customer_name.trim()) return alert("성함을 입력해 주세요.")
    if (!form.phone.trim()) return alert("연락처를 입력해 주세요.")
    if (!form.symptom.trim()) return alert("증상을 입력해 주세요.")
    if (!form.privacy_consent) return alert("개인정보 수집·이용에 동의해 주세요.")

    setLoading(true)

    if (!submissionTokenRef.current) {
      submissionTokenRef.current = createInquirySubmissionToken()
    }

    try {
      await submitOnlineInquiry(form, submissionTokenRef.current)
      alert("온라인 접수가 완료되었습니다. 확인 후 연락드리겠습니다.")
      trackNaverLead()
      setIsOpen(false)
      window.location.assign("/")
    } catch (error) {
      alert(error?.message || "온라인 접수 저장에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="site-header" style={headerStyle}>
        <div style={innerStyle}>
          <Link href="/" style={logoStyle}>아이스마일어게인</Link>

          <nav className="desktop-nav" style={navWrapStyle}>
            <Link style={navStyle} href="/">홈</Link>
            <Link href="/#repair-items" style={navStyle}>수리품목</Link>
            <Link style={navStyle} href="/repair-cases">수리사례</Link>
            <button type="button" onClick={() => setIsOpen(true)} style={navButtonStyle}>
              온라인접수
            </button>
            <Link style={navStyle} href="/branches">지점안내</Link>
          </nav>

          <div className="desktop-phone" style={headerButtonWrapStyle}>
  <a
    href="https://pf.kakao.com/_ftxmXX/chat"
    target="_blank"
    rel="noreferrer"
    style={kakaoHeaderButtonStyle}
  >
    카카오톡 문의
  </a>

  <PhoneContactButton buttonStyle={phoneButtonStyle} />
</div>

<div style={mobileHeaderActionsStyle}>
  <a
    href="https://pf.kakao.com/_ftxmXX/chat"
    target="_blank"
    rel="noreferrer"
    className="mobile-kakao-button"
    style={mobileKakaoButtonStyle}
  >
    카카오
  </a>

  <button
    type="button"
    className="mobile-menu-button"
    onClick={() => setIsMenuOpen(true)}
    style={mobileMenuButtonStyle}
  >
    ☰
  </button>
</div>
</div>
      </header>

      {isMenuOpen && (
        <div className="mobile-menu-overlay" style={mobileMenuOverlayStyle} onClick={closeMenu}>
          <div style={mobileMenuStyle} onClick={(e) => e.stopPropagation()}>
            <div style={mobileMenuTopStyle}>
              <strong style={{ fontSize: "22px" }}>아이스마일어게인</strong>
              <button type="button" onClick={closeMenu} style={closeButtonStyle}>×</button>
            </div>

            <Link href="/" onClick={closeMenu} style={mobileNavStyle}>홈</Link>
            <Link href="/#repair-items" onClick={closeMenu} style={mobileNavStyle}>수리품목</Link>
            <Link href="/repair-cases" onClick={closeMenu} style={mobileNavStyle}>수리사례</Link>
            <button type="button" onClick={openInquiry} style={mobileNavButtonStyle}>온라인접수</button>
            <Link href="/branches" onClick={closeMenu} style={mobileNavStyle}>지점안내</Link>

            <PhoneContactButton buttonStyle={mobilePhoneButtonStyle} />
          </div>
        </div>
      )}

      {isOpen && (
        <div style={overlayStyle} onClick={() => setIsOpen(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={{ margin: 0, fontSize: "26px", fontWeight: 900 }}>온라인 접수</h2>
                <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                  수리 문의를 남겨주시면 확인 후 연락드리겠습니다.
                </p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} style={closeButtonStyle}>×</button>
            </div>

            <form method="post" onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
              <input name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="성함" aria-label="성함" autoComplete="name" required maxLength={40} style={inputStyle} />
              <input type="tel" inputMode="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="연락처" aria-label="연락처" autoComplete="tel" required maxLength={30} style={inputStyle} />

              <select name="preferred_branch" value={form.preferred_branch} onChange={handleChange} aria-label="희망 지점" style={inputStyle}>
                <option>강변점</option>
                <option>선릉점</option>
                <option>신도림점</option>
              </select>

              <input name="device" value={form.device} onChange={handleChange} placeholder="기기 종류 예: 아이폰, 아이패드, 맥북, 서피스" aria-label="기기 종류" maxLength={80} style={inputStyle} />
              <input name="model" value={form.model} onChange={handleChange} placeholder="모델명 예: 아이폰15프로, 아이패드프로12.9" aria-label="모델명" maxLength={100} style={inputStyle} />
              <input name="contact_time" value={form.contact_time} onChange={handleChange} placeholder="연락 가능 시간 예: 오후 2시 이후" aria-label="연락 가능 시간" maxLength={80} style={inputStyle} />

              <textarea name="symptom" value={form.symptom} onChange={handleChange} placeholder="고장 증상 또는 문의 내용을 입력해 주세요." aria-label="고장 증상 또는 문의 내용" required maxLength={2000} style={textareaStyle} />
              <textarea name="memo" value={form.memo} onChange={handleChange} placeholder="추가 메모 선택사항" aria-label="추가 메모" maxLength={1000} style={smallTextareaStyle} />

              <div aria-hidden="true" style={honeypotStyle}>
                <label htmlFor="header-inquiry-website">웹사이트</label>
                <input id="header-inquiry-website" name="website" value={form.website} onChange={handleChange} tabIndex={-1} autoComplete="off" />
              </div>

              <label style={consentLabelStyle}>
                <input type="checkbox" name="privacy_consent" checked={form.privacy_consent} onChange={handleChange} required />
                <span><Link href="/privacy">개인정보처리방침</Link>의 수집·이용 내용에 동의합니다. <span aria-hidden="true">*</span></span>
              </label>

              <button type="submit" disabled={loading} style={submitButtonStyle}>
                {loading ? "접수 중..." : "온라인 접수하기"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

const headerStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  background: "#ffffff",
  borderBottom: "1px solid #e5e7eb",
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
}

const innerStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "16px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}

const logoStyle = { fontSize: "24px", fontWeight: "900", color: "#111827", textDecoration: "none" }
const navWrapStyle = { display: "flex", gap: "20px", alignItems: "center" }
const navStyle = { textDecoration: "none", color: "#111827", fontWeight: "700" }
const navButtonStyle = { border: "none", background: "transparent", color: "#111827", fontWeight: "700", fontSize: "16px", cursor: "pointer", padding: 0 }
const phoneButtonStyle = { background: "#1e3a8a", color: "#fff", padding: "10px 18px", borderRadius: "999px", textDecoration: "none", fontWeight: "700" }

const mobileMenuButtonStyle = {
  display: "none",
  border: "none",
  background: "#1e3a8a",
  color: "#fff",
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  fontSize: "22px",
  cursor: "pointer",
}

const mobileMenuOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 10001,
  background: "rgba(15,23,42,0.55)",
}

const mobileMenuStyle = {
  marginLeft: "auto",
  width: "78%",
  maxWidth: "320px",
  height: "100%",
  background: "#fff",
  padding: "24px",
  boxShadow: "-10px 0 30px rgba(15,23,42,0.2)",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
}

const mobileMenuTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "14px",
}

const mobileNavStyle = {
  display: "block",
  padding: "15px 12px",
  borderRadius: "12px",
  background: "#f8fafc",
  color: "#111827",
  textDecoration: "none",
  fontWeight: "900",
}

const mobileNavButtonStyle = {
  display: "block",
  width: "100%",
  padding: "15px 12px",
  border: "none",
  borderRadius: "12px",
  background: "#f8fafc",
  color: "#111827",
  fontWeight: "900",
  fontSize: "16px",
  textAlign: "left",
  cursor: "pointer",
}

const mobilePhoneButtonStyle = {
  marginTop: "10px",
  display: "block",
  textAlign: "center",
  background: "#1e3a8a",
  color: "#fff",
  padding: "15px 18px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  backgroundColor: "rgba(15,23,42,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px",
}

const modalStyle = {
  width: "100%",
  maxWidth: "640px",
  maxHeight: "86vh",
  overflowY: "auto",
  backgroundColor: "#fff",
  borderRadius: "26px",
  padding: "24px",
  boxShadow: "0 24px 70px rgba(15,23,42,0.25)",
}

const modalHeaderStyle = { display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }
const closeButtonStyle = { width: "42px", height: "42px", borderRadius: "50%", border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#1e3a8a", fontSize: "30px", cursor: "pointer" }

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px",
  border: "1px solid #cbd5e1",
  borderRadius: "13px",
  fontSize: "15px",
  backgroundColor: "#ffffff",
  color: "#111827",
}

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: "120px",
  padding: "13px",
  border: "1px solid #cbd5e1",
  borderRadius: "13px",
  fontSize: "15px",
  backgroundColor: "#ffffff",
  color: "#111827",
}

const smallTextareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: "80px",
  padding: "13px",
  border: "1px solid #cbd5e1",
  borderRadius: "13px",
  fontSize: "15px",
  backgroundColor: "#ffffff",
  color: "#111827",
}

const honeypotStyle = {
  position: "absolute",
  left: "-10000px",
  width: "1px",
  height: "1px",
  overflow: "hidden",
}

const consentLabelStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  color: "#334155",
  fontSize: "14px",
  lineHeight: 1.6,
}

const submitButtonStyle = { padding: "15px", border: "none", borderRadius: "14px", backgroundColor: "#1d4ed8", color: "#fff", fontWeight: 900, fontSize: "16px", cursor: "pointer" }

const headerButtonWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const kakaoHeaderButtonStyle = {
  background: "#FEE500",
  color: "#191919",
  padding: "10px 18px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const mobileKakaoButtonStyle = {
  display: "none",
  background: "#FEE500",
  color: "#191919",
  padding: "9px 12px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
  fontSize: "13px",
};
const mobileHeaderActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
};
