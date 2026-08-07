import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";

const BASE_URL = "https://www.ismileagain.co.kr";

const getNotice = cache(async (id) => {
  const { data } = await supabase
    .from("notices")
    .select("id, title, content, is_pinned, created_at")
    .eq("id", id)
    .maybeSingle();

  return data || null;
});

function makeDescription(notice) {
  const content = String(notice?.content || "")
    .replace(/\s+/g, " ")
    .trim();
  const fallback = notice?.title
    ? `${notice.title}에 대한 아이스마일어게인 안내입니다.`
    : "아이스마일어게인 공지사항 상세페이지입니다.";
  const description = content || fallback;

  return description.length > 155
    ? `${description.slice(0, 154)}…`
    : description;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const notice = await getNotice(resolvedParams.id);
  const canonicalUrl = `${BASE_URL}/notices/${encodeURIComponent(
    String(resolvedParams.id),
  )}`;

  if (!notice) {
    return {
      title: "공지사항을 찾을 수 없습니다 | 아이스마일어게인",
      description: makeDescription(null),
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${notice.title} | 아이스마일어게인 공지사항`;
  const description = makeDescription(notice);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "아이스마일어게인",
      locale: "ko_KR",
      type: "article",
      publishedTime: notice.created_at || undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function NoticeDetailPage({ params }) {
  const resolvedParams = await params;
  const notice = await getNotice(resolvedParams.id);

  if (!notice) {
    notFound();
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
        <Link href="/notices" style={backButtonStyle}>
          공지사항 목록으로
        </Link>
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
