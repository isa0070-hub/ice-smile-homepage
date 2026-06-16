"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminNoticeDeletePage() {
  const params = useParams();
  const router = useRouter();

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

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
      setMessage("공지사항을 찾을 수 없습니다.");
      setLoading(false);
      return;
    }

    setNotice(data);
    setLoading(false);
  }

  async function handleDelete() {
    const confirmDelete = confirm("정말 이 공지사항을 삭제하시겠습니까?");

    if (!confirmDelete) return;

    setDeleting(true);
    setMessage("");

    const { error } = await supabase
      .from("notices")
      .delete()
      .eq("id", params.id);

    setDeleting(false);

    if (error) {
      console.error(error);
      setMessage("삭제 중 오류가 발생했습니다.");
      return;
    }

    setMessage("공지사항이 삭제되었습니다.");

    setTimeout(() => {
      router.push("/admin/notices/list");
    }, 800);
  }

  if (loading) {
    return (
      <main style={{ padding: "50px" }}>
        <h2>불러오는 중...</h2>
      </main>
    );
  }

  if (!notice) {
    return (
      <main style={{ padding: "50px" }}>
        <h2>{message || "공지사항을 찾을 수 없습니다."}</h2>

        <a href="/admin/notices/list" style={backButtonStyle}>
          공지사항 관리로 돌아가기
        </a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "800px", margin: "70px auto", padding: "20px" }}>
      <div style={boxStyle}>
        <h1 style={{ fontSize: "36px", marginBottom: "16px", color: "#dc2626" }}>
          공지사항 삭제
        </h1>

        <p style={{ fontSize: "18px", lineHeight: 1.7 }}>
          아래 공지사항을 정말 삭제하시겠습니까?
        </p>

        <div style={infoStyle}>
          <p style={{ color: "#1e3a8a", fontWeight: "900" }}>
            {notice.is_pinned ? "📌 중요공지" : "공지사항"}
          </p>

          <h2>{notice.title || "제목 없음"}</h2>

          <p style={{ color: "#64748b" }}>
            작성일 :{" "}
            {notice.created_at
              ? new Date(notice.created_at).toLocaleDateString("ko-KR")
              : ""}
          </p>

          <p style={{ marginTop: "18px", whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
            {notice.content || "내용 없음"}
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

          <a href="/admin/notices/list" style={cancelButtonStyle}>
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