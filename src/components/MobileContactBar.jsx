"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PhoneContactButton from "@/components/PhoneContactButton";
import { branchSeo } from "@/lib/branchSeo";

const EXCLUDED_PATHS = ["/admin", "/morning", "/login", "/api"];

export default function MobileContactBar() {
  const pathname = usePathname() || "";

  const excluded = EXCLUDED_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (excluded) return null;

  const branchPageSlug =
    pathname.match(/^\/branches\/(gangbyeon|seolleung|sindorim)\/?$/)?.[1];

  const landingMatch =
    pathname.match(
      /^\/landing\/(gangbyeon|seolleung|sindorim)\/([^/]+)\/?$/
    );

  const landingBranchSlug = landingMatch?.[1];
  const landingDeviceSlug = landingMatch?.[2];
  const isAdLanding = Boolean(landingMatch);

  if (isAdLanding && landingBranchSlug) {
    const branch = branchSeo[landingBranchSlug];

    const contactParams = new URLSearchParams({
      branch: landingBranchSlug,
    });

    if (landingDeviceSlug) {
      contactParams.set("device", landingDeviceSlug);
    }

    return (
      <>
        <div className="mobile-contact-bar-spacer" aria-hidden="true" />

        <aside
          className="mobile-contact-bar"
          aria-label="빠른 수리 문의"
        >
          <a
            href={`tel:${branch.phone}`}
            data-ga-contact={`phone_${landingBranchSlug}`}
            style={landingPhoneStyle}
          >
            전화상담
          </a>

          <a
            href="https://talk.naver.com/WCH5S2X"
            target="_blank"
            rel="noreferrer"
            data-ga-contact="naver_talk"
            style={landingTalkStyle}
          >
            톡톡상담
          </a>

          <Link
            href={`/contact?${contactParams.toString()}`}
            data-ga-contact="online_inquiry"
            style={landingInquiryStyle}
          >
            온라인접수
          </Link>
        </aside>
      </>
    );
  }

  const branchSlug = branchPageSlug;

  const contactHref = branchSlug
    ? `/contact?branch=${branchSlug}`
    : "/contact";

  return (
    <>
      <div className="mobile-contact-bar-spacer" aria-hidden="true" />

      <aside className="mobile-contact-bar" aria-label="빠른 수리 문의">
        <PhoneContactButton
          buttonLabel="지점 전화문의"
          buttonStyle={phoneButtonStyle}
        />

        {pathname === "/contact" ? (
          <Link href="/branches" style={inquiryButtonStyle}>
            지점 안내
          </Link>
        ) : (
          <Link
            href={contactHref}
            data-ga-contact="online_inquiry"
            style={inquiryButtonStyle}
          >
            간편 수리문의
          </Link>
        )}
      </aside>
    </>
  );
}

const phoneButtonStyle = {
  flex: 1,
  minHeight: "48px",
  borderRadius: "13px",
  background: "#0f172a",
  color: "#fff",
  fontSize: "15px",
  fontWeight: 900,
};

const inquiryButtonStyle = {
  flex: 1.35,
  minHeight: "48px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "13px",
  background: "#2563eb",
  color: "#fff",
  fontSize: "15px",
  fontWeight: 900,
  textDecoration: "none",
};

const landingPhoneStyle = {
  flex: 1,
  minHeight: "48px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "13px",
  background: "#0f172a",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 900,
  textDecoration: "none",
};

const landingTalkStyle = {
  flex: 1,
  minHeight: "48px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "13px",
  background: "#03c75a",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 900,
  textDecoration: "none",
};

const landingInquiryStyle = {
  flex: 1.15,
  minHeight: "48px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "13px",
  background: "#2563eb",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 900,
  textDecoration: "none",
};
