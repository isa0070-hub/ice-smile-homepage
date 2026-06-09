import { supabase } from "@/lib/supabase";

export default async function RepairCasesPage({ searchParams }) {
  const currentParams = await searchParams;
  const category = currentParams?.category || "전체";

  let query = supabase
    .from("repair_cases")
    .select("*")
    .order("created_at", { ascending: false });

  if (category !== "전체") {
    query = query.eq("category", category);
  }

  const { data: cases } = await query;

  const categories = ["전체", "애플", "마이크로소프트 서피스", "노트북 및 태블릿"];

  return (
    <main style={{ maxWidth: "1180px", margin: "70px auto", padding: "24px" }}>
      <h1 style={{ fontSize: "42px", marginBottom: "16px" }}>수리사례</h1>

      <p style={{ fontSize: "18px", lineHeight: 1.8, marginBottom: "26px" }}>
        아이폰, 아이패드, 맥북, 애플워치, 마이크로소프트 서피스,
        레노버, LG그램 등 다양한 수리사례를 확인할 수 있습니다.
      </p>

      <div style={categoryWrapStyle}>
        {categories.map((item) => (
          <a
            key={item}
            href={
              item === "전체"
                ? "/repair-cases"
                : `/repair-cases?category=${encodeURIComponent(item)}`
            }
            style={{
              ...categoryButtonStyle,
              background: category === item ? "#1e3a8a" : "white",
              color: category === item ? "white" : "#1e3a8a",
            }}
          >
            {item}
          </a>
        ))}
      </div>

      <div style={gridStyle}>
        {cases && cases.length > 0 ? (
          cases.map((item) => (
            <article key={item.id} style={cardStyle}>
              {item.image_url ? (
                <a href={`/repair-cases/${item.slug}`}>
                  <img
                    src={item.image_url}
                    alt={item.alt_text || item.title || "수리사례 이미지"}
                    style={imageStyle}
                  />
                </a>
              ) : (
                <div style={noImageStyle}>이미지 없음</div>
              )}

              <p style={{ color: "#1e3a8a", fontWeight: "800" }}>
                {item.branch || "지점"} · {item.category || "카테고리"}
              </p>

              <a
                href={`/repair-cases/${item.slug}`}
                style={{ color: "#111827", textDecoration: "none" }}
              >
                <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>
                  {item.title || "제목 없음"}
                </h2>
              </a>

              <p>
                {item.device || "기기"} · {item.model || "모델명"}
              </p>

              <p>증상 : {item.symptom || "증상 확인중"}</p>

              <p style={{ color: "#475569" }}>
                대표 키워드 : {item.seo_keyword || "키워드 없음"}
              </p>

              <p style={{ lineHeight: 1.7 }}>
                {item.repair_content
                  ? `${item.repair_content.slice(0, 90)}...`
                  : "수리 내용 준비중입니다."}
              </p>

              <a href={`/repair-cases/${item.slug}`} style={detailButtonStyle}>
                자세히 보기
              </a>
            </article>
          ))
        ) : (
          <p>등록된 수리사례가 없습니다.</p>
        )}
      </div>

      <FloatingButtons />
    </main>
  );
}

function FloatingButtons() {
  return (
    <div style={floatingMenuStyle}>
      <a
        href="https://talk.naver.com/WCH5S2X"
        target="_blank"
        style={floatingTalkButtonStyle}
      >
        <span style={floatingIconStyle}>💬</span>
        <span>톡톡</span>
      </a>

      <a href="tel:02-3424-5295" style={floatingPhoneButtonStyle}>
        <span style={floatingIconStyle}>📞</span>
        <span>전화</span>
      </a>
    </div>
  );
}

const categoryWrapStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "34px",
};

const categoryButtonStyle = {
  display: "inline-block",
  padding: "12px 18px",
  border: "1px solid #1e3a8a",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "22px",
};

const cardStyle = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
};

const imageStyle = {
  width: "100%",
  height: "190px",
  objectFit: "cover",
  borderRadius: "14px",
  marginBottom: "16px",
};

const noImageStyle = {
  width: "100%",
  height: "190px",
  borderRadius: "14px",
  background: "#f1f5f9",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  marginBottom: "16px",
};

const detailButtonStyle = {
  display: "inline-block",
  marginTop: "14px",
  padding: "10px 16px",
  background: "#1e3a8a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "800",
};

const floatingMenuStyle = {
  position: "fixed",
  right: "22px",
  bottom: "28px",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const floatingTalkButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  width: "118px",
  height: "48px",
  background: "#03c75a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
  fontSize: "15px",
  boxShadow: "0 8px 22px rgba(3, 199, 90, 0.28)",
};

const floatingPhoneButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  width: "118px",
  height: "48px",
  background: "#ffffff",
  color: "#1e3a8a",
  border: "1px solid #dbeafe",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
  fontSize: "15px",
  boxShadow: "0 8px 22px rgba(15, 23, 42, 0.12)",
};

const floatingIconStyle = {
  fontSize: "18px",
};
