"use client";

import { useEffect, useState } from "react";

const POPUP_ENDPOINT = "/api/public/popup-notice";
const POPUP_TITLE_ID = "site-popup-notice-title";

function getTodayKey() {
  return `popup_closed_${new Date().toDateString()}`;
}

export default function PopupNotice() {
  const [popup, setPopup] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let timerId = null;
    let idleCallbackId = null;

    async function loadPopup() {
      if (localStorage.getItem(getTodayKey()) === "yes") {
        return;
      }

      try {
        const response = await fetch(POPUP_ENDPOINT, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json();

        if (!active || !result?.popup) {
          return;
        }

        setPopup(result.popup);
        setVisible(true);
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error("팝업 불러오기 오류:", error);
        }
      }
    }

    // 공지 조회는 핵심 콘텐츠의 hydration과 경쟁하지 않도록 유휴 시간에 시작한다.
    if (typeof window.requestIdleCallback === "function") {
      idleCallbackId = window.requestIdleCallback(loadPopup, { timeout: 1800 });
    } else {
      timerId = window.setTimeout(loadPopup, 800);
    }

    return () => {
      active = false;
      controller.abort();

      if (idleCallbackId !== null) {
        window.cancelIdleCallback(idleCallbackId);
      }

      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, []);

  function closePopup() {
    setVisible(false);
  }

  function closeToday() {
    localStorage.setItem(getTodayKey(), "yes");
    setVisible(false);
  }

  function getPositionStyle() {
    const base = {
      position: "fixed",
      zIndex: 20000,
    };

    if (popup.position === "top-left") {
      return { ...base, top: "94px", left: "clamp(12px, 3vw, 40px)" };
    }

    if (popup.position === "top-right") {
      return { ...base, top: "94px", right: "clamp(12px, 3vw, 40px)" };
    }

    if (popup.position === "bottom-left") {
      return { ...base, bottom: "20px", left: "clamp(12px, 3vw, 40px)" };
    }

    if (popup.position === "center") {
      return {
        ...base,
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
      };
    }

    return {
      ...base,
      bottom: "20px",
      right: "clamp(12px, 3vw, 40px)",
    };
  }

  if (!visible || !popup) return null;

  return (
    <aside
      aria-labelledby={POPUP_TITLE_ID}
      aria-live="polite"
      role="region"
      style={{
        ...popupBoxStyle,
        ...getPositionStyle(),
        width: `min(calc(100vw - 24px), ${popup.width || 420}px)`,
      }}
    >
      <button
        aria-label="공지 닫기"
        type="button"
        onClick={closePopup}
        style={iconCloseButtonStyle}
      >
        ×
      </button>

      {popup.image_url && (
        // Popup images are admin-authored and can have arbitrary aspect ratios.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={popup.image_url}
          alt={popup.title || "공지 이미지"}
          decoding="async"
          fetchPriority="low"
          loading="lazy"
          style={imageStyle}
        />
      )}

      <div style={contentStyle}>
        <h2 id={POPUP_TITLE_ID} style={titleStyle}>
          {popup.title}
        </h2>

        {popup.content && <p style={textStyle}>{popup.content}</p>}

        <div style={buttonWrapStyle}>
          {popup.show_today_close && (
            <button type="button" onClick={closeToday} style={todayButtonStyle}>
              오늘 하루 보지 않기
            </button>
          )}

          <button type="button" onClick={closePopup} style={closeButtonStyle}>
            닫기
          </button>
        </div>
      </div>
    </aside>
  );
}

const popupBoxStyle = {
  background: "white",
  border: "1px solid #dbeafe",
  borderRadius: "18px",
  overflow: "hidden",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.22)",
  maxHeight: "min(70vh, 620px)",
  overflowY: "auto",
};

const imageStyle = {
  width: "100%",
  maxHeight: "min(32vh, 260px)",
  objectFit: "contain",
  display: "block",
  background: "#f8fafc",
};

const contentStyle = {
  padding: "18px",
};

const titleStyle = {
  fontSize: "clamp(19px, 4vw, 24px)",
  lineHeight: 1.35,
  margin: "0 38px 8px 0",
};

const textStyle = {
  fontSize: "15px",
  lineHeight: 1.65,
  color: "#475569",
  whiteSpace: "pre-wrap",
  margin: 0,
};

const buttonWrapStyle = {
  display: "flex",
  gap: "10px",
  justifyContent: "flex-end",
  marginTop: "16px",
  flexWrap: "wrap",
};

const todayButtonStyle = {
  minHeight: "44px",
  padding: "10px 15px",
  border: "1px solid #cbd5e1",
  borderRadius: "999px",
  background: "#f8fafc",
  color: "#111827",
  fontWeight: "800",
  cursor: "pointer",
};

const closeButtonStyle = {
  minHeight: "44px",
  padding: "10px 18px",
  border: "none",
  borderRadius: "999px",
  background: "#1e3a8a",
  color: "white",
  fontWeight: "800",
  cursor: "pointer",
};

const iconCloseButtonStyle = {
  position: "absolute",
  top: "10px",
  right: "10px",
  zIndex: 1,
  width: "44px",
  height: "44px",
  border: "1px solid #cbd5e1",
  borderRadius: "999px",
  background: "rgba(255, 255, 255, 0.96)",
  color: "#0f172a",
  cursor: "pointer",
  fontSize: "25px",
  lineHeight: 1,
};
