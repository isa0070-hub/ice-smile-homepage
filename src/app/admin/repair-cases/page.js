"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";


function AdminBackButton() {
  return (
    <div style={{ marginBottom: "16px" }}>
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
        ← 관리자 메인으로 돌아가기
      </a>
    </div>
  )
}

export default function AdminRepairCasesPage() {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "애플",
    branch: "강변점",
    device: "",
    model: "",
    symptom: "",
    repair_content: "",
    seo_keyword: "",
    image_url: "",
    alt_text: "",
  });

  const [detailImages, setDetailImages] = useState([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

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

  function makeAltText(nextForm, index = null) {
    const base = `${nextForm.branch || "수리전문 공식서비스센터"} ${
      nextForm.device || "기기"
    } ${nextForm.model || ""} ${
      nextForm.symptom || "수리"
    } 수리사례 이미지 ${nextForm.title || ""}`.trim();

    return index === null ? base : `${base} 상세사진 ${index + 1}`;
  }

  function handleChange(e) {
    const { name, value } = e.target;

    const nextForm = {
      ...form,
      [name]: value,
    };

    nextForm.slug = makeSlug(nextForm.title);
    nextForm.seo_keyword = makeSeoKeyword(nextForm);
    nextForm.alt_text = makeAltText(nextForm);

    setForm(nextForm);
  }

  async function uploadSingleFile(file) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    const filePath = `repair-cases/${fileName}`;

    const { error } = await supabase.storage
      .from("repair-images")
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from("repair-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleMainImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    try {
      const publicUrl = await uploadSingleFile(file);

      setForm({
        ...form,
        image_url: publicUrl,
      });

      setMessage("대표 이미지 업로드 완료");
    } catch (error) {
      console.error(error);
      setMessage("대표 이미지 업로드 중 오류가 발생했습니다.");
    }

    setUploading(false);
  }

  async function handleDetailImagesUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setMessage("");

    try {
      const uploadedImages = [];

      for (let i = 0; i < files.length; i++) {
        const publicUrl = await uploadSingleFile(files[i]);
        const imageIndex = detailImages.length + i;

        uploadedImages.push({
          image_url: publicUrl,
          alt_text: makeAltText(form, imageIndex),
          sort_order: imageIndex,
        });
      }

      setDetailImages([...detailImages, ...uploadedImages]);
      setMessage(`${files.length}장 상세 이미지 업로드 완료`);
    } catch (error) {
      console.error(error);
      setMessage("상세 이미지 업로드 중 오류가 발생했습니다.");
    }

    setUploading(false);
  }

  function handleDetailImageTextChange(index, value) {
    const nextImages = detailImages.map((image, i) =>
      i === index
        ? {
            ...image,
            alt_text: value,
          }
        : image
    );

    setDetailImages(nextImages);
  }

  function removeDetailImage(index) {
    const nextImages = detailImages.filter((_, i) => i !== index);
    setDetailImages(nextImages);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    const finalForm = {
      ...form,
      slug: makeSlug(form.title),
      seo_keyword: form.seo_keyword || makeSeoKeyword(form),
      alt_text: form.alt_text || makeAltText(form),
    };

    const { data: insertedCase, error } = await supabase
      .from("repair_cases")
      .insert([finalForm])
      .select()
      .single();

    if (error) {
      console.error(error);
      setMessage(
        "등록 중 오류가 발생했습니다. SEO 주소 중복 또는 입력값을 확인해주세요."
      );
      return;
    }

    if (detailImages.length > 0) {
      const imageRows = detailImages.map((image, index) => ({
        repair_case_id: insertedCase.id,
        image_url: image.image_url,
        alt_text: image.alt_text,
        sort_order: index,
      }));

      const { error: imageError } = await supabase
        .from("repair_case_images")
        .insert(imageRows);

      if (imageError) {
        console.error(imageError);
        setMessage("수리사례는 등록됐지만 상세 이미지 저장 중 오류가 발생했습니다.");
        return;
      }
    }

    setMessage("수리사례와 상세 이미지가 등록되었습니다.");

    setForm({
      title: "",
      slug: "",
      category: "애플",
      branch: "강변점",
      device: "",
      model: "",
      symptom: "",
      repair_content: "",
      seo_keyword: "",
      image_url: "",
      alt_text: "",
    });

    setDetailImages([]);
  }

  return (
    <main style={{ maxWidth: "900px", margin: "60px auto", padding: "20px" }}>
      <AdminBackButton />
      <h1 style={{ fontSize: "38px", marginBottom: "12px" }}>
        수리사례 등록
      </h1>

      <p style={{ marginBottom: "26px", color: "#475569", lineHeight: 1.7 }}>
        제목, 지점, 기기, 모델명, 증상을 입력하면 SEO 주소, 대표 SEO 키워드,
        ALT 문구가 자동으로 생성됩니다. 상세 이미지는 사진마다 설명 문구를
        직접 수정할 수 있습니다.
      </p>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>제목</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          style={inputStyle}
          placeholder="예: 선릉점 아이폰15프로 액정파손 교체 수리"
          required
        />

        <label style={labelStyle}>카테고리</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          style={inputStyle}
        >
          <option>애플</option>
          <option>마이크로소프트 서피스</option>
          <option>레노버 LG 노트북 및 태블릿</option>
        </select>

        <label style={labelStyle}>지점</label>
        <select
          name="branch"
          value={form.branch}
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
          value={form.device}
          onChange={handleChange}
          style={inputStyle}
          placeholder="예: 아이폰, 아이패드, 서피스, LG그램"
        />

        <label style={labelStyle}>모델명</label>
        <input
          name="model"
          value={form.model}
          onChange={handleChange}
          style={inputStyle}
          placeholder="예: 아이폰15프로, 서피스프로7"
        />

        <label style={labelStyle}>증상</label>
        <input
          name="symptom"
          value={form.symptom}
          onChange={handleChange}
          style={inputStyle}
          placeholder="예: 액정파손, 배터리 소모 빠름, 전원불량"
        />

        <label style={labelStyle}>대표 이미지 업로드</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleMainImageUpload}
          style={inputStyle}
        />

        {form.image_url && (
          <img
            src={form.image_url}
            alt="대표 이미지 미리보기"
            style={previewImageStyle}
          />
        )}

        <label style={labelStyle}>상세 이미지 여러 장 업로드</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleDetailImagesUpload}
          style={inputStyle}
        />

        {detailImages.length > 0 && (
          <div style={galleryStyle}>
            {detailImages.map((image, index) => (
              <div key={index} style={galleryItemStyle}>
                <img
                  src={image.image_url}
                  alt={image.alt_text}
                  style={galleryImageStyle}
                />

                <label style={smallLabelStyle}>사진 설명 / ALT 문구</label>
                <textarea
                  value={image.alt_text}
                  onChange={(e) =>
                    handleDetailImageTextChange(index, e.target.value)
                  }
                  style={imageTextAreaStyle}
                  placeholder="사진 설명을 입력해주세요."
                />

                <button
                  type="button"
                  onClick={() => removeDetailImage(index)}
                  style={removeButtonStyle}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}

        {uploading && <p>이미지 업로드 중...</p>}

        <label style={labelStyle}>대표 이미지 주소</label>
        <input
          name="image_url"
          value={form.image_url}
          onChange={handleChange}
          style={inputStyle}
          placeholder="대표 이미지 업로드 시 자동 입력됩니다."
        />

        <div style={autoBoxStyle}>
          <strong>자동 생성 SEO 주소</strong>
          <p>{form.slug || "제목을 입력하면 자동 생성됩니다."}</p>
        </div>

        <div style={autoBoxStyle}>
          <strong>자동 생성 대표 SEO 키워드</strong>
          <p>
            {form.seo_keyword ||
              "지점, 기기, 모델명, 증상을 입력하면 자동 생성됩니다."}
          </p>
        </div>

        <div style={autoBoxStyle}>
          <strong>자동 생성 대표 ALT 문구</strong>
          <p>{form.alt_text || "이미지 설명이 자동 생성됩니다."}</p>
        </div>

        <label style={labelStyle}>수리 내용</label>
        <textarea
          name="repair_content"
          value={form.repair_content}
          onChange={handleChange}
          style={{ ...inputStyle, minHeight: "240px" }}
          placeholder="수리 과정, 증상, 작업 내용, 고객 안내 내용을 자세히 입력해주세요."
          required
        />

        <button type="submit" style={buttonStyle}>
          수리사례 등록하기
        </button>

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

const smallLabelStyle = {
  display: "block",
  fontWeight: "800",
  fontSize: "13px",
  padding: "10px 10px 4px",
};

const inputStyle = {
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "16px",
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
  maxHeight: "280px",
  objectFit: "cover",
  borderRadius: "14px",
  marginTop: "10px",
};

const galleryStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginTop: "10px",
};

const galleryItemStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  overflow: "hidden",
  background: "white",
};

const galleryImageStyle = {
  width: "100%",
  height: "150px",
  objectFit: "cover",
  display: "block",
};

const imageTextAreaStyle = {
  width: "100%",
  minHeight: "90px",
  border: "none",
  borderTop: "1px solid #e5e7eb",
  padding: "10px",
  fontSize: "14px",
  lineHeight: 1.5,
  resize: "vertical",
  boxSizing: "border-box",
};

const removeButtonStyle = {
  width: "100%",
  border: "none",
  background: "#dc2626",
  color: "white",
  padding: "9px",
  cursor: "pointer",
  fontWeight: "800",
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