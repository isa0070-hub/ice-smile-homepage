"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PopupNotice() {
  const [popup, setPopup] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    loadPopup();
  }, []);

  async function loadPopup() {
    const todayKey = `popup_closed_${new Date().toDateString()}`;

    if (localStorage.getItem(todayKey) === "yes") {
      return;
    }

    const { data, error } = await supabase
      .from("popup_notices")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("팝업 불러오기 오류:", error);
      return;
    }

    if (!data) {
      console.log("활성화된 팝업이 없습니다.");
      return;
    }

    setPopup(data);
    setVisible(true);
  }

  function closePopup() {
    setVisible(false);
  }

  function closeToday() {
    const todayKey = `popup_closed_${new Date().toDateString()}`;
    localStorage.setItem(todayKey, "yes");
    setVisible(false);
  }

  function getPositionStyle() {
    const base = {
      position: "fixed",
      zIndex: 99999,
    };

    if (popup.position === "top-left") {
      return { ...base, top: "40px", left: "40px" };
    }

    if (popup.position === "top-right") {
      return { ...base, top: "40px", right: "40px" };
    }

    if (popup.position === "bottom-left") {
      return { ...base, bottom: "40px", left: "40px" };
    }

    if (popup.position === "bottom-right") {
      return { ...base, bottom: "40px", right: "40px" };
    }

    if (popup.position === "custom") {
      return {
        ...base,
        top: `${popup.custom_y || 80}px`,
        left: `${popup.custom_x || 80}px`,
      };
    }

    return {
      ...base,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  if (!visible || !popup) return null;

  return (
    <>
      <div style={overlayStyle} />

      <div
        style={{
          ...popupBoxStyle,
          ...getPositionStyle(),
          width: `${popup.width || 500}px`,
          maxWidth: "92vw",
        }}
      >
        {popup.image_url && (
          <img
            src={popup.image_url}
            alt={popup.title || "팝업 이미지"}
            style={imageStyle}
          />
        )}

        <div style={contentStyle}>
          <h2 style={titleStyle}>{popup.title}</h2>

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
      </div>
    </>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.35)",
  zIndex: 99998,
};

const popupBoxStyle = {
  background: "white",
  borderRadius: "22px",
  overflow: "hidden",
  boxShadow: "0 25px 60px rgba(15, 23, 42, 0.35)",
};

const imageStyle = {
  width: "100%",
  maxHeight: "420px",
  objectFit: "cover",
  display: "block",
};

const contentStyle = {
  padding: "24px",
};

const titleStyle = {
  fontSize: "26px",
  margin: "0 0 12px",
};

const textStyle = {
  fontSize: "17px",
  lineHeight: 1.7,
  color: "#475569",
  whiteSpace: "pre-wrap",
};

const buttonWrapStyle = {
  display: "flex",
  gap: "10px",
  justifyContent: "flex-end",
  marginTop: "22px",
  flexWrap: "wrap",
};

const todayButtonStyle = {
  padding: "12px 16px",
  border: "none",
  borderRadius: "999px",
  background: "#e5e7eb",
  color: "#111827",
  fontWeight: "900",
  cursor: "pointer",
};

const closeButtonStyle = {
  padding: "12px 18px",
  border: "none",
  borderRadius: "999px",
  background: "#1e3a8a",
  color: "white",
  fontWeight: "900",
  cursor: "pointer",
};