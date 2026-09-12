"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PhoneContactButton from "@/components/PhoneContactButton";

const EXCLUDED_PATHS = ["/admin", "/morning", "/login", "/api"];

export default function MobileContactBar() {
  const pathname = usePathname() || "";
  const excluded = EXCLUDED_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (excluded) return null;

  return (
    <>
      <div className="mobile-contact-bar-spacer" aria-hidden="true" />
      <aside className="mobile-contact-bar" aria-label="빠른 수리 문의">
        <PhoneContactButton buttonLabel="전화 문의" buttonStyle={phoneButtonStyle} />

        {pathname === "/contact" ? (
          <a href="https://talk.naver.com/WCH5S2X" target="_blank" rel="noreferrer" style={inquiryButtonStyle}>
            네이버 톡톡
          </a>
        ) : (
          <Link href="/contact" data-ga-contact="online_inquiry" style={inquiryButtonStyle}>
            30초 온라인 문의
          </Link>
        )}
      </aside>
    </>
  );
}

const phoneButtonStyle = {
  flex: 1, minHeight: "48px", borderRadius: "13px", background: "#0f172a",
  color: "#fff", fontSize: "15px", fontWeight: 900,
};

const inquiryButtonStyle = {
  flex: 1.35, minHeight: "48px", display: "flex", alignItems: "center",
  justifyContent: "center", borderRadius: "13px", background: "#2563eb",
  color: "#fff", fontSize: "15px", fontWeight: 900, textDecoration: "none",
};
