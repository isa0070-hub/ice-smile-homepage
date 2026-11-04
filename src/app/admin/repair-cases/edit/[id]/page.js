"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminFetch } from "@/lib/adminClient";
import {
  buildRepairCaseMainAlt,
  parseRepairCaseContentSections,
} from "@/lib/repairCaseAuthoring";

function normalizeComparableText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasStoredContentSections(value) {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;

  const normalized = String(value).trim().toLowerCase();
  return !new Set(["", "[]", "{}", "null"]).has(normalized);
}

function toNullableInteger(value) {
  if (value === "" || value === null || value === undefined) return null;

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export default function EditRepairCasePage() {
  const params = useParams();

  const [form, setForm] = useState(null);
  const [detailImages, setDetailImages] = useState([]);
  const [contentSections, setContentSections] = useState([]);
  const [contentSectionsDirty, setContentSectionsDirty] = useState(false);
  const [contentSectionsWarning, setContentSectionsWarning] = useState("");
  const [slugEditing, setSlugEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([
        adminFetch(`/api/admin/content/repair-cases/${params.id}`),
        adminFetch(
          `/api/admin/content/repair-case-images?repairCaseId=${encodeURIComponent(params.id)}`,
        ),
      ])
      .then(([caseResult, imageResult]) => {
        if (!active) return;

        const rawSections = caseResult.data?.content_sections;
        const normalizedSections = parseRepairCaseContentSections(rawSections);

        setForm(caseResult.data);
        setDetailImages(imageResult.data || []);
        setContentSections(normalizedSections);
        setContentSectionsDirty(false);
        setSlugEditing(false);
        setContentSectionsWarning(
          hasStoredContentSections(rawSections) && normalizedSections.length === 0
            ? "기존 본문 구성을 안전하게 해석하지 못했습니다. 기본 정보는 저장할 수 있지만, 본문 구성은 원본 보호를 위해 변경하지 않습니다."
            : "",
        );
      })
      .catch((error) => {
        if (!active) return;
        console.error(error);
        setMessage(error.message || "수리사례를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  async function reloadDetailImages() {
    const result = await adminFetch(
      `/api/admin/content/repair-case-images?repairCaseId=${encodeURIComponent(params.id)}`,
    );
    const images = result.data || [];
    setDetailImages(images);
    return images;
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
    return normalizeComparableText(nextForm.symptom);
  }

  function makeAltText(nextForm) {
    return buildRepairCaseMainAlt({
      ...nextForm,
      repairAction: nextForm.seo_keyword || nextForm.symptom,
    });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    const previousForm = form;

    const nextForm = {
      ...form,
      [name]: value,
    };

    // 검색엔진에 이미 수집된 공개 주소가 끊기지 않도록 제목을 수정해도
    // 기존 slug는 유지합니다. SEO 주소 입력란을 직접 수정한 경우에만
    // 공개 URL이 변경됩니다.

    // 관리자가 직접 다듬은 문구는 보존하고, 비어 있거나 기존 자동 생성값인
    // 경우에만 관련 입력값을 따라 다시 생성합니다.
    if (
      [
        "title",
        "branch",
        "device",
        "model",
        "symptom",
      ].includes(name)
    ) {
      const previousKeyword = normalizeComparableText(previousForm.seo_keyword);
      const previousAutomaticKeyword = normalizeComparableText(
        makeSeoKeyword(previousForm),
      );
      const previousAlt = normalizeComparableText(previousForm.alt_text);
      const previousAutomaticAlt = normalizeComparableText(
        makeAltText(previousForm),
      );

      if (!previousKeyword || previousKeyword === previousAutomaticKeyword) {
        nextForm.seo_keyword = makeSeoKeyword(nextForm);
      }

      if (!previousAlt || previousAlt === previousAutomaticAlt) {
        nextForm.alt_text = makeAltText(nextForm);
      }
    }

    setForm(nextForm);
  }

  function enableSlugEditing() {
    if (slugEditing) {
      setSlugEditing(false);
      return;
    }

    const confirmed = window.confirm(
      "SEO 주소를 바꾸면 네이버에 수집된 기존 주소가 끊길 수 있습니다. 그래도 주소 수정을 허용할까요?",
    );

    if (confirmed) {
      setSlugEditing(true);
    }
  }

  function handleContentSectionChange(index, field, value) {
    setContentSections((previousSections) =>
      previousSections.map((section, sectionIndex) =>
        sectionIndex === index
          ? {
              ...section,
              [field]: value,
            }
          : section,
      ),
    );
    setContentSectionsDirty(true);
    setContentSectionsWarning("");
  }

  function addProcessSection() {
    setContentSections((previousSections) => {
      const closingIndex = previousSections.findIndex(
        (section) => section?.type === "closing",
      );
      const processSections = previousSections.filter(
        (section) => section?.type !== "closing",
      );
      const lastImageEnd = processSections.reduce(
        (largest, section) =>
          Math.max(largest, Number(section?.image_end) || 0),
        0,
      );
      const imageStart =
        detailImages.length > lastImageEnd ? lastImageEnd + 1 : 0;
      const imageEnd = imageStart
        ? Math.min(imageStart + 2, detailImages.length)
        : 0;
      const nextSection = {
        title: "수리 과정",
        content: "",
        image_start: imageStart,
        image_end: imageEnd,
      };

      if (closingIndex === -1) {
        return [...previousSections, nextSection];
      }

      return [
        ...previousSections.slice(0, closingIndex),
        nextSection,
        ...previousSections.slice(closingIndex),
      ];
    });
    setContentSectionsDirty(true);
    setContentSectionsWarning("");
  }

  function addClosingSection() {
    if (contentSections.some((section) => section?.type === "closing")) return;

    setContentSections((previousSections) => [
      ...previousSections,
      {
        type: "closing",
        title: "마무리 및 지점안내",
        content: "",
        image_start: null,
        image_end: null,
      },
    ]);
    setContentSectionsDirty(true);
    setContentSectionsWarning("");
  }

  function removeContentSection(index) {
    if (!window.confirm("이 본문 구간을 삭제할까요?")) return;

    setContentSections((previousSections) =>
      previousSections.filter((_, sectionIndex) => sectionIndex !== index),
    );
    setContentSectionsDirty(true);
    setContentSectionsWarning("");
  }

  async function uploadFile(file, folder = "repair-cases") {
    const prepareResponse = await fetch("/api/r2-upload-url", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType: String(file.type || "").toLowerCase(),
        fileSize: file.size,
        slug: form.slug || makeSlug(form.title || "") || "repair-case",
        imageRole: folder.includes("detail") ? "detail" : "main",
      }),
    });
    const prepareResult = await prepareResponse.json().catch(() => null);

    if (!prepareResponse.ok || !prepareResult?.success) {
      throw new Error(
        prepareResult?.message || "이미지 업로드 주소를 준비하지 못했습니다.",
      );
    }

    const uploadResponse = await fetch(prepareResult.uploadUrl, {
      method: "PUT",
      headers: prepareResult.uploadHeaders,
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`이미지 업로드에 실패했습니다. (${uploadResponse.status})`);
    }

    return prepareResult.publicUrl;
  }

  async function handleMainImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setMessage("");

      const publicUrl = await uploadFile(file, "repair-cases-main");

      setForm((previousForm) => ({
        ...previousForm,
        image_url: publicUrl,
      }));

      setMessage("대표사진 업로드 완료 · 아래 기본 정보 저장을 눌러 반영해주세요.");
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
      const nextSortOrder =
        detailImages.reduce((largest, image, index) => {
          const parsedOrder = Number(image?.sort_order);
          const currentOrder = Number.isFinite(parsedOrder)
            ? parsedOrder
            : index;

          return Math.max(largest, currentOrder);
        }, -1) + 1;

      for (let i = 0; i < files.length; i++) {
        const publicUrl = await uploadFile(files[i], "repair-cases-detail");

        const sortOrder = nextSortOrder + i;

        await adminFetch("/api/admin/content/repair-case-images", {
          method: "POST",
          body: JSON.stringify({
            repair_case_id: Number(params.id),
            image_url: publicUrl,
            description: "",
            alt_text: `${form.title || "수리사례"} 상세 사진 ${sortOrder + 1}`,
            sort_order: sortOrder,
          }),
        });
      }

      await reloadDetailImages();
      setMessage(
        contentSections.length > 0
          ? "상세사진 추가 완료 · 본문 구성의 사진 시작·끝 번호도 확인해주세요."
          : "상세사진 추가 완료",
      );
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
    try {
      await adminFetch(`/api/admin/content/repair-case-images/${image.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          image_url: image.image_url,
          description: image.description || "",
          alt_text: image.alt_text || "",
          sort_order: Number(image.sort_order || 0),
        }),
      });

      setMessage("상세사진 설명 저장 완료");
      await reloadDetailImages();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "상세사진 설명 저장 중 오류가 발생했습니다.");
    }
  }

  async function handleDeleteDetailImage(id) {
    if (!confirm("이 상세사진을 삭제할까요?")) return;

    try {
      await adminFetch(`/api/admin/content/repair-case-images/${id}`, {
        method: "DELETE",
      });

      await reloadDetailImages();
      setMessage(
        contentSections.length > 0
          ? "상세사진 삭제 완료 · 본문 구성의 사진 시작·끝 번호도 확인해주세요."
          : "상세사진 삭제 완료",
      );
    } catch (error) {
      console.error(error);
      setMessage(error.message || "상세사진 삭제 중 오류가 발생했습니다.");
    }
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
    const normalizedContentSections = contentSections.map((section) => {
      const isClosing = section?.type === "closing";

      return {
        ...(isClosing ? { type: "closing" } : {}),
        title: String(section?.title || "").trim(),
        content: String(section?.content || "").trim(),
        image_start: isClosing
          ? null
          : toNullableInteger(section?.image_start),
        image_end: isClosing ? null : toNullableInteger(section?.image_end),
      };
    });

    try {
      const result = await adminFetch(`/api/admin/content/repair-cases/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({
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
          blog_url: finalForm.blog_url || "",
          blog_title: finalForm.blog_title || "",
          ...(contentSectionsDirty
            ? { content_sections: normalizedContentSections }
            : {}),
        }),
      });

      setForm(result.data);
      if (contentSectionsDirty) {
        setContentSections(
          parseRepairCaseContentSections(result.data?.content_sections),
        );
      }
      setContentSectionsDirty(false);
      setSlugEditing(false);
      setMessage("수리사례가 수정되었습니다.");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
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
        <div style={inlineFieldStyle}>
          <input
            name="slug"
            value={form.slug || ""}
            onChange={handleChange}
            readOnly={!slugEditing}
            aria-describedby="slug-edit-warning"
            style={{
              ...inputStyle,
              background: slugEditing ? "#ffffff" : "#e2e8f0",
            }}
          />
          <button type="button" onClick={enableSlugEditing} style={secondaryButtonStyle}>
            {slugEditing ? "주소 잠그기" : "주소 수정"}
          </button>
        </div>

        <p id="slug-edit-warning" style={fieldHelpStyle}>
          발행된 주소는 네이버 검색 결과와 연결되어 있으므로 기본적으로 잠겨 있습니다.
        </p>

        {slugEditing && (
          <div style={warningBoxStyle}>
            주소를 저장하면 기존 검색 URL이 끊길 수 있습니다. 오탈자처럼 꼭 필요한
            경우에만 변경해주세요.
          </div>
        )}

        <label style={labelStyle}>네이버 블로그 링크</label>
        <input
          name="blog_url"
          value={form.blog_url || ""}
          onChange={handleChange}
          placeholder="https://blog.naver.com/..."
          style={inputStyle}
        />

        <label style={labelStyle}>블로그 글 제목</label>
        <input
          name="blog_title"
          value={form.blog_title || ""}
          onChange={handleChange}
          style={inputStyle}
        />

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

        <details style={advancedDetailsStyle}>
          <summary style={advancedSummaryStyle}>고급 설정 · SEO 문구와 대표 ALT</summary>

          <div style={advancedDetailsBodyStyle}>
            <label style={labelStyle}>내부 SEO 키워드</label>
            <input
              name="seo_keyword"
              value={form.seo_keyword || ""}
              onChange={handleChange}
              style={inputStyle}
            />

            <p style={fieldHelpStyle}>
              검색 노출을 보장하는 입력란이 아닙니다. 실제 사례와 맞는 짧은 표현만
              사용해주세요.
            </p>

            <label style={labelStyle}>대표 이미지 ALT 문구</label>
            <input
              name="alt_text"
              value={form.alt_text || ""}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        </details>

        <label style={labelStyle}>수리 내용</label>
        <textarea
          name="repair_content"
          value={form.repair_content || ""}
          onChange={handleChange}
          style={{ ...inputStyle, minHeight: "260px" }}
        />

        <section style={contentEditorStyle}>
          <div style={contentEditorHeaderStyle}>
            <div>
              <p style={sectionEyebrowStyle}>공개 글의 수리 과정</p>
              <h2 style={sectionHeadingStyle}>본문 구성 수정</h2>
            </div>

            <div style={sectionActionWrapStyle}>
              <button type="button" onClick={addProcessSection} style={secondaryButtonStyle}>
                과정 구간 추가
              </button>
              {!contentSections.some((section) => section?.type === "closing") && (
                <button type="button" onClick={addClosingSection} style={secondaryButtonStyle}>
                  마무리 구간 추가
                </button>
              )}
            </div>
          </div>

          <p style={fieldHelpStyle}>
            사진 번호는 아래 상세사진의 정렬 결과를 기준으로 1부터 셉니다. 사진을
            추가·삭제하거나 순서를 바꾼 뒤에는 각 구간의 시작·끝 번호를 확인해주세요.
            연결할 사진이 없는 구간은 시작과 끝을 모두 0으로 둡니다.
          </p>

          {contentSectionsWarning && (
            <div style={warningBoxStyle}>{contentSectionsWarning}</div>
          )}

          {contentSections.length === 0 ? (
            <div style={emptySectionStyle}>
              구조화된 본문 구간이 없습니다. 기존 수리 내용은 그대로 유지되며, 필요한
              경우에만 과정 구간을 추가하세요.
            </div>
          ) : (
            <div style={contentSectionListStyle}>
              {contentSections.map((section, sectionIndex) => {
                const isClosing = section?.type === "closing";

                return (
                  <article key={`content-section-${sectionIndex}`} style={contentSectionCardStyle}>
                    <div style={contentSectionCardHeaderStyle}>
                      <strong>
                        {isClosing ? "마무리 구간" : `수리 과정 ${sectionIndex + 1}`}
                      </strong>
                      <button
                        type="button"
                        onClick={() => removeContentSection(sectionIndex)}
                        style={removeSectionButtonStyle}
                      >
                        구간 삭제
                      </button>
                    </div>

                    <label style={labelStyle}>소제목</label>
                    <input
                      value={section.title || ""}
                      onChange={(event) =>
                        handleContentSectionChange(
                          sectionIndex,
                          "title",
                          event.target.value,
                        )
                      }
                      style={inputStyle}
                    />

                    <label style={labelStyle}>설명</label>
                    <textarea
                      value={section.content || ""}
                      onChange={(event) =>
                        handleContentSectionChange(
                          sectionIndex,
                          "content",
                          event.target.value,
                        )
                      }
                      style={{ ...inputStyle, minHeight: "150px" }}
                    />

                    {!isClosing && (
                      <div style={rangeGridStyle}>
                        <div>
                          <label style={labelStyle}>사진 시작 번호</label>
                          <input
                            type="number"
                            min="0"
                            value={section.image_start ?? ""}
                            onChange={(event) =>
                              handleContentSectionChange(
                                sectionIndex,
                                "image_start",
                                event.target.value,
                              )
                            }
                            style={inputStyle}
                          />
                        </div>

                        <div>
                          <label style={labelStyle}>사진 끝 번호</label>
                          <input
                            type="number"
                            min="0"
                            value={section.image_end ?? ""}
                            onChange={(event) =>
                              handleContentSectionChange(
                                sectionIndex,
                                "image_end",
                                event.target.value,
                              )
                            }
                            style={inputStyle}
                          />
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <button type="submit" disabled={saving || uploading} style={buttonStyle}>
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

                <label style={labelStyle}>사진 순서 (0부터 시작)</label>
                <input
                  type="number"
                  min="0"
                  value={image.sort_order ?? index}
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

const inlineFieldStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: "10px",
  alignItems: "center",
};

const secondaryButtonStyle = {
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid #93c5fd",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontWeight: "800",
  cursor: "pointer",
};

const fieldHelpStyle = {
  margin: "0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.65,
};

const warningBoxStyle = {
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid #f59e0b",
  background: "#fffbeb",
  color: "#92400e",
  lineHeight: 1.65,
  fontWeight: "700",
};

const advancedDetailsStyle = {
  marginTop: "10px",
  border: "1px solid #cbd5e1",
  borderRadius: "14px",
  background: "#ffffff",
};

const advancedSummaryStyle = {
  padding: "14px 16px",
  color: "#334155",
  fontWeight: "800",
  cursor: "pointer",
};

const advancedDetailsBodyStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  padding: "0 16px 18px",
};

const contentEditorStyle = {
  marginTop: "18px",
  padding: "22px",
  borderRadius: "16px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
};

const contentEditorHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap",
};

const sectionEyebrowStyle = {
  margin: "0 0 4px",
  color: "#2563eb",
  fontWeight: "800",
  fontSize: "13px",
};

const sectionHeadingStyle = {
  margin: "0",
  fontSize: "24px",
};

const sectionActionWrapStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const emptySectionStyle = {
  marginTop: "16px",
  padding: "18px",
  borderRadius: "12px",
  background: "#f8fafc",
  color: "#475569",
  lineHeight: 1.7,
};

const contentSectionListStyle = {
  display: "grid",
  gap: "16px",
  marginTop: "18px",
};

const contentSectionCardStyle = {
  padding: "18px",
  borderRadius: "14px",
  border: "1px solid #dbeafe",
  background: "#f8fbff",
};

const contentSectionCardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "10px",
};

const removeSectionButtonStyle = {
  padding: "8px 12px",
  borderRadius: "9px",
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#be123c",
  fontWeight: "800",
  cursor: "pointer",
};

const rangeGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
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
