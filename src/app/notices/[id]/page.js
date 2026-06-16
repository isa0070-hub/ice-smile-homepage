import { supabase } from "@/lib/supabase";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  const { data: notice } = await supabase
    .from("notices")
    .select("*")
    .eq("id", resolvedParams.id)
    .single();

  return {
    title: notice
      ? `${notice.title} | 공지사항`
      : "공지사항 | 수리전문 공식서비스센터",
    description: notice?.title || "공지사항 상세페이지",
  };
}

export default async function NoticeDetailPage({ params }) {
  const resolvedParams = await params;

  const { data: notice } = await supabase
    .from("notices")
    .select("*")
    .eq("id", resolvedParams.id)
    .single();

  if (!notice) {
    return (
      <main
        style={{
          maxWidth: "900px",
          margin: "80px auto",
          padding: "24px",
        }}
      >
        <h1>공지사항을 찾을 수 없습니다.</h1>

        <a href="/notices" style={backButtonStyle}>
          공지사항 목록으로
        </a>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "80px auto",
        padding: "24px",
      }}
    >
      <p
        style={{
          color: "#1e3a8a",
          fontWeight: "900",
          marginBottom: "14px",
        }}
      >
        {notice.is_pinned ? "📌 중요공지" : "공지사항"}
      </p>

      <h1
        style={{
          fontSize: "42px",
          lineHeight: 1.3,
          marginBottom: "16px",
        }}
      >
        {notice.title}
      </h1>

      <p
        style={{
          color: "#64748b",
          marginBottom: "34px",
        }}
      >
        작성일 :
        {" "}
        {new Date(notice.created_at).toLocaleDateString("ko-KR")}
      </p>

      <div style={contentStyle}>
        {notice.content}
      </div>

      <div style={{ marginTop: "40px" }}>
        <a href="/notices" style={backButtonStyle}>
          공지사항 목록으로
        </a>
      </div>
    </main>
  );
}

const contentStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "30px",
  lineHeight: 1.9,
  fontSize: "18px",
  whiteSpace: "pre-wrap",
};

const backButtonStyle = {
  display: "inline-block",
  padding: "14px 22px",
  background: "#1e3a8a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};