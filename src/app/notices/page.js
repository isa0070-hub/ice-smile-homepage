import { supabase } from "@/lib/supabase";

export const metadata = {
  title: "공지사항 | 아이스마일어게인",
  description:
    "아이스마일어게인 독립 스마트기기 수리센터의 지점 운영, 접수, 휴무 및 서비스 관련 안내를 확인하세요.",
  alternates: {
    canonical: "/notices",
  },
  openGraph: {
    title: "공지사항 | 아이스마일어게인",
    description:
      "아이스마일어게인의 지점 운영, 접수, 휴무 및 서비스 관련 안내를 확인하세요.",
    url: "/notices",
    siteName: "아이스마일어게인",
    locale: "ko_KR",
    type: "website",
  },
};

export default async function NoticesPage() {
  const { data: notices } = await supabase
    .from("notices")
    .select("id, title, is_pinned, created_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <main style={{ maxWidth: "960px", margin: "70px auto", padding: "24px" }}>
      <h1 style={{ fontSize: "42px", marginBottom: "14px" }}>공지사항</h1>

      <p style={{ color: "#475569", fontSize: "18px", marginBottom: "34px" }}>
        독립 스마트기기 수리센터의 운영 안내와 중요한 소식을 확인하실 수
        있습니다.
      </p>

      <div style={listStyle}>
        {notices && notices.length > 0 ? (
          notices.map((item) => (
            <a key={item.id} href={`/notices/${item.id}`} style={noticeCardStyle}>
              <div>
                <p style={{ margin: "0 0 8px", color: "#1e3a8a", fontWeight: "900" }}>
                  {item.is_pinned ? "📌 중요공지" : "공지사항"}
                </p>

                <h2 style={{ fontSize: "24px", margin: "0 0 10px" }}>
                  {item.title}
                </h2>

                <p style={{ color: "#64748b", margin: 0 }}>
                  {new Date(item.created_at).toLocaleDateString("ko-KR")}
                </p>
              </div>
            </a>
          ))
        ) : (
          <div style={emptyStyle}>등록된 공지사항이 없습니다.</div>
        )}
      </div>
    </main>
  );
}

const listStyle = {
  display: "grid",
  gap: "16px",
};

const noticeCardStyle = {
  display: "block",
  padding: "24px",
  borderRadius: "18px",
  border: "1px solid #e5e7eb",
  background: "white",
  color: "#111827",
  textDecoration: "none",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
};

const emptyStyle = {
  padding: "40px",
  textAlign: "center",
  borderRadius: "18px",
  background: "#f8fafc",
  color: "#64748b",
  fontWeight: "800",
};
