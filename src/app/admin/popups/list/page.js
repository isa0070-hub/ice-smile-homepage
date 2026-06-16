import { supabase } from "@/lib/supabase";

export default async function PopupListPage() {
  const { data: popups } = await supabase
    .from("popup_notices")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main
      style={{
        maxWidth: "1100px",
        margin: "60px auto",
        padding: "20px",
      }}
    >
      <h1
        style={{
          fontSize: "42px",
          marginBottom: "24px",
        }}
      >
        팝업 관리
      </h1>

      <div style={{ marginBottom: "20px" }}>
        <a href="/admin/popups" style={newButtonStyle}>
          새 팝업 등록
        </a>
      </div>

      {popups && popups.length > 0 ? (
        popups.map((item) => (
          <div key={item.id} style={cardStyle}>
            <div style={{ flex: 1 }}>
              <h2>{item.title}</h2>

              <p>
                상태 :
                {" "}
                {item.is_active ? "🟢 활성" : "🔴 비활성"}
              </p>

              <p>
                위치 :
                {" "}
                {item.position}
              </p>

              <p>
                크기 :
                {" "}
                {item.width}px × {item.height}px
              </p>

              <p style={{ color: "#64748b" }}>
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString("ko-KR")
                  : ""}
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <a
                href={`/admin/popups/edit/${item.id}`}
                style={editButtonStyle}
              >
                수정
              </a>

              <a
                href={`/admin/popups/delete/${item.id}`}
                style={deleteButtonStyle}
              >
                삭제
              </a>
            </div>
          </div>
        ))
      ) : (
        <div style={emptyStyle}>
          등록된 팝업이 없습니다.
        </div>
      )}
    </main>
  );
}

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "20px",
  marginBottom: "16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "white",
};

const newButtonStyle = {
  display: "inline-block",
  padding: "12px 18px",
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
  borderRadius: "10px",
  textDecoration: "none",
};

const deleteButtonStyle = {
  padding: "10px 16px",
  background: "#dc2626",
  color: "white",
  borderRadius: "10px",
  textDecoration: "none",
};

const emptyStyle = {
  padding: "40px",
  textAlign: "center",
  background: "#f8fafc",
  borderRadius: "18px",
};