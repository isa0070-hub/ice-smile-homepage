"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


function AdminBackButtons() {
  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
      <a
        href="/admin"
        style={{
          display: "inline-block",
          padding: "10px 14px",
          borderRadius: "10px",
          backgroundColor: "#f1f5f9",
          color: "#111827",
          textDecoration: "none",
          fontWeight: 800,
          border: "1px solid #cbd5e1",
        }}
      >
        ← 관리자 메인
      </a>
      <a
        href="/admin/repair-cases"
        style={{
          display: "inline-block",
          padding: "10px 14px",
          borderRadius: "10px",
          backgroundColor: "#2563eb",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 800,
        }}
      >
        + 수리사례등록
      </a>
      <a
        href="/admin/repair-cases/list"
        style={{
          display: "inline-block",
          padding: "10px 14px",
          borderRadius: "10px",
          backgroundColor: "#fff",
          color: "#2563eb",
          textDecoration: "none",
          fontWeight: 800,
          border: "1px solid #bfdbfe",
        }}
      >
        수리사례목록
      </a>
    </div>
  )
}


export default function EditRepairCasePage() {
  const params = useParams();
  const router = useRouter();

  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data, error } = await supabase
      .from("repair_cases")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      console.error(error);
      setMessage("수리사례를 불러오지 못했습니다.");
      setLoading(false);
      return;
    }

    setForm(data);
    setLoading(false);
  }

  function makeSlug(value) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/[^\w가-힣-]/g, "");
  }

  function makeSeoKeyword(nextForm) {
    return [nextForm.branch, nextForm.device, nextForm.model, nextForm.symptom]
      .filter(Boolean)
      .join(" ");
  }

  function makeAltText(nextForm) {
    return `${nextForm.branch || "수리전문 공식서비스센터"} ${
      nextForm.device || "기기"
    } ${nextForm.model || ""} ${
      nextForm.symptom || "수리"
    } 수리사례 이미지 ${nextForm.title || ""}`.trim();
  }

  function handleChange(e) {
    const { name, value } = e.target;

    const nextForm = {
      ...form,
      [name]: value,
    };

    if (name === "title") {
      nextForm.slug = makeSlug(value);
    }

    nextForm.seo_keyword = makeSeoKeyword(nextForm);
    nextForm.alt_text = makeAltText(nextForm);

    setForm(nextForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    const finalForm = {
      ...form,
      slug: form.slug || makeSlug(form.title || ""),
      seo_keyword: form.seo_keyword || makeSeoKeyword(form),
      alt_text: form.alt_text || makeAltText(form),
    };

    const { error } = await supabase
      .from("repair_cases")
      .update({
        title: finalForm.title,
        slug: finalForm.slug,
        category: finalForm.category,
        branch: finalForm.branch,
        device: finalForm.device,
        model: finalForm.model,
        symptom: finalForm.symptom,
        repair_content: finalForm.repair_content,
        seo_keyword: finalForm.seo_keyword,
        image_url: finalForm.image_url,
        alt_text: finalForm.alt_text,
      })
      .eq("id", params.id);

    setSaving(false);

    if (error) {
      console.error(error);
      setMessage("수정 중 오류가 발생했습니다. SEO 주소 중복 여부를 확인해주세요.");
      return;
    }

    setMessage("수리사례가 수정되었습니다.");

    setTimeout(() => {
      router.push("/admin/repair-cases/list");
    }, 700);
  }

  if (loading) {
    return (
      <main style={{ padding: "50px" }}>
        <h2>불러오는 중...</h2>
      </main>
    );
  }

  if (!form) {
    return (
      <main style={{ padding: "50px" }}>
        <h2>{message || "수리사례를 찾을 수 없습니다."}</h2>
        <a href="/admin/repair-cases/list" style={backButtonStyle}>
          목록으로 돌아가기
        </a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "900px", margin: "60px auto", padding: "20px" }}>
      <AdminBackButtons />
      <h1 style={{ fontSize: "38px", marginBottom: "12px" }}>
        수리사례 수정
      </h1>

      <p style={{ marginBottom: "26px", color: "#475569", lineHeight: 1.7 }}>
        수리사례 제목, 지점, 기기, 모델명, 증상, SEO 키워드, ALT 문구,
        대표 이미지 주소와 수리 내용을 수정할 수 있습니다.
      </p>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>제목</label>
        <input
          name="title"
          value={form.title || ""}
          onChange={handleChange}
          style={inputStyle}
          required
        />

        <label style={labelStyle}>SEO 주소</label>
        <input
          name="slug"
          value={form.slug || ""}
          onChange={handleChange}
          style={inputStyle}
          required
        />

        <label style={labelStyle}>카테고리</label>
        <select
          name="category"
          value={form.category || "애플"}
          onChange={handleChange}
          style={inputStyle}
        >
          <option>애플</option>
          <option>마이크로소프트 서피스</option>
          <option>노트북 및 태블릿</option>
        </select>

        <label style={labelStyle}>지점</label>
        <select
          name="branch"
          value={form.branch || "강변점"}
          onChange={handleChange}
          style={inputStyle}
        >
          <option>강변점</option>
          <option>선릉점</option>
          <option>신도림점</option>
        </select>

        <label style={labelStyle}>기기</label>
        <input
          name="device"
          value={form.device || ""}
          onChange={handleChange}
          style={inputStyle}
        />

        <label style={labelStyle}>모델명</label>
        <input
          name="model"
          value={form.model || ""}
          onChange={handleChange}
          style={inputStyle}
        />

        <label style={labelStyle}>증상</label>
        <input
          name="symptom"
          value={form.symptom || ""}
          onChange={handleChange}
          style={inputStyle}
        />

        <label style={labelStyle}>대표 이미지 주소</label>
        <input
          name="image_url"
          value={form.image_url || ""}
          onChange={handleChange}
          style={inputStyle}
          placeholder="이미지 주소가 있으면 입력해주세요."
        />

        {form.image_url ? (
          <img
            src={form.image_url}
            alt={form.alt_text || form.title || "수리사례 이미지"}
            style={previewImageStyle}
          />
        ) : (
          <div style={noImageStyle}>이미지 없음</div>
        )}

        <div style={autoBoxStyle}>
          <strong>SEO 키워드</strong>
          <input
            name="seo_keyword"
            value={form.seo_keyword || ""}
            onChange={handleChange}
            style={{ ...inputStyle, marginTop: "10px", width: "100%" }}
          />
        </div>

        <div style={autoBoxStyle}>
          <strong>ALT 문구</strong>
          <input
            name="alt_text"
            value={form.alt_text || ""}
            onChange={handleChange}
            style={{ ...inputStyle, marginTop: "10px", width: "100%" }}
          />
        </div>

        <label style={labelStyle}>수리 내용</label>
        <textarea
          name="repair_content"
          value={form.repair_content || ""}
          onChange={handleChange}
          style={{ ...inputStyle, minHeight: "260px" }}
          required
        />

        <button type="submit" disabled={saving} style={buttonStyle}>
          {saving ? "수정 저장 중..." : "수정 저장하기"}
        </button>

        <a href="/admin/repair-cases/list" style={listButtonStyle}>
          목록으로 돌아가기
        </a>

        {message && (
          <p style={{ fontWeight: "800", marginTop: "18px" }}>{message}</p>
        )}
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
  fontWeight: "800",
  marginTop: "10px",
};

const inputStyle = {
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "16px",
  boxSizing: "border-box",
};

const autoBoxStyle = {
  background: "white",
  border: "1px solid #dbeafe",
  borderRadius: "14px",
  padding: "16px",
  lineHeight: 1.6,
};

const previewImageStyle = {
  width: "100%",
  maxHeight: "320px",
  objectFit: "cover",
  borderRadius: "14px",
  marginTop: "10px",
};

const noImageStyle = {
  height: "220px",
  borderRadius: "14px",
  background: "#f1f5f9",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  marginTop: "10px",
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

const backButtonStyle = {
  display: "inline-block",
  marginTop: "20px",
  padding: "12px 18px",
  borderRadius: "999px",
  background: "#1e3a8a",
  color: "white",
  textDecoration: "none",
  fontWeight: "800",
};