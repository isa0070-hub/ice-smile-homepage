"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function PopupCreatePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    content: "",
    image_url: "",
    position: "center",
    custom_x: 0,
    custom_y: 0,
    width: 500,
    height: 600,
    is_active: true,
    show_today_close: true,
    sort_order: 0,
  });

  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setMessage("");

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `popups/${fileName}`;

      const { error } = await supabase.storage
        .from("popup-images")
        .upload(filePath, file);

      if (error) {
        console.error(error);
        setMessage("이미지 업로드 실패: popup-images 버킷/권한을 확인해 주세요.");
        return;
      }

      const { data } = supabase.storage
        .from("popup-images")
        .getPublicUrl(filePath);

      setForm((prev) => ({
        ...prev,
        image_url: data.publicUrl,
      }));

      setMessage("이미지 업로드 완료");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.from("popup_notices").insert([
      {
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
      },
    ]);

    if (error) {
      console.error(error);
      setMessage("팝업 등록 실패");
      return;
    }

    setMessage("팝업 등록 완료");

    setTimeout(() => {
      router.push("/admin/popups/list");
    }, 700);
  }

  return (
    <main style={{ maxWidth: "900px", margin: "60px auto", padding: "20px" }}>
      <h1 style={{ fontSize: "40px", marginBottom: "30px" }}>팝업 등록</h1>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>팝업 제목</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          style={inputStyle}
          required
        />

        <label style={labelStyle}>팝업 내용</label>
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          style={{ ...inputStyle, minHeight: "160px" }}
        />

        <label style={labelStyle}>팝업 이미지 업로드</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={inputStyle}
        />

        {uploading && <p style={{ fontWeight: "900" }}>이미지 업로드 중...</p>}

        {form.image_url && (
          <img
            src={form.image_url}
            alt={form.title || "팝업 이미지"}
            style={previewImageStyle}
          />
        )}

        <label style={labelStyle}>이미지 주소</label>
        <input
          name="image_url"
          value={form.image_url}
          onChange={handleChange}
          style={inputStyle}
        />

        <label style={labelStyle}>팝업 위치</label>
        <select
          name="position"
          value={form.position}
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
              value={form.custom_x}
              onChange={handleChange}
              style={inputStyle}
            />

            <label style={labelStyle}>Y 위치</label>
            <input
              type="number"
              name="custom_y"
              value={form.custom_y}
              onChange={handleChange}
              style={inputStyle}
            />
          </>
        )}

        <label style={labelStyle}>가로 크기</label>
        <input
          type="number"
          name="width"
          value={form.width}
          onChange={handleChange}
          style={inputStyle}
        />

        <label style={labelStyle}>세로 크기</label>
        <input
          type="number"
          name="height"
          value={form.height}
          onChange={handleChange}
          style={inputStyle}
        />

        <label style={labelStyle}>정렬 순서</label>
        <input
          type="number"
          name="sort_order"
          value={form.sort_order}
          onChange={handleChange}
          style={inputStyle}
        />

        <label style={checkStyle}>
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          팝업 활성화
        </label>

        <label style={checkStyle}>
          <input
            type="checkbox"
            name="show_today_close"
            checked={form.show_today_close}
            onChange={handleChange}
          />
          오늘 하루 보지 않기 사용
        </label>

        <button type="submit" style={buttonStyle}>
          팝업 등록
        </button>

        <a href="/admin/popups/list" style={listButtonStyle}>
          팝업 관리로 이동
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