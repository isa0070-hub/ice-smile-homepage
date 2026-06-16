"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PopupEditPage() {
  const params = useParams();
  const router = useRouter();

  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPopup();
  }, []);

  async function loadPopup() {
    const { data, error } = await supabase
      .from("popup_notices")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      console.error(error);
      setMessage("팝업 정보를 불러오지 못했습니다.");
      return;
    }

    setForm(data);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("popup_notices")
      .update({
        title: form.title,
        content: form.content,
        image_url: form.image_url,
        position: form.position,
        custom_x: Number(form.custom_x || 0),
        custom_y: Number(form.custom_y || 0),
        width: Number(form.width || 500),
        height: Number(form.height || 600),
        is_active: form.is_active,
        show_today_close: form.show_today_close,
        sort_order: Number(form.sort_order || 0),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    setSaving(false);

    if (error) {
      console.error(error);
      setMessage("팝업 수정 중 오류가 발생했습니다.");
      return;
    }

    setMessage("팝업이 수정되었습니다.");

    setTimeout(() => {
      router.push("/admin/popups/list");
    }, 700);
  }

  if (!form) {
    return (
      <main style={{ padding: "50px" }}>
        <h2>불러오는 중...</h2>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "900px", margin: "60px auto", padding: "20px" }}>
      <h1 style={{ fontSize: "40px", marginBottom: "24px" }}>
        팝업 수정
      </h1>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>팝업 제목</label>
        <input
          name="title"
          value={form.title || ""}
          onChange={handleChange}
          style={inputStyle}
          required
        />

        <label style={labelStyle}>팝업 내용</label>
        <textarea
          name="content"
          value={form.content || ""}
          onChange={handleChange}
          style={{ ...inputStyle, minHeight: "160px" }}
        />

        <label style={labelStyle}>이미지 주소</label>
        <input
          name="image_url"
          value={form.image_url || ""}
          onChange={handleChange}
          style={inputStyle}
        />

        {form.image_url && (
          <img
            src={form.image_url}
            alt={form.title || "팝업 이미지"}
            style={previewImageStyle}
          />
        )}

        <label style={labelStyle}>팝업 위치</label>
        <select
          name="position"
          value={form.position || "center"}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="center">가운데</option>
          <option value="top-left">좌측상단</option>
          <option value="top-right">우측상단</option>
          <option value="bottom-left">좌측하단</option>
          <option value="bottom-right">우측하단</option>
          <option value="custom">사용자 지정</option>
        </select>

        {form.position === "custom" && (
          <>
            <label style={labelStyle}>X 위치</label>
            <input
              type="number"
              name="custom_x"
              value={form.custom_x || 0}
              onChange={handleChange}
              style={inputStyle}
            />

            <label style={labelStyle}>Y 위치</label>
            <input
              type="number"
              name="custom_y"
              value={form.custom_y || 0}
              onChange={handleChange}
              style={inputStyle}
            />
          </>
        )}

        <label style={labelStyle}>가로 크기</label>
        <input
          type="number"
          name="width"
          value={form.width || 500}
          onChange={handleChange}
          style={inputStyle}
        />

        <label style={labelStyle}>세로 크기</label>
        <input
          type="number"
          name="height"
          value={form.height || 600}
          onChange={handleChange}
          style={inputStyle}
        />

        <label style={labelStyle}>정렬 순서</label>
        <input
          type="number"
          name="sort_order"
          value={form.sort_order || 0}
          onChange={handleChange}
          style={inputStyle}
        />

        <label style={labelStyle}>시작일</label>
        <input
          type="datetime-local"
          name="start_date"
          value={form.start_date ? form.start_date.slice(0, 16) : ""}
          onChange={handleChange}
          style={inputStyle}
        />

        <label style={labelStyle}>종료일</label>
        <input
          type="datetime-local"
          name="end_date"
          value={form.end_date ? form.end_date.slice(0, 16) : ""}
          onChange={handleChange}
          style={inputStyle}
        />

        <label style={checkStyle}>
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active || false}
            onChange={handleChange}
          />
          팝업 활성화
        </label>

        <label style={checkStyle}>
          <input
            type="checkbox"
            name="show_today_close"
            checked={form.show_today_close || false}
            onChange={handleChange}
          />
          오늘 하루 보지 않기 사용
        </label>

        <button type="submit" disabled={saving} style={buttonStyle}>
          {saving ? "수정 중..." : "팝업 수정 저장"}
        </button>

        <a href="/admin/popups/list" style={listButtonStyle}>
          팝업 관리로 돌아가기
        </a>

        {message && <p style={{ fontWeight: "900" }}>{message}</p>}
      </form>
    </main>
  );
}

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  background: "#f8fafc",
  padding: "30px",
  borderRadius: "18px",
  border: "1px solid #e5e7eb",
};

const labelStyle = {
  fontWeight: "900",
  marginTop: "10px",
};

const inputStyle = {
  padding: "14px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  fontSize: "16px",
  width: "100%",
  boxSizing: "border-box",
};

const previewImageStyle = {
  width: "100%",
  maxHeight: "320px",
  objectFit: "cover",
  borderRadius: "14px",
  marginTop: "10px",
};

const checkStyle = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
  fontWeight: "900",
  marginTop: "12px",
};

const buttonStyle = {
  marginTop: "20px",
  padding: "16px",
  border: "none",
  borderRadius: "999px",
  background: "#1e3a8a",
  color: "white",
  fontWeight: "900",
  cursor: "pointer",
};

const listButtonStyle = {
  display: "inline-block",
  textAlign: "center",
  padding: "14px",
  borderRadius: "999px",
  background: "#e5e7eb",
  color: "#111827",
  textDecoration: "none",
  fontWeight: "900",
};