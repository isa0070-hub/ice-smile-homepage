"use client";

import { useState } from "react";

export default function PhoneContactButton({ buttonStyle }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
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
        전화 문의
      </button>

      {open && (
        <div style={overlayStyle} onClick={() => setOpen(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2>지점 전화문의</h2>

            <p>
              <strong>강변점</strong><br />
              <a href="tel:02-3424-5295" style={phoneStyle}>02-3424-5295</a>
            </p>

            <p>
              <strong>선릉점</strong><br />
              <a href="tel:02-554-5295" style={phoneStyle}>02-554-5295</a>
            </p>

            <p>
              <strong>신도림점</strong><br />
              <a href="tel:02-2111-8899" style={phoneStyle}>02-2111-8899</a>
            </p>

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