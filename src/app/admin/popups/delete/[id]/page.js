"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminFetch } from "@/lib/adminClient";

export default function PopupDeletePage() {
  const params = useParams();
  const router = useRouter();

  const [popup, setPopup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    adminFetch(`/api/admin/content/popups/${params.id}`)
      .then((result) => {
        if (active) setPopup(result.data);
      })
      .catch((error) => {
        if (!active) return;
        console.error(error);
        setMessage(error.message || "삭제할 팝업을 찾을 수 없습니다.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  async function handleDelete() {
    if (!confirm("정말 이 팝업을 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    setMessage("");

    try {
      await adminFetch(`/api/admin/content/popups/${params.id}`, {
        method: "DELETE",
      });

      setMessage("팝업이 삭제되었습니다.");

      setTimeout(() => {
        router.push("/admin/popups/list");
      }, 800);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "팝업 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main style={{ padding: "50px" }}>
        <h2>불러오는 중...</h2>
      </main>
    );
  }

  if (!popup) {
    return (
      <main style={{ padding: "50px" }}>
        <h2>{message || "팝업을 찾을 수 없습니다."}</h2>

        <a href="/admin/popups/list" style={backButtonStyle}>
          팝업 관리로 돌아가기
        </a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "800px", margin: "70px auto", padding: "20px" }}>
      <div style={boxStyle}>
        <h1 style={{ fontSize: "36px", marginBottom: "16px", color: "#dc2626" }}>
          팝업 삭제
        </h1>

        <p style={{ fontSize: "18px", lineHeight: 1.7 }}>
          아래 팝업을 정말 삭제하시겠습니까?
        </p>

        {popup.image_url ? (
          <img
            src={popup.image_url}
            alt={popup.title || "팝업 이미지"}
            style={imageStyle}
          />
        ) : (
          <div style={noImageStyle}>이미지 없음</div>
        )}

        <div style={infoStyle}>
          <h2>{popup.title || "제목 없음"}</h2>

          <p>
            <strong>상태 :</strong>{" "}
            {popup.is_active ? "활성" : "비활성"}
          </p>

          <p>
            <strong>위치 :</strong> {popup.position || "center"}
          </p>

          <p>
            <strong>크기 :</strong> {popup.width || 500}px ×{" "}
            {popup.height || 600}px
          </p>

          <p>
            <strong>내용 :</strong>
          </p>

          <p style={{ whiteSpace: "pre-wrap" }}>
            {popup.content || "내용 없음"}
          </p>
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

          <a href="/admin/popups/list" style={cancelButtonStyle}>
            취소
          </a>
        </div>

        {message && (
          <p style={{ marginTop: "18px", fontWeight: "900" }}>
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
  fontWeight: "900",
};
