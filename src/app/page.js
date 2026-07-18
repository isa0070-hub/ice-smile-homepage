import PhoneContactButton from "@/components/PhoneContactButton";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "수리전문 공식서비스센터 | 아이폰 아이패드 맥북 서피스 노트북 수리",
  description:
    "아이폰, 아이패드, 맥북, 애플워치, 마이크로소프트 서피스, 레노버, LG그램 노트북 및 태블릿 수리 전문 서비스센터입니다.",

  alternates: {
    canonical: "/",
  },
};

function maskName(name) {
  if (!name) return "고객";
  if (name.length <= 1) return name + "*";
  return name[0] + "*".repeat(name.length - 1);
}

function maskPhone(phone) {
  if (!phone) return "연락처 비공개";
  const onlyNumber = phone.replace(/[^0-9]/g, "");
  if (onlyNumber.length < 8) return "연락처 비공개";
  return onlyNumber.slice(0, 3) + "-****-" + onlyNumber.slice(-4);
}

function maskText(text) {
  if (!text) return "증상 확인중";
  if (text.length <= 8) return text[0] + "***";
  return text.slice(0, 8) + "...";
}

export default async function Home() {
  const { data: latestCases } = await supabase
  .from("repair_cases")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(8);

  const { data: contacts } = await supabase
    .from("online_inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(7);

  return (
    <main style={{ fontFamily: "Arial, sans-serif", color: "#111827" }}>
      <section className="home-hero" style={heroSectionStyle}>
        
      <p
  className="home-hero-label"
  style={{
    fontSize: "24px",
    marginBottom: "18px",
    opacity: 0.95,
    textShadow: "0 2px 10px rgba(0,0,0,0.5)",
  }}
>
          아이스마일어게인
        </p>

        <h1
  className="home-hero-title"
  style={{
    fontSize: "62px",
    marginBottom: "24px",
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 1.15,
    textShadow: "0 4px 20px rgba(0,0,0,0.6)",
  }}
>
  <span className="home-hero-title-desktop">
    수리전문 공식서비스센터
  </span>

  <span className="home-hero-title-mobile">
    <span>수리전문 공식</span>
    <span>서비스센터</span>
  </span>
</h1>

        <p
  className="home-hero-subtitle"
  style={{
    fontSize: "28px",
    color: "#fff",
    WebkitTextStroke: "2px rgba(0,0,0,0.05)",
    textShadow: "0 2px 10px rgba(0,0,0,0.45)",
  }}
>
  아이폰 · 아이패드 · 맥북 · 애플워치 · 서피스 · 레노버 · LG그램 전문 수리
</p>

<div className="home-hero-buttons" style={{ marginTop: "32px" }}>
<a
  href="https://talk.naver.com/WCH5S2X"
  target="_blank"
  rel="noreferrer"
  style={buttonStyle}
>
  네이버톡톡 문의
</a>

<a href="/contact" style={buttonStyle}>
  온라인 수리문의
</a>

<PhoneContactButton buttonStyle={buttonStyle} />

<a
  href="https://pf.kakao.com/_ftxmXX/chat"
  target="_blank"
  rel="noreferrer"
  style={kakaoButtonStyle}
>
  카카오톡 문의
</a>

<a
  href="/branches"
  className="mobile-only-branch-button"
  style={buttonStyle}
>
  지점안내
</a>
        </div>
      </section>

      <section id="repair-items" style={sectionStyle}>
        <h2 style={titleStyle}>수리 가능 품목</h2>

        <div style={gridStyle}>
          <a
            href="/repair-cases?category=애플"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <div style={cardStyle}>
              <img
                src="/images/apple-repair.jpg"
                alt="애플 아이폰 아이패드 맥북 애플워치 수리 이미지"
                style={imageStyle}
              />
              <h3>애플 제품 수리</h3>
              <p>아이폰 액정교체 / 배터리교체 / 뒷유리교체</p>
              <p>아이패드 액정교체 / 배터리교체</p>
              <p>맥북 액정교체 / 배터리교체</p>
              <p>애플워치 액정수리</p>
            </div>
          </a>

          <a
            href="/repair-cases?category=마이크로소프트%20서피스"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <div style={cardStyle}>
              <img
                src="/images/microsoft-surface.jpg"
                alt="마이크로소프트 서피스 액정 배터리 수리 이미지"
                style={imageStyle}
              />
              <h3>마이크로소프트 서피스 수리</h3>
              <p>서피스프로 액정교체</p>
              <p>서피스 배터리교체</p>
              <p>서피스북 / 서피스랩탑 수리</p>
              <p>방문 및 택배 접수 가능</p>
            </div>
          </a>

          <a
            href="/repair-cases?category=노트북%20및%20태블릿"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <div style={cardStyle}>
              <img
                src="/images/notebook-tablet.jpg"
                alt="레노버 LG 노트북 태블릿 수리 이미지"
                style={imageStyle}
              />
              <h3>레노버 LG 노트북 태블릿 수리</h3>
              <p>레노버 노트북 수리</p>
              <p>LG그램 수리</p>
              <p>삼성 노트북 수리</p>
              <p>액정교체 / 배터리교체 / 전원불량 점검</p>
            </div>
          </a>
        </div>
      </section>

      <section
  style={{
    ...sectionStyle,
    paddingTop: "20px",
  }}
>
  <h2 style={titleStyle}>최근 수리사례</h2>

  <div style={gridStyle}>
    {latestCases && latestCases.length > 0 ? (
      latestCases.map((item) => (
        <a
          key={item.id}
          href={`/repair-cases/${item.slug}`}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          <div style={cardStyle}>
            <img
              src={item.image_url}
              alt={item.alt_text || item.title}
              style={imageStyle}
            />

            <h3>{item.title}</h3>
            <p>{item.branch}</p>
          </div>
        </a>
      ))
    ) : (
      <p style={{ textAlign: "center" }}>등록된 수리사례가 없습니다.</p>
    )}
  </div>
</section>
      <section style={{ ...sectionStyle, background: "#f8fafc" }}>
        <h2 style={titleStyle}>최근 온라인 접수 현황</h2>

        <p style={{ textAlign: "center", marginBottom: "30px", color: "#475569" }}>
          개인정보 보호를 위해 이름과 연락처, 증상 일부는 가려서 표시됩니다.
        </p>

        <div style={{ display: "grid", gap: "12px" }}>
          {contacts && contacts.length > 0 ? (
            contacts.map((item) => (
              <div key={item.id} style={listCardStyle}>
                <strong>
  {maskName(item.customer_name)} 고객님 / {item.preferred_branch || "지점 선택"}
</strong>

                <span>
                  {item.device || "기기 확인중"} · {item.model || "모델 확인중"}
                </span>

                <span>증상 : {maskText(item.symptom)}</span>

                <span>연락처 : {maskPhone(item.phone)}</span>

                <span>접수방식 : 온라인접수</span>
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center" }}>아직 접수된 내역이 없습니다.</p>
          )}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={titleStyle}>온라인 접수 · 상담 가능</h2>

        <p style={{ textAlign: "center", fontSize: "18px", lineHeight: 1.8 }}>
          방문 전 기종과 증상을 남겨주시면 수리 가능 여부, 예상 비용,
          소요 시간, 방문 또는 택배 접수 방법을 빠르게 안내드립니다.
        </p>

        <div style={{ textAlign: "center", marginTop: "28px" }}>
          <a href="/contact" style={darkButtonStyle}>
            온라인 수리문의 하기
          </a>
        </div>
      </section>

      <section style={{ ...sectionStyle, background: "#f1f5f9" }}>
        <h2 style={titleStyle}>강변점 · 선릉점 · 신도림점 지점안내</h2>

        <div style={gridStyle}>
        <div style={cardStyle}>
  <a
    href="https://map.naver.com/p/entry/place/31476004"
    target="_blank"
    rel="noreferrer"
  >
    <img
      src="/images/gangbyeon-branch.jpg"
      alt="아이스마일어게인 강변점 강변테크노마트 지점 이미지"
      style={branchImageStyle}
    />
  </a>

  <h3>강변점</h3>
    <p>서울특별시 광진구 광나루로56길 85</p>
    <p>강변테크노마트 5층 B-20호</p>
    <p>
      <a href="tel:02-3424-5295" style={phoneStyle}>
        📞 02-3424-5295
      </a>
    </p>
  </div>

  <div style={cardStyle}>
  <a
  href="https://map.naver.com/p/entry/place/20557661"
  target="_blank"
  rel="noreferrer"
>
  <img
    src="/images/seolleung-branch.jpg"
    alt="아이스마일어게인 선릉점 선릉역 1번 출구 지점 이미지"
    style={branchImageStyle}
  />
</a>
    <h3>선릉점</h3>
    <p>서울특별시 강남구 테헤란로 406</p>
    <p>샹제리제센터 A동 406호</p>
    <p>선릉역 1번 출구 바로 옆 1분 거리</p>
    <p>
      <a href="tel:02-554-5295" style={phoneStyle}>
        📞 02-554-5295
      </a>
    </p>
  </div>

  <div style={cardStyle}>
  <a
  href="https://map.naver.com/p/entry/place/13486497"
  target="_blank"
  rel="noreferrer"
>
  <img
    src="/images/sindorim-branch.jpg"
    alt="아이스마일어게인 신도림점 신도림테크노마트 지점 이미지"
    style={branchImageStyle}
  />
</a>
    <h3>신도림점</h3>
    <p>서울특별시 구로구 새말로 97</p>
    <p>신도림테크노마트 9층 57-1번 기둥</p>
    <p>
      <a href="tel:02-2111-8899" style={phoneStyle}>
        📞 02-2111-8899
      </a>
    </p>
  </div>
</div>
      </section>
    </main>
  );
}

const heroSectionStyle = {
  color: "white",
  padding: "90px 24px",
  textAlign: "center",
  backgroundImage:
    "linear-gradient(rgba(15,23,42,0.35), rgba(15,23,42,0.45)), url('/images/hero-iphone-repair.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  minHeight: "600px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  animation: "heroSlide 24s infinite",
};
const sectionStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
  padding: "70px 24px",
};

const titleStyle = {
  fontSize: "34px",
  textAlign: "center",
  marginBottom: "34px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "22px",
};

const cardStyle = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "26px",
  lineHeight: 1.7,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
  height: "100%",
};

const imageStyle = {
  width: "100%",
  height: "220px",
  objectFit: "cover",
  objectPosition: "center",
  background: "#f8fafc",
  borderRadius: "14px",
  marginBottom: "18px",
};

const listCardStyle = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "16px 20px",
  lineHeight: 1.6,
  display: "flex",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap",
};

const buttonStyle = {
  display: "inline-block",
  margin: "8px",
  padding: "14px 22px",
  background: "white",
  color: "#1e3a8a",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "800",
};

const darkButtonStyle = {
  display: "inline-block",
  padding: "15px 28px",
  background: "#0f172a",
  color: "white",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "800",
};

const phoneStyle = {
  color: "#1e3a8a",
  fontWeight: "900",
  textDecoration: "none",
};
const branchImageStyle = {
    width: "100%",
    height: "180px",
    objectFit: "cover",
    borderRadius: "14px",
    marginBottom: "18px",
    background: "#f8fafc",
  };
  
  const kakaoButtonStyle = {
    display: "inline-block",
    margin: "8px",
    padding: "14px 22px",
    background: "#FEE500",
    color: "#191919",
    borderRadius: "999px",
    textDecoration: "none",
    fontWeight: "800",
  };
  const branchButtonStyle = {
    display: "inline-block",
    margin: "8px",
    padding: "14px 22px",
    background: "#1e3a8a",
    color: "#ffffff",
    borderRadius: "999px",
    textDecoration: "none",
    fontWeight: "800",
  };