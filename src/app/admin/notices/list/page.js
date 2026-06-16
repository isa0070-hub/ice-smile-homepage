import { supabase } from "@/lib/supabase";

export default async function AdminNoticeListPage() {
  const { data: notices } = await supabase
    .from("notices")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <main style={{ maxWidth: "1000px", margin: "60px auto", padding: "20px" }}>
      <h1 style={{ fontSize: "38px", marginBottom: "24px" }}>
        공지사항 관리
      </h1>

      <div style={{ marginBottom: "24px" }}>
        <a href="/admin/notices" style={addButtonStyle}>
          공지사항 새로 등록
        </a>
      </div>

      <div style={listStyle}>
        {notices && notices.length > 0 ? (
          notices.map((item) => (
            <div key={item.id} style={cardStyle}>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#1e3a8a", fontWeight: "900" }}>
                  {item.is_pinned ? "📌 중요공지" : "공지사항"}
                </p>

                <h2 style={{ marginBottom: "8px" }}>{item.title}</h2>

                <p style={{ color: "#64748b" }}>
                  {new Date(item.created_at).toLocaleDateString("ko-KR")}
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <a
                  href={`/admin/notices/edit/${item.id}`}
                  style={editButtonStyle}
                >
                  수정
                </a>

                <a
                  href={`/admin/notices/delete/${item.id}`}
                  style={deleteButtonStyle}
                >
                  삭제
                </a>
              </div>
            </div>
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

const cardStyle = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
};

const addButtonStyle = {
  display: "inline-block",
  padding: "14px 20px",
  background: "#1e3a8a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const editButtonStyle = {
  padding: "10px 16px",
  background: "#1e3a8a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const deleteButtonStyle = {
  padding: "10px 16px",
  background: "#dc2626",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const emptyStyle = {
  padding: "40px",
  textAlign: "center",
  borderRadius: "18px",
  background: "#f8fafc",
  color: "#64748b",
  fontWeight: "800",
};