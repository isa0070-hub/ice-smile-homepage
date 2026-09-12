"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { branchSeo, branchSlugs } from "@/lib/branchSeo";

export default function PhoneContactButton({
  buttonStyle,
  buttonLabel = "전화 문의",
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  const titleId = useId();
  const pathname = usePathname() || "";
  const currentBranch = pathname.match(/^\/branches\/([^/]+)\/?$/)?.[1];
  const orderedBranches = [...branchSlugs].sort(
    (a, b) => Number(b === currentBranch) - Number(a === currentBranch)
  );

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll("a[href], button");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [open]);

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

      {open && createPortal(
        <div style={overlayStyle} onClick={() => setOpen(false)}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 id={titleId}>지점 전화문의</h2>

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
        </div>,
        document.body
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
  maxHeight: "calc(100dvh - 32px)",
  overflowY: "auto",
  boxSizing: "border-box",
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
