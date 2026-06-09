"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DeleteRepairCasePage() {
  const params = useParams();
  const router = useRouter();

  const [item, setItem] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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
      setMessage("삭제할 수리사례를 찾을 수 없습니다.");
      setLoading(false);
      return;
    }

    setItem(data);
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("정말 이 수리사례를 삭제할까요?")) {
      return;
    }

    setDeleting(true);
    setMessage("");

    await supabase
      .from("repair_case_images")
      .delete()
      .eq("repair_case_id", params.id);

    const { error } = await supabase
      .from("repair_cases")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error(error);
      setMessage("삭제 중 오류가 발생했습니다.");
      setDeleting(false);
      return;
    }

    setMessage("삭제 완료되었습니다.");

    setTimeout(() => {
      router.push("/admin/repair-cases/list");
    }, 800);
  }

  if (loading) {
    return (
      <main style={{ padding: "50px" }}>
        <h2>불러오는 중...</h2>
      </main>
    );
  }

  if (!item) {
    return (
      <main style={{ padding: "50px" }}>
        <h2>{message || "데이터를 찾을 수 없습니다."}</h2>
        <a href="/admin/repair-cases/list" style={backButtonStyle}>
          목록으로 돌아가기
        </a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "800px", margin: "70px auto", padding: "20px" }}>
      <div style={boxStyle}>
        <h1 style={{ fontSize: "36px", marginBottom: "16px", color: "#dc2626" }}>
          수리사례 삭제
        </h1>

        <p style={{ fontSize: "18px", lineHeight: 1.7 }}>
          아래 수리사례를 정말 삭제하시겠습니까?
        </p>

        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.alt_text || item.title || "수리사례 이미지"}
            style={imageStyle}
          />
        ) : (
          <div style={noImageStyle}>이미지 없음</div>
        )}

        <div style={infoStyle}>
          <h2>{item.title || "제목 없음"}</h2>
          <p>{item.branch || "지점 없음"} · {item.category || "카테고리 없음"}</p>
          <p>기기 : {item.device || "기기 없음"}</p>
          <p>모델명 : {item.model || "모델명 없음"}</p>
          <p>증상 : {item.symptom || "증상 없음"}</p>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            style={deleteButtonStyle}
          >
            {deleting ? "삭제 중..." : "삭제하기"}
          </button>

          <a href="/admin/repair-cases/list" style={cancelButtonStyle}>
            취소
          </a>
        </div>

        {message && (
          <p style={{ marginTop: "18px", fontWeight: "800" }}>
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

const boxStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "30px",
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
};

const imageStyle = {
  width: "100%",
  maxHeight: "320px",
  objectFit: "cover",
  borderRadius: "16px",
  marginTop: "20px",
};

const noImageStyle = {
  height: "220px",
  borderRadius: "16px",
  background: "#f1f5f9",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  marginTop: "20px",
};

const infoStyle = {
  background: "#f8fafc",
  borderRadius: "16px",
  padding: "20px",
  marginTop: "20px",
  lineHeight: 1.8,
};

const deleteButtonStyle = {
  padding: "14px 22px",
  border: "none",
  borderRadius: "999px",
  background: "#dc2626",
  color: "white",
  fontSize: "16px",
  fontWeight: "900",
  cursor: "pointer",
};

const cancelButtonStyle = {
  display: "inline-block",
  padding: "14px 22px",
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