import { supabase } from "@/lib/supabase";
import PhoneContactButton from "@/components/PhoneContactButton";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.slug);

  const { data: item } = await supabase
    .from("repair_cases")
    .select("*")
    .eq("slug", slug)
    .single();

    return {
      title: item
        ? `${item.title} | 수리전문 공식서비스센터`
        : "수리사례 | 수리전문 공식서비스센터",
    
      description: item
        ? `${item.seo_keyword || item.title} 관련 수리사례입니다. ${
            item.device || ""
          } ${item.model || ""} ${item.symptom || ""}`
        : "수리사례 상세페이지입니다.",
    
      alternates: {
        canonical: item
          ? `/repair-cases/${item.slug}`
          : "/repair-cases",
      },
    };
}

export default async function RepairCaseDetailPage({ params }) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.slug);

  const { data: item } = await supabase
    .from("repair_cases")
    .select("*")
    .eq("slug", slug)
    .single();

  if (item) {
    const nextViews = (item.views || 0) + 1;

    await supabase
      .from("repair_cases")
      .update({ views: nextViews })
      .eq("id", item.id);

    item.views = nextViews;
  }

  const { data: detailImages } = await supabase
    .from("repair_case_images")
    .select("*")
    .eq("repair_case_id", item?.id)
    .order("sort_order", { ascending: true });

  const { data: relatedCases } = await supabase
    .from("repair_cases")
    .select("*")
    .eq("category", item?.category)
    .neq("id", item?.id)
    .order("created_at", { ascending: false })
    .limit(3);

  let phoneNumber = "02-3424-5295";

  if (item?.branch === "선릉점") {
    phoneNumber = "02-554-5295";
  }

  if (item?.branch === "신도림점") {
    phoneNumber = "02-2111-8899";
  }

  if (!item) {
    return (
      <main style={{ maxWidth: "900px", margin: "80px auto", padding: "24px" }}>
        <h1>수리사례를 찾을 수 없습니다.</h1>
        <FloatingButtons phoneNumber={phoneNumber} />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "900px", margin: "80px auto", padding: "24px" }}>
      <p style={{ color: "#1e3a8a", fontWeight: "800" }}>
        {item.branch} · {item.category}
      </p>

      <h1 style={{ fontSize: "42px", lineHeight: 1.3, marginBottom: "20px" }}>
        {item.title}
      </h1>

      <p style={{ fontSize: "18px", color: "#475569", marginBottom: "12px" }}>
        대표 키워드 : {item.seo_keyword}
      </p>

      <p style={{ color: "#64748b", fontWeight: "700", marginBottom: "30px" }}>
        조회수 : {item.views || 0}
      </p>

      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.alt_text || item.title}
          style={mainImageStyle}
        />
      )}

      <section style={infoBoxStyle}>
        <p><strong>기기 :</strong> {item.device}</p>
        <p><strong>모델명 :</strong> {item.model}</p>
        <p><strong>증상 :</strong> {item.symptom}</p>
        <p><strong>지점 :</strong> {item.branch}</p>
        <p>
          <strong>연락처 :</strong>{" "}
          <a href={`tel:${phoneNumber}`} style={phoneLinkStyle}>
            {phoneNumber}
          </a>
        </p>
      </section>

      <section style={contentStyle}>{item.repair_content}</section>

      {item.blog_url && (
  <section style={blogBoxStyle}>
    <p style={blogLabelStyle}>관련 네이버 블로그 후기</p>

    <a
      href={item.blog_url}
      target="_blank"
      rel="noreferrer"
      style={blogTitleLinkStyle}
    >
      {item.blog_title || "네이버 블로그에서 자세히 보기"}
    </a>

    <p style={blogDomainStyle}>blog.naver.com</p>
  </section>
)}
      {item.blog_url && (
  <div style={blogButtonWrapStyle}>
    
  </div>
)}
      {detailImages && detailImages.length > 0 && (
        <section style={detailImageSectionStyle}>
          <h3 style={{ fontSize: "30px", marginBottom: "24px" }}>
            수리 과정 상세 이미지
          </h3>

          {detailImages.map((image, index) => (
            <div key={image.id} style={detailImageCardStyle}>
              {image.image_url && (
                <img
                  src={image.image_url}
                  alt={
                    image.alt_text ||
                    image.description ||
                    `${item.title} 상세 이미지 ${index + 1}`
                  }
                  style={detailImageStyle}
                />
              )}

              <div style={detailTextBoxStyle}>
                <p style={detailImageNumberStyle}>사진 {index + 1}</p>

                <p style={detailDescriptionStyle}>
                  {image.description || "수리 과정 상세 이미지입니다."}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {relatedCases && relatedCases.length > 0 && (
        <section style={relatedBoxStyle}>
          <h3 style={{ fontSize: "28px", marginBottom: "22px" }}>
            함께 보면 좋은 수리사례
          </h3>

          <div style={relatedGridStyle}>
            {relatedCases.map((related) => (
              <a
                key={related.id}
                href={`/repair-cases/${related.slug}`}
                style={relatedCardStyle}
              >
                {related.image_url ? (
                  <img
                    src={related.image_url}
                    alt={related.alt_text || related.title}
                    style={relatedImageStyle}
                  />
                ) : (
                  <div style={relatedNoImageStyle}>이미지 없음</div>
                )}

                <p style={{ color: "#1e3a8a", fontWeight: "800" }}>
                  {related.branch} · {related.category}
                </p>

                <h4 style={{ fontSize: "18px", lineHeight: 1.5 }}>
                  {related.title}
                </h4>
              </a>
            ))}
          </div>
        </section>
      )}

      <section style={contactBoxStyle}>
        <h3 style={{ fontSize: "26px", marginBottom: "12px" }}>
          수리 상담 및 접수
        </h3>

        <p style={{ fontSize: "17px", lineHeight: 1.8, color: "#475569" }}>
          방문 전 문의 주시면 수리 가능 여부, 예상 비용, 소요 시간,
          방문 또는 택배 접수 방법을 빠르게 안내해드립니다.
        </p>

        <div style={{ marginTop: "22px" }}>
          <a
            href="https://talk.naver.com/WCH5S2X"
            target="_blank"
            style={talkContactButtonStyle}
          >
            💬 네이버톡톡 문의
          </a>

          <PhoneContactButton buttonStyle={phoneContactButtonStyle} />

          <a href="/contact" style={onlineContactButtonStyle}>
            📝 온라인 수리문의
          </a>
        </div>
      </section>

      <div style={{ marginTop: "50px" }}>
        <a href="/repair-cases" style={backButtonStyle}>
          수리사례 목록으로
        </a>
      </div>

      <FloatingButtons phoneNumber={phoneNumber} />
    </main>
  );
}

function FloatingButtons({ phoneNumber }) {
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

      {/*
<a href={`tel:${phoneNumber}`} style={floatingPhoneButtonStyle}>
  <span style={floatingIconStyle}>📞</span>
  <span>전화</span>
</a>
*/}
    </div>
  );
}

const mainImageStyle = {
  width: "100%",
  height: "auto",
  maxHeight: "none",
  objectFit: "contain",
  borderRadius: "18px",
  marginBottom: "34px",
  display: "block",
};

const infoBoxStyle = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "24px",
  lineHeight: 1.8,
};

const phoneLinkStyle = {
  color: "#1e3a8a",
  fontWeight: "900",
  textDecoration: "none",
};

const contentStyle = {
  fontSize: "18px",
  lineHeight: 1.9,
  whiteSpace: "pre-wrap",
  marginTop: "34px",
};

const detailImageSectionStyle = {
  marginTop: "60px",
};

const detailImageCardStyle = {
  marginBottom: "34px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  overflow: "hidden",
  boxShadow: "0 8px 22px rgba(15, 23, 42, 0.08)",
};

const detailImageStyle = {
  width: "100%",
  height: "auto",
  maxHeight: "none",
  objectFit: "contain",
  display: "block",
};

const detailTextBoxStyle = {
  padding: "22px",
  background: "#f8fafc",
};

const detailImageNumberStyle = {
  color: "#1e3a8a",
  fontWeight: "900",
  marginBottom: "8px",
};

const detailDescriptionStyle = {
  fontSize: "17px",
  lineHeight: 1.8,
  color: "#334155",
  margin: 0,
  whiteSpace: "pre-wrap",
};

const relatedBoxStyle = {
  marginTop: "60px",
};

const relatedGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
};

const relatedCardStyle = {
  display: "block",
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "16px",
  textDecoration: "none",
  color: "#111827",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
};

const relatedImageStyle = {
  width: "100%",
  height: "140px",
  objectFit: "contain",
  borderRadius: "14px",
  marginBottom: "12px",
};

const relatedNoImageStyle = {
  height: "140px",
  borderRadius: "14px",
  background: "#f1f5f9",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  marginBottom: "12px",
};

const contactBoxStyle = {
  marginTop: "60px",
  padding: "36px",
  borderRadius: "22px",
  background: "linear-gradient(135deg, #f8fafc, #eef6ff)",
  border: "1px solid #dbeafe",
  textAlign: "center",
};

const talkContactButtonStyle = {
  display: "inline-block",
  margin: "6px",
  padding: "14px 20px",
  background: "#03c75a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const phoneContactButtonStyle = {
  display: "inline-block",
  margin: "6px",
  padding: "14px 20px",
  background: "#1e3a8a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const onlineContactButtonStyle = {
  display: "inline-block",
  margin: "6px",
  padding: "14px 20px",
  background: "#111827",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
};

const backButtonStyle = {
  display: "inline-block",
  padding: "14px 22px",
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

const blogButtonWrapStyle = {
  marginTop: "30px",
  textAlign: "center",
};

const blogButtonStyle = {
  display: "inline-block",
  padding: "16px 28px",
  background: "#03c75a",
  color: "#fff",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "900",
  fontSize: "17px",
};

const blogBoxStyle = {
  marginTop: "34px",
  padding: "24px",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  background: "#ffffff",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
};

const blogLabelStyle = {
  margin: "0 0 10px",
  color: "#03c75a",
  fontWeight: "900",
};

const blogTitleLinkStyle = {
  display: "block",
  color: "#111827",
  fontSize: "28px",
  fontWeight: "900",
  lineHeight: 1.5,
  textDecoration: "none",
  padding: "0",
  border: "none",
  background: "transparent",
};

const blogDomainStyle = {
  marginTop: "12px",
  color: "#03c75a",
  fontWeight: "800",
};