"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditRepairCasePage() {
  const params = useParams();
  const router = useRouter();

  const [form, setForm] = useState(null);
  const [detailImages, setDetailImages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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

    const { data: images } = await supabase
      .from("repair_case_images")
      .select("*")
      .eq("repair_case_id", params.id)
      .order("sort_order", { ascending: true });

    setDetailImages(images || []);
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

    if (["title", "branch", "device", "model", "symptom"].includes(name)) {
      nextForm.seo_keyword = makeSeoKeyword(nextForm);
      nextForm.alt_text = makeAltText(nextForm);
    }

    setForm(nextForm);
  }

  async function uploadFile(file, folder = "repair-cases") {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from("repair-images")
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("repair-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleMainImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setMessage("");

      const publicUrl = await uploadFile(file, "repair-cases-main");

      setForm({
        ...form,
        image_url: publicUrl,
      });

      setMessage("대표사진 업로드 완료");
    } catch (error) {
      console.error(error);
      setMessage("대표사진 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDetailImagesUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploading(true);
      setMessage("");

      for (let i = 0; i < files.length; i++) {
        const publicUrl = await uploadFile(files[i], "repair-cases-detail");

        const sortOrder = detailImages.length + i + 1;

        await supabase.from("repair_case_images").insert([
          {
            repair_case_id: Number(params.id),
            image_url: publicUrl,
            description: "",
            alt_text: `${form.title || "수리사례"} 상세 이미지 ${sortOrder}`,
            sort_order: sortOrder,
          },
        ]);
      }

      setMessage("상세사진 추가 완료");
      await loadData();
    } catch (error) {
      console.error(error);
      setMessage("상세사진 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  }

  function handleDetailInputChange(id, field, value) {
    setDetailImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, [field]: value } : img))
    );
  }

  async function handleSaveDetailImage(image) {
    const { error } = await supabase
      .from("repair_case_images")
      .update({
        description: image.description || "",
        alt_text: image.alt_text || "",
        sort_order: Number(image.sort_order || 0),
      })
      .eq("id", image.id);

    if (error) {
      console.error(error);
      setMessage("상세사진 설명 저장 중 오류가 발생했습니다.");
      return;
    }

    setMessage("상세사진 설명 저장 완료");
    await loadData();
  }

  async function handleDeleteDetailImage(id) {
    if (!confirm("이 상세사진을 삭제할까요?")) return;

    const { error } = await supabase
      .from("repair_case_images")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setMessage("상세사진 삭제 중 오류가 발생했습니다.");
      return;
    }

    setMessage("상세사진 삭제 완료");
    await loadData();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

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
      setMessage("수정 중 오류가 발생했습니다.");
      return;
    }

    setMessage("수리사례가 수정되었습니다.");
  }

  if (loading) {
    return <main style={{ padding: "50px" }}>불러오는 중...</main>;
  }

  if (!form) {
    return <main style={{ padding: "50px" }}>데이터를 찾을 수 없습니다.</main>;
  }

  return (
    <main style={{ maxWidth: "1000px", margin: "60px auto", padding: "20px" }}>
      <h1 style={{ fontSize: "38px", marginBottom: "12px" }}>
        수리사례 수정
      </h1>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>제목</label>
        <input name="title" value={form.title || ""} onChange={handleChange} style={inputStyle} />

        <label style={labelStyle}>SEO 주소</label>
        <input name="slug" value={form.slug || ""} onChange={handleChange} style={inputStyle} />

        <label style={labelStyle}>카테고리</label>
        <select name="category" value={form.category || "애플"} onChange={handleChange} style={inputStyle}>
          <option>애플</option>
          <option>마이크로소프트 서피스</option>
          <option>노트북 및 태블릿</option>
        </select>

        <label style={labelStyle}>지점</label>
        <select name="branch" value={form.branch || "강변점"} onChange={handleChange} style={inputStyle}>
          <option>강변점</option>
          <option>선릉점</option>
          <option>신도림점</option>
        </select>

        <label style={labelStyle}>기기</label>
        <input name="device" value={form.device || ""} onChange={handleChange} style={inputStyle} />

        <label style={labelStyle}>모델명</label>
        <input name="model" value={form.model || ""} onChange={handleChange} style={inputStyle} />

        <label style={labelStyle}>증상</label>
        <input name="symptom" value={form.symptom || ""} onChange={handleChange} style={inputStyle} />

        <label style={labelStyle}>대표 이미지 변경</label>
        <input type="file" accept="image/*" onChange={handleMainImageUpload} style={inputStyle} />

        {form.image_url ? (
          <img src={form.image_url} alt={form.alt_text || form.title} style={previewImageStyle} />
        ) : (
          <div style={noImageStyle}>대표 이미지 없음</div>
        )}

        <label style={labelStyle}>대표 이미지 주소</label>
        <input name="image_url" value={form.image_url || ""} onChange={handleChange} style={inputStyle} />

        <label style={labelStyle}>SEO 키워드</label>
        <input name="seo_keyword" value={form.seo_keyword || ""} onChange={handleChange} style={inputStyle} />

        <label style={labelStyle}>ALT 문구</label>
        <input name="alt_text" value={form.alt_text || ""} onChange={handleChange} style={inputStyle} />

        <label style={labelStyle}>수리 내용</label>
        <textarea
          name="repair_content"
          value={form.repair_content || ""}
          onChange={handleChange}
          style={{ ...inputStyle, minHeight: "260px" }}
        />

        <button type="submit" disabled={saving} style={buttonStyle}>
          {saving ? "저장 중..." : "기본 정보 저장"}
        </button>
      </form>

      <section style={detailSectionStyle}>
        <h2>상세사진 관리</h2>

        <p style={{ color: "#64748b", lineHeight: 1.7 }}>
          여러 장을 한 번에 선택해 추가할 수 있습니다. 각 사진마다 설명, ALT 문구, 순서를 수정할 수 있습니다.
        </p>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleDetailImagesUpload}
          style={inputStyle}
        />

        {uploading && <p style={{ fontWeight: "800" }}>업로드 중...</p>}

        <div style={{ marginTop: "24px" }}>
          {detailImages.length > 0 ? (
            detailImages.map((image, index) => (
              <div key={image.id} style={detailCardStyle}>
                {image.image_url && (
                  <img src={image.image_url} alt={image.alt_text || ""} style={detailImageStyle} />
                )}

                <label style={labelStyle}>사진 순서</label>
                <input
                  type="number"
                  value={image.sort_order || index + 1}
                  onChange={(e) =>
                    handleDetailInputChange(image.id, "sort_order", e.target.value)
                  }
                  style={inputStyle}
                />

                <label style={labelStyle}>사진 설명</label>
                <textarea
                  value={image.description || ""}
                  onChange={(e) =>
                    handleDetailInputChange(image.id, "description", e.target.value)
                  }
                  style={{ ...inputStyle, minHeight: "90px" }}
                  placeholder="예: 액정 파손 상태를 확인한 사진입니다."
                />

                <label style={labelStyle}>ALT 문구</label>
                <input
                  value={image.alt_text || ""}
                  onChange={(e) =>
                    handleDetailInputChange(image.id, "alt_text", e.target.value)
                  }
                  style={inputStyle}
                />

                <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                  <button
                    type="button"
                    onClick={() => handleSaveDetailImage(image)}
                    style={smallSaveButtonStyle}
                  >
                    사진 정보 저장
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteDetailImage(image.id)}
                    style={smallDeleteButtonStyle}
                  >
                    사진 삭제
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>등록된 상세사진이 없습니다.</p>
          )}
        </div>
      </section>

      {message && <p style={{ fontWeight: "900", marginTop: "20px" }}>{message}</p>}

      <div style={{ marginTop: "30px" }}>
        <a href="/admin/repair-cases/list" style={listButtonStyle}>
          수리사례 관리로 돌아가기
        </a>
      </div>
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
  width: "100%",
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

const detailSectionStyle = {
  marginTop: "36px",
  background: "#ffffff",
  padding: "30px",
  borderRadius: "18px",
  border: "1px solid #e5e7eb",
};

const detailCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "20px",
  marginBottom: "22px",
  background: "#f8fafc",
};

const detailImageStyle = {
  width: "100%",
  maxHeight: "360px",
  objectFit: "cover",
  borderRadius: "14px",
  marginBottom: "16px",
};

const smallSaveButtonStyle = {
  padding: "12px 16px",
  border: "none",
  borderRadius: "999px",
  background: "#1e3a8a",
  color: "white",
  fontWeight: "900",
  cursor: "pointer",
};

const smallDeleteButtonStyle = {
  padding: "12px 16px",
  border: "none",
  borderRadius: "999px",
  background: "#dc2626",
  color: "white",
  fontWeight: "900",
  cursor: "pointer",
};

const listButtonStyle = {
  display: "inline-block",
  padding: "14px 22px",
  borderRadius: "999px",
  background: "#e5e7eb",
  color: "#111827",
  textDecoration: "none",
  fontWeight: "900",
};