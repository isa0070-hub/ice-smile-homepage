"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminNoticeEditPage() {
  const params = useParams();
  const router = useRouter();

  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotice();
  }, []);

  async function loadNotice() {
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      console.error(error);
      setMessage("공지사항을 불러오지 못했습니다.");
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
      .from("notices")
      .update({
        title: form.title,
        content: form.content,
        is_pinned: form.is_pinned,
      })
      .eq("id", params.id);

    setSaving(false);

    if (error) {
      console.error(error);
      setMessage("공지사항 수정 중 오류가 발생했습니다.");
      return;
    }

    setMessage("공지사항이 수정되었습니다.");

    setTimeout(() => {
      router.push("/admin/notices/list");
    }, 700);
  }

  if (!form) {
    return <main style={{ padding: "50px" }}>불러오는 중...</main>;
  }

  return (
    <main style={{ maxWidth: "900px", margin: "60px auto", padding: "20px" }}>
      <h1 style={{ fontSize: "38px", marginBottom: "24px" }}>
        공지사항 수정
      </h1>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>제목</label>
        <input
          name="title"
          value={form.title || ""}
          onChange={handleChange}
          style={inputStyle}
          required
        />

        <label style={labelStyle}>내용</label>
        <textarea
          name="content"
          value={form.content || ""}
          onChange={handleChange}
          style={{ ...inputStyle, minHeight: "260px" }}
          required
        />

        <label style={checkStyle}>
          <input
            type="checkbox"
            name="is_pinned"
            checked={form.is_pinned || false}
            onChange={handleChange}
          />
          중요공지로 고정
        </label>

        <button type="submit" disabled={saving} style={buttonStyle}>
          {saving ? "수정 중..." : "공지사항 수정 저장"}
        </button>

        <a href="/admin/notices/list" style={listButtonStyle}>
          공지사항 관리로 돌아가기
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
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "16px",
  width: "100%",
  boxSizing: "border-box",
};

const checkStyle = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
  fontWeight: "900",
  marginTop: "12px",
};

const buttonStyle = {
  marginTop: "24px",
  padding: "16px",
  border: "none",
  borderRadius: "999px",
  background: "#1e3a8a",
  color: "white",
  fontSize: "17px",
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