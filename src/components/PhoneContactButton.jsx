"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { branchSeo, branchSlugs } from "@/lib/branchSeo";

export default function PhoneContactButton({
  buttonStyle,
  buttonLabel = "전화 문의",
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "";
  const currentBranch = pathname.match(/^\/branches\/([^/]+)\/?$/)?.[1];
  const orderedBranches = [...branchSlugs].sort(
    (a, b) => Number(b === currentBranch) - Number(a === currentBranch)
  );

  return (
    <>
      <button
        type="button"
        data-ga-contact="phone_list_open"
        data-naver-conversion="phone_list_open"
        onClick={() => setOpen(true)}
        style={{
          ...buttonStyle,
          border: "none",
          cursor: "pointer",
          fontSize: buttonStyle?.fontSize || "16px",
          fontWeight: buttonStyle?.fontWeight || "800",
          fontFamily: "inherit",
          lineHeight: "1.2",
        }}
      >
        {buttonLabel}
      </button>

      {open && (
        <div style={overlayStyle} onClick={() => setOpen(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2>지점 전화문의</h2>

            {orderedBranches.map((slug) => (
              <p key={slug}>
                <strong>{branchSeo[slug].shortName}</strong><br />
                <a href={`tel:${branchSeo[slug].phone}`} style={phoneStyle}>
                  {branchSeo[slug].phone}
                </a>
              </p>
            ))}

            <button onClick={() => setOpen(false)} style={closeButtonStyle}>
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  zIndex: 99999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalStyle = {
  background: "white",
  color: "#111827",
  width: "360px",
  maxWidth: "90vw",
  borderRadius: "22px",
  padding: "30px",
  textAlign: "center",
  boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
  lineHeight: 1.8,
};

const phoneStyle = {
  color: "#1e3a8a",
  fontSize: "22px",
  fontWeight: "900",
  textDecoration: "none",
};

const closeButtonStyle = {
  marginTop: "18px",
  padding: "12px 22px",
  border: "none",
  borderRadius: "999px",
  background: "#1e3a8a",
  color: "white",
  fontWeight: "900",
  cursor: "pointer",
};
