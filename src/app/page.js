import PhoneContactButton from "@/components/PhoneContactButton";
import HomeHeroCarousel from "@/components/HomeHeroCarousel";
import Image from "@/components/SiteImage";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  getPublicRepairCasePath,
  isPublicRepairCaseSlug,
} from "@/lib/publicRepairCases";
import {
  branchSeo,
  getBranchLocalBusinessJsonLd,
} from "@/lib/branchSeo";
import {
  getOrganizationJsonLd,
  getWebSiteJsonLd,
} from "@/lib/siteSeo";
import { getLegacyRepairCaseTitle } from "@/lib/legacyRepairCasePresentation";

export const revalidate = 900;

export const metadata = {
  title: "아이폰·아이패드·맥북·서피스 전문 수리센터 | 아이스마일어게인",
  description:
    "강변·선릉·신도림 3개 지점에서 아이폰, 아이패드, 맥북, 애플워치, 서피스, 레노버, LG그램을 점검·수리합니다. 방문 및 전국 택배 접수, 수리 후 기능 검수와 품질보증 안내.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "아이폰·아이패드·맥북·서피스 전문 수리센터 | 아이스마일어게인",
    description:
      "강변·선릉·신도림 3개 지점의 스마트기기 수리 안내와 실제 수리사례를 확인하세요.",
    url: "/",
    siteName: "아이스마일어게인",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/opengraph-image.jpg",
        alt: "아이스마일어게인 스마트기기 수리센터",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "아이폰·아이패드·맥북·서피스 전문 수리센터 | 아이스마일어게인",
    description:
      "강변·선릉·신도림 3개 지점의 스마트기기 수리 안내와 실제 수리사례를 확인하세요.",
  },
};

const deviceServiceLinks = [
  {
    href: "/repair-services/iphone",
    label: "아이폰 액정·배터리·침수 수리",
  },
  {
    href: "/repair-services/ipad",
    label: "아이패드 액정·유리·배터리 수리",
  },
  {
    href: "/repair-services/macbook",
    label: "맥북 액정·배터리·침수 수리",
  },
  {
    href: "/repair-services/lenovo",
    label: "레노버 노트북 수리",
  },
];

function OptimizedImage({
  src,
  alt,
  height = 220,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}) {
  if (!src) {
    return <div style={{ ...imageFrameStyle, height }}>이미지 없음</div>;
  }

  return (
    <div style={{ ...imageFrameStyle, height }}>
      <Image
        src={src}
        alt={alt || "아이스마일어게인 수리 이미지"}
        fill
        sizes={sizes}
        quality={72}
        style={optimizedImageStyle}
      />
    </div>
  );
}

export default async function Home() {
  let latestCases = [];
  let caseDataAvailable = true;

  try {
    const { data, error } = await supabase
      .from("repair_cases")
      .select("id, slug, image_url, alt_text, title, branch")
      .not("slug", "is", null)
      .neq("slug", "")
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      console.error("homepage repair_cases error:", error);
      caseDataAvailable = false;
    } else {
      latestCases = (data || []).filter((item) =>
        isPublicRepairCaseSlug(item?.slug),
      );
    }
  } catch (error) {
    console.error("homepage repair_cases exception:", error);
    caseDataAvailable = false;
  }

  const homeLocalBusinessJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      getWebSiteJsonLd(),
      getOrganizationJsonLd(),
      ...Object.values(branchSeo).map((seo) =>
        getBranchLocalBusinessJsonLd(seo)
      ),
    ],
  };

  return (
    <main style={{ fontFamily: "Arial, sans-serif", color: "#111827" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeLocalBusinessJsonLd).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />
      <section className="home-hero" style={heroSectionStyle}>
        <HomeHeroCarousel />

        <div aria-hidden="true" style={heroOverlayStyle} />

        <div style={heroContentStyle}>
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
              fontSize: "clamp(30px, 5vw, 62px)",
              marginBottom: "24px",
              fontWeight: "900",
              textAlign: "center",
              lineHeight: 1.15,
              textShadow: "0 4px 20px rgba(0,0,0,0.6)",
            }}
          >
            아이폰 · 아이패드 · 맥북 ·{" "}
            <br className="seo-mobile-title-break" aria-hidden="true" />
            <span className="seo-mobile-title-line">
              서피스 전문 수리센터
            </span>
          </h1>

          <p
            className="home-hero-subtitle"
            style={{
              fontSize: "clamp(18px, 2.2vw, 28px)",
              color: "#fff",
              WebkitTextStroke: "2px rgba(0,0,0,0.05)",
              textShadow: "0 2px 10px rgba(0,0,0,0.45)",
            }}
          >
            강변 · 선릉 · 신도림 3개 지점｜방문 · 전국 택배 접수
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

            <Link href="/contact" style={buttonStyle}>
              온라인 수리문의
            </Link>

            <PhoneContactButton buttonStyle={buttonStyle} />

            <a
              href="https://pf.kakao.com/_ftxmXX/chat"
              target="_blank"
              rel="noreferrer"
              style={kakaoButtonStyle}
            >
              카카오톡 문의
            </a>

            <Link
              href="/branches"
              className="mobile-only-branch-button"
              style={buttonStyle}
            >
              지점안내
            </Link>
          </div>
        </div>
      </section>

      <section id="repair-items" style={sectionStyle}>
        <h2 style={titleStyle}>수리 가능 품목</h2>

        <div style={gridStyle}>
          <Link
            href="/repair-services/apple"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <div style={cardStyle}>
              <OptimizedImage
                src="/images/apple-repair.jpg"
                alt="애플 아이폰 아이패드 맥북 애플워치 수리 이미지"
              />

              <h3>애플 제품 수리</h3>
              <p>아이폰 액정교체 / 배터리교체 / 뒷유리교체</p>
              <p>아이패드 액정교체 / 배터리교체</p>
              <p>맥북 액정교체 / 배터리교체</p>
              <p>애플워치 액정수리</p>
            </div>
          </Link>

          <Link
            href="/repair-services/surface"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <div style={cardStyle}>
              <OptimizedImage
                src="/images/microsoft-surface.jpg"
                alt="마이크로소프트 서피스 액정 배터리 수리 이미지"
              />

              <h3>마이크로소프트 서피스 수리</h3>
              <p>서피스프로 액정교체</p>
              <p>서피스 배터리교체</p>
              <p>서피스북 / 서피스랩탑 수리</p>
              <p>방문 및 택배 접수 가능</p>
            </div>
          </Link>

          <Link
            href="/repair-services/notebook-tablet"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <div style={cardStyle}>
              <OptimizedImage
                src="/images/notebook-tablet.jpg"
                alt="레노버 ASUS HP LG 노트북 태블릿 수리 이미지"
              />

              <h3>레노버 ASUS HP LG 노트북 수리</h3>
              <p>레노버 노트북 수리</p>
              <p>ASUS·HP 노트북 수리</p>
              <p>LG그램·삼성 노트북 수리</p>
              <p>액정교체 / 배터리교체 / 전원불량 점검</p>
            </div>
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="device-service-title"
        style={{ ...sectionStyle, paddingTop: "8px" }}
      >
        <div style={trustIntroStyle}>
          <p style={eyebrowStyle}>기기별 상세 안내</p>
          <h2
            id="device-service-title"
            style={{ ...titleStyle, marginBottom: "16px" }}
          >
            모델과 증상에 맞는 수리 정보를 확인하세요
          </h2>
          <p style={sectionDescriptionStyle}>
            기기별 주요 증상, 점검 범위, 실제 수리사례와 방문·택배 접수
            방법을 한 페이지에서 확인할 수 있습니다.
          </p>
        </div>

        <nav aria-label="기기별 수리 안내" style={trustLinkRowStyle}>
          {deviceServiceLinks.map((item) => (
            <Link key={item.href} href={item.href} style={trustLinkStyle}>
              {item.label}
            </Link>
          ))}
        </nav>
      </section>

      <section
        aria-labelledby="repair-standard-title"
        style={{ ...sectionStyle, background: "#f8fafc" }}
      >
        <div style={trustIntroStyle}>
          <p style={eyebrowStyle}>아이스마일어게인 수리 기준</p>

          <h2
            id="repair-standard-title"
            style={{ ...titleStyle, marginBottom: "16px" }}
          >
            진단부터 검수·품질보증까지 확인하고 진행합니다
          </h2>

          <p style={sectionDescriptionStyle}>
            같은 증상이라도 원인이 다를 수 있어 기기 상태와 모델을 먼저
            확인합니다. 수리 가능 여부와 예상 비용·시간을 안내한 뒤 작업하며,
            완료 후 주요 기능을 점검하고 품질보증서를 제공합니다.
          </p>
        </div>

        <div style={trustGridStyle}>
          <article style={trustCardStyle}>
            <span aria-hidden="true" style={stepNumberStyle}>
              01
            </span>

            <h3 style={trustCardTitleStyle}>기기·증상 확인</h3>

            <p style={trustCardTextStyle}>
              모델명과 파손, 침수, 충전, 전원 상태 등을 확인해 필요한 점검
              범위를 정합니다.
            </p>
          </article>

          <article style={trustCardStyle}>
            <span aria-hidden="true" style={stepNumberStyle}>
              02
            </span>

            <h3 style={trustCardTitleStyle}>수리 전 안내</h3>

            <p style={trustCardTextStyle}>
              점검 결과를 바탕으로 수리 가능 여부, 예상 비용과 시간, 부품 재고
              및 접수 방법을 안내합니다.
            </p>
          </article>

          <article style={trustCardStyle}>
            <span aria-hidden="true" style={stepNumberStyle}>
              03
            </span>

            <h3 style={trustCardTitleStyle}>수리·기능 검수</h3>

            <p style={trustCardTextStyle}>
              수리 후 화면, 터치, 충전, 전원 등 작업 부위와 관련된 주요 기능을
              확인합니다.
            </p>
          </article>

          <article style={trustCardStyle}>
            <span aria-hidden="true" style={stepNumberStyle}>
              04
            </span>

            <h3 style={trustCardTitleStyle}>품질보증 안내</h3>

            <p style={trustCardTextStyle}>
              작업 내용과 품질보증 적용 범위를 설명하고 품질보증서를 제공합니다.
            </p>
          </article>
        </div>

        <p style={serviceNoticeStyle}>
          진단 결과, 기기 상태, 부품 재고에 따라 수리 비용과 소요 시간은 달라질
          수 있습니다.
        </p>

        <p style={independentNoticeStyle}>
          아이스마일어게인은 제조사가 직접 운영하거나 공인한 공식 서비스센터가
          아닌 독립 스마트기기 전문 수리센터입니다.
        </p>

        <div style={trustLinkRowStyle}>
          <Link href="/repair-cases" style={trustLinkStyle}>
            실제 수리사례 확인
          </Link>

          <Link href="/branches" style={trustLinkStyle}>
            가까운 지점 확인
          </Link>
        </div>
      </section>

      {caseDataAvailable && (
        <section
          style={{
            ...sectionStyle,
            paddingTop: "20px",
          }}
        >
          <h2 style={titleStyle}>최근 수리사례</h2>

          <div style={gridStyle}>
            {latestCases.length > 0 ? (
              latestCases.map((item) => {
                const reviewedTitle = getLegacyRepairCaseTitle(item.slug);
                const displayTitle = reviewedTitle || item.title;

                return (
                  <Link
                    key={item.id}
                    href={getPublicRepairCasePath(item.slug)}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    <div style={cardStyle}>
                      <OptimizedImage
                        src={item.image_url}
                        alt={
                          reviewedTitle
                            ? `${displayTitle} 대표 이미지`
                            : item.alt_text || displayTitle
                        }
                      />

                      <h3>{displayTitle}</h3>
                      <p>{item.branch}</p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p style={{ textAlign: "center" }}>
                등록된 수리사례가 없습니다.
              </p>
            )}
          </div>
        </section>
      )}

      <section style={sectionStyle}>
        <h2 style={titleStyle}>온라인 접수 · 상담 가능</h2>

        <p style={{ textAlign: "center", fontSize: "18px", lineHeight: 1.8 }}>
          방문 전 기종과 증상을 남겨주시면 수리 가능 여부, 예상 비용, 소요 시간,
          방문 또는 택배 접수 방법을 빠르게 안내드립니다.
        </p>

        <div style={{ textAlign: "center", marginTop: "28px" }}>
          <a href="/contact" style={darkButtonStyle}>
            온라인 수리문의 하기
          </a>
        </div>
      </section>

      <section style={{ ...sectionStyle, background: "#f1f5f9" }}>
        <h2 style={titleStyle}>강변역점 · 선릉점 · 신도림점 지점안내</h2>

        <div style={gridStyle}>
          <div style={cardStyle}>
            <a
              href="https://map.naver.com/p/entry/place/31476004"
              target="_blank"
              rel="noreferrer"
            >
              <OptimizedImage
                src="/images/gangbyeon-branch.jpg"
                alt="아이스마일어게인 강변역점 강변테크노마트 지점 이미지"
                height={180}
              />
            </a>

            <h3>
              <Link href="/branches/gangbyeon" style={branchTitleLinkStyle}>
                강변역점
              </Link>
            </h3>
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
              <OptimizedImage
                src="/images/seolleung-branch.jpg"
                alt="아이스마일어게인 선릉점 선릉역 1번 출구 지점 이미지"
                height={180}
              />
            </a>

            <h3>
              <Link href="/branches/seolleung" style={branchTitleLinkStyle}>
                선릉점
              </Link>
            </h3>
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
              <OptimizedImage
                src="/images/sindorim-branch.jpg"
                alt="아이스마일어게인 신도림점 신도림테크노마트 지점 이미지"
                height={180}
              />
            </a>

            <h3>
              <Link href="/branches/sindorim" style={branchTitleLinkStyle}>
                신도림점
              </Link>
            </h3>
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
  position: "relative",
  overflow: "hidden",
  color: "white",
  padding: "90px 24px",
  textAlign: "center",
  minHeight: "600px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const heroOverlayStyle = {
  position: "absolute",
  inset: 0,
  zIndex: 1,
  background:
    "linear-gradient(rgba(15,23,42,0.35), rgba(15,23,42,0.45))",
};

const heroContentStyle = {
  position: "relative",
  zIndex: 2,
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

const imageFrameStyle = {
  position: "relative",
  width: "100%",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  fontWeight: "800",
  background: "#f8fafc",
  borderRadius: "14px",
  marginBottom: "18px",
};

const optimizedImageStyle = {
  objectFit: "cover",
  objectPosition: "center",
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

const branchTitleLinkStyle = {
  color: "inherit",
  textDecoration: "none",
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

const trustIntroStyle = {
  maxWidth: "820px",
  margin: "0 auto 34px",
  textAlign: "center",
};

const eyebrowStyle = {
  margin: "0 0 10px",
  color: "#1e3a8a",
  fontSize: "15px",
  fontWeight: "900",
  letterSpacing: "0.04em",
};

const sectionDescriptionStyle = {
  margin: 0,
  color: "#475569",
  fontSize: "18px",
  lineHeight: 1.8,
};

const trustGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
};

const trustCardStyle = {
  background: "#ffffff",
  border: "1px solid #dbe4f0",
  borderRadius: "18px",
  padding: "24px",
  boxShadow: "0 8px 22px rgba(15, 23, 42, 0.06)",
};

const stepNumberStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "42px",
  height: "42px",
  marginBottom: "16px",
  borderRadius: "12px",
  background: "#e8eefc",
  color: "#1e3a8a",
  fontSize: "14px",
  fontWeight: "900",
};

const trustCardTitleStyle = {
  margin: "0 0 10px",
  fontSize: "20px",
};

const trustCardTextStyle = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.75,
};

const serviceNoticeStyle = {
  margin: "24px 0 0",
  textAlign: "center",
  color: "#475569",
  fontSize: "15px",
  lineHeight: 1.7,
};

const independentNoticeStyle = {
  maxWidth: "820px",
  margin: "12px auto 0",
  padding: "14px 18px",
  textAlign: "center",
  color: "#334155",
  fontSize: "14px",
  lineHeight: 1.7,
  background: "#eef2f7",
  borderRadius: "12px",
};

const trustLinkRowStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "26px",
};

const trustLinkStyle = {
  display: "inline-block",
  padding: "12px 18px",
  border: "1px solid #1e3a8a",
  borderRadius: "999px",
  color: "#1e3a8a",
  background: "#ffffff",
  textDecoration: "none",
  fontWeight: "800",
};
