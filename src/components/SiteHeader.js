"use client"

import { useEffect, useRef, useState } from "react"
import PhoneContactButton from "@/components/PhoneContactButton"

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
  const nameInputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const previousActiveElement = document.activeElement
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    nameInputRef.current?.focus()

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      previousActiveElement?.focus?.()
    }
  }, [isOpen])

  const handleChange = (e) => {
    const { checked, name, type, value } = e.target
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
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

    setLoading(true)

    const response = await fetch("/api/online-inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const result = await response.json()

    setLoading(false)

    if (!response.ok) return alert(result.message || "온라인 접수 저장에 실패했습니다.")

    alert("온라인 접수가 완료되었습니다. 확인 후 연락드리겠습니다.")

setIsOpen(false)
window.location.href = "/"
}
return (
    <>
      <header className="site-header" style={headerStyle}>
        <div style={innerStyle}>
          <a href="/" style={logoStyle}>아이스마일어게인</a>

          <nav className="desktop-nav" style={navWrapStyle}>
            <a style={navStyle} href="/">홈</a>
            <a href="/#repair-items" style={navStyle}>수리품목</a>
            <a style={navStyle} href="/repair-cases">수리사례</a>
            <button type="button" onClick={() => setIsOpen(true)} style={navButtonStyle}>
              온라인접수
            </button>
            <a style={navStyle} href="/branches">지점안내</a>
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
    aria-label="메뉴 열기"
    aria-expanded={isMenuOpen}
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
              <button type="button" onClick={closeMenu} aria-label="메뉴 닫기" style={closeButtonStyle}>×</button>
            </div>

            <a href="/" onClick={closeMenu} style={mobileNavStyle}>홈</a>
            <a href="/#repair-items" onClick={closeMenu} style={mobileNavStyle}>수리품목</a>
            <a href="/repair-cases" onClick={closeMenu} style={mobileNavStyle}>수리사례</a>
            <button type="button" onClick={openInquiry} style={mobileNavButtonStyle}>온라인접수</button>
            <a href="/branches" onClick={closeMenu} style={mobileNavStyle}>지점안내</a>

            <PhoneContactButton buttonStyle={mobilePhoneButtonStyle} />
          </div>
        </div>
      )}

      {isOpen && (
        <div style={overlayStyle} onClick={() => setIsOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="inquiry-dialog-title" style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div>
                <h2 id="inquiry-dialog-title" style={{ margin: 0, fontSize: "26px", fontWeight: 900 }}>온라인 접수</h2>
                <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                  수리 문의를 남겨주시면 확인 후 연락드리겠습니다.
                </p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="접수창 닫기" style={closeButtonStyle}>×</button>
            </div>

            <form method="post" onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
              <label htmlFor="inquiry-name" style={labelStyle}>성함 <span aria-hidden="true">*</span></label>
              <input ref={nameInputRef} id="inquiry-name" name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="성함" autoComplete="name" required style={inputStyle} />
              <label htmlFor="inquiry-phone" style={labelStyle}>연락처 <span aria-hidden="true">*</span></label>
              <input id="inquiry-phone" type="tel" inputMode="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="010-0000-0000" autoComplete="tel" required style={inputStyle} />

              <label htmlFor="inquiry-branch" style={labelStyle}>희망 지점</label>
              <select id="inquiry-branch" name="preferred_branch" value={form.preferred_branch} onChange={handleChange} style={inputStyle}>
                <option>강변점</option>
                <option>선릉점</option>
                <option>신도림점</option>
              </select>

              <label htmlFor="inquiry-device" style={labelStyle}>기기 종류</label>
              <input id="inquiry-device" name="device" value={form.device} onChange={handleChange} placeholder="예: 아이폰, 아이패드, 맥북, 서피스" style={inputStyle} />
              <label htmlFor="inquiry-model" style={labelStyle}>모델명</label>
              <input id="inquiry-model" name="model" value={form.model} onChange={handleChange} placeholder="예: 아이폰15프로, 아이패드프로12.9" style={inputStyle} />
              <label htmlFor="inquiry-time" style={labelStyle}>연락 가능 시간</label>
              <input id="inquiry-time" name="contact_time" value={form.contact_time} onChange={handleChange} placeholder="예: 오후 2시 이후" style={inputStyle} />

              <label htmlFor="inquiry-symptom" style={labelStyle}>고장 증상 또는 문의 내용 <span aria-hidden="true">*</span></label>
              <textarea id="inquiry-symptom" name="symptom" value={form.symptom} onChange={handleChange} placeholder="고장 증상 또는 문의 내용을 입력해 주세요." required style={textareaStyle} />
              <label htmlFor="inquiry-memo" style={labelStyle}>추가 메모 <span style={optionalStyle}>(선택)</span></label>
              <textarea id="inquiry-memo" name="memo" value={form.memo} onChange={handleChange} placeholder="추가로 전달할 내용을 입력해 주세요." style={smallTextareaStyle} />

              <div aria-hidden="true" style={honeypotStyle}>
                <label htmlFor="inquiry-website">웹사이트</label>
                <input id="inquiry-website" name="website" value={form.website} onChange={handleChange} tabIndex={-1} autoComplete="off" />
              </div>

              <label style={consentLabelStyle}>
                <input type="checkbox" name="privacy_consent" checked={form.privacy_consent} onChange={handleChange} required />
                <span><a href="/privacy">개인정보처리방침</a>의 수집·이용 내용에 동의합니다. <span aria-hidden="true">*</span></span>
              </label>

              <button type="submit" disabled={loading} aria-busy={loading} style={submitButtonStyle}>
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

const labelStyle = {
  color: "#334155",
  fontSize: "14px",
  fontWeight: 800,
  marginTop: "4px",
}

const optionalStyle = {
  color: "#64748b",
  fontWeight: 500,
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
