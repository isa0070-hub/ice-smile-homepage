import { supabase } from "@/lib/supabase";


function AdminBackButtons() {
  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
      <a
        href="/admin"
        style={{
          display: "inline-block",
          padding: "10px 14px",
          borderRadius: "10px",
          backgroundColor: "#f1f5f9",
          color: "#111827",
          textDecoration: "none",
          fontWeight: 800,
          border: "1px solid #cbd5e1",
        }}
      >
        ← 관리자 메인
      </a>
      <a
        href="/admin/repair-cases"
        style={{
          display: "inline-block",
          padding: "10px 14px",
          borderRadius: "10px",
          backgroundColor: "#2563eb",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 800,
        }}
      >
        + 수리사례등록
      </a>
      <a
        href="/admin/repair-cases/list"
        style={{
          display: "inline-block",
          padding: "10px 14px",
          borderRadius: "10px",
          backgroundColor: "#fff",
          color: "#2563eb",
          textDecoration: "none",
          fontWeight: 800,
          border: "1px solid #bfdbfe",
        }}
      >
        수리사례목록
      </a>
    </div>
  )
}


export default async function RepairCaseListPage() {
  const { data: cases } = await supabase
    .from("repair_cases")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main style={{ maxWidth: "1200px", margin: "60px auto", padding: "20px" }}>
      <AdminBackButtons />
      <h1 style={{ fontSize: "42px", marginBottom: "30px" }}>
        수리사례 관리
      </h1>

      {cases && cases.length > 0 ? (
        cases.map((item) => (
          <div key={item.id} style={listBoxStyle}>
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.alt_text || item.title || "수리사례 이미지"}
                style={thumbStyle}
              />
            ) : (
              <div style={noImageStyle}>이미지 없음</div>
            )}

            <div style={{ flex: 1 }}>
              <h2>{item.title || "제목 없음"}</h2>
              <p>
                {item.branch || "지점 없음"} · {item.category || "카테고리 없음"}
              </p>
              <p>{item.device || "기기 없음"}</p>
              <p>{item.symptom || "증상 없음"}</p>
              <p style={{ color: "#64748b" }}>
                {item.seo_keyword || "SEO 키워드 없음"}
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <a
                href={`/admin/repair-cases/edit/${item.id}`}
                style={editButtonStyle}
              >
                수정
              </a>

              <a
                href={`/admin/repair-cases/delete/${item.id}`}
                style={deleteButtonStyle}
              >
                삭제
              </a>
            </div>
          </div>
        ))
      ) : (
        <p>등록된 수리사례가 없습니다.</p>
      )}
    </main>
  );
}

const listBoxStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "20px",
  marginBottom: "20px",
  display: "flex",
  gap: "20px",
  alignItems: "center",
};

const thumbStyle = {
  width: "180px",
  height: "120px",
  objectFit: "cover",
  borderRadius: "12px",
};

const noImageStyle = {
  width: "180px",
  height: "120px",
  borderRadius: "12px",
  background: "#f1f5f9",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
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