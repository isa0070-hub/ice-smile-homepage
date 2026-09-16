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

  const branchSlug = pathname.match(/^\/branches\/(gangbyeon|seolleung|sindorim)\/?$/)?.[1];
  const contactHref = branchSlug ? `/contact?branch=${branchSlug}` : "/contact";

  return (
    <>
      <div className="mobile-contact-bar-spacer" aria-hidden="true" />
      <aside className="mobile-contact-bar" aria-label="빠른 수리 문의">
        <PhoneContactButton buttonLabel="지점 전화문의" buttonStyle={phoneButtonStyle} />

        {pathname === "/contact" ? (
          <Link href="/branches" style={inquiryButtonStyle}>
            지점 안내
          </Link>
        ) : (
          <Link href={contactHref} data-ga-contact="online_inquiry" style={inquiryButtonStyle}>
            간편 수리문의
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
