"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import InquiryForm from "@/components/InquiryForm"
import PhoneContactButton from "@/components/PhoneContactButton"

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname() || ""

  const landingMatch = pathname.match(
    /^\/landing\/(gangbyeon|seolleung|sindorim)\/([^/]+)\/?$/
  )

  const landingBranchLabels = {
    gangbyeon: "강변점",
    seolleung: "선릉점",
    sindorim: "신도림점",
  }

  const landingDeviceLabels = {
    iphone: "아이폰수리",
    ipad: "아이패드수리",
    surface: "서피스수리",
  }

  useEffect(() => {
    if (!isOpen) return

    const previousActiveElement = document.activeElement
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      previousActiveElement?.focus?.()
    }
  }, [isOpen])

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const openInquiry = () => {
    setIsMenuOpen(false)
    setIsOpen(true)
  }

  if (landingMatch) {
    const branchLabel =
      landingBranchLabels[landingMatch[1]] || "수리지점"
    const deviceLabel =
      landingDeviceLabels[landingMatch[2]] || "수리상담"

    return (
      <header className="site-header" style={landingHeaderStyle}>
        <div style={landingHeaderInnerStyle}>
          <Link href="/" style={landingLogoStyle}>
            <span style={landingLogoMainStyle}>i smile again</span>
            <span style={landingLogoSubStyle}>아이스마일어게인</span>
          </Link>

          <div style={landingHeaderRightStyle}>
            <Link
              href={`/contact?branch=${landingMatch[1]}&device=${landingMatch[2]}`}
              data-ga-contact="online_inquiry"
              style={landingOnlineButtonStyle}
            >
              온라인 접수
            </Link>

            <div style={landingHeaderBadgeStyle}>
              {branchLabel}
              <span style={landingHeaderDividerStyle}>·</span>
              {deviceLabel}
            </div>
          </div>
        </div>
      </header>
    )
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
            <Link style={navStyle} href="/notices">공지사항</Link>
            <button type="button" data-ga-contact="online_inquiry" onClick={() => setIsOpen(true)} style={navButtonStyle}>
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

            <Link href="/" onClick={closeMenu} style={mobileNavStyle}>홈</Link>
            <Link href="/#repair-items" onClick={closeMenu} style={mobileNavStyle}>수리품목</Link>
            <Link href="/repair-cases" onClick={closeMenu} style={mobileNavStyle}>수리사례</Link>
            <Link href="/notices" onClick={closeMenu} style={mobileNavStyle}>공지사항</Link>
            <button type="button" data-ga-contact="online_inquiry" onClick={openInquiry} style={mobileNavButtonStyle}>간편 온라인접수</button>
            <Link href="/branches" onClick={closeMenu} style={mobileNavStyle}>지점안내</Link>

            <PhoneContactButton buttonStyle={mobilePhoneButtonStyle} />
          </div>
        </div>
      )}

      {isOpen && (
        <div style={overlayStyle} onClick={() => setIsOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="inquiry-dialog-title" style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div>
                <h2 id="inquiry-dialog-title" style={{ margin: 0, fontSize: "26px", fontWeight: 900 }}>간편 온라인 접수</h2>
                <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                  사진이 없어도 괜찮습니다. 확인 후 연락드리겠습니다.
                </p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="접수창 닫기" style={closeButtonStyle}>×</button>
            </div>

            <InquiryForm
              formLocation="header_modal"
              idPrefix="inquiry"
              autoFocus
              onSubmitted={() => {
                setIsOpen(false)
                window.location.assign("/")
              }}
            />
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


const landingHeaderStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  height: "78px",
  background: "rgba(255,255,255,0.94)",
  borderBottom: "1px solid rgba(226,232,240,0.9)",
  boxShadow: "0 6px 24px rgba(15,23,42,0.05)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
}

const landingHeaderInnerStyle = {
  maxWidth: "1160px",
  height: "78px",
  margin: "0 auto",
  padding: "0 22px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
}

const landingLogoStyle = {
  display: "flex",
  flexDirection: "column",
  textDecoration: "none",
  lineHeight: 1.05,
}

const landingLogoMainStyle = {
  color: "#0f172a",
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: "-0.03em",
}

const landingLogoSubStyle = {
  marginTop: "5px",
  color: "#94a3b8",
  fontSize: "10px",
  fontWeight: 800,
}

const landingHeaderBadgeStyle = {
  display: "flex",
  alignItems: "center",
  padding: "8px 13px",
  borderRadius: "999px",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: "13px",
  fontWeight: 900,
  whiteSpace: "nowrap",
}

const landingHeaderDividerStyle = {
  padding: "0 5px",
  color: "#93c5fd",
}


const landingHeaderRightStyle = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
}

const landingOnlineButtonStyle = {
  minHeight: "38px",
  padding: "0 16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  background: "#2563eb",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 900,
  textDecoration: "none",
  whiteSpace: "nowrap",
  boxShadow: "0 6px 18px rgba(37,99,235,0.18)",
}
