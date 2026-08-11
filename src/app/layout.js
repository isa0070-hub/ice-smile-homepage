import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import PopupNotice from "@/components/PopupNotice";
import GoogleAnalyticsTracker from "@/components/GoogleAnalyticsTracker";
import AdClickTracker from "@/components/AdClickTracker";
import NaverConversionTracker from "@/components/NaverConversionTracker";
import Link from "next/link";

export const metadata = {
  metadataBase: new URL("https://www.ismileagain.co.kr"),

  title:
    "아이스마일어게인 | 아이폰 아이패드 맥북 서피스 노트북 수리",

  description:
    "강변·선릉·신도림에서 아이패드, 아이폰, 맥북, 마이크로소프트 서피스, 레노버, HP, ASUS 노트북을 점검·수리하는 아이스마일어게인 홈페이지입니다.",

  verification: {
    other: {
      "naver-site-verification":
        "9badcd1f8b005e15458251f86f936d657e73fc47",
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        <PopupNotice />

        <div style={{ paddingTop: "78px" }}>{children}</div>

        <footer
          style={{
            background: "#0f172a",
            color: "#fff",
            padding: "40px 24px",
            marginTop: "60px",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              lineHeight: "1.9",
            }}
          >
            <h3>아이스마일어게인</h3>

            <p>대표자 : 양용환</p>
            <p>사업자등록번호 : 542-52-00920</p>

            <p>
              강변역점 : 서울 광진구 광나루로56길 85 강변테크노마트
              5층 B-20호 / 02-3424-5295
            </p>

            <p>
              선릉점 : 서울 강남구 테헤란로 406 샹제리제센터
              A동 406호 / 02-554-5295
            </p>

            <p>
              신도림점 : 서울 구로구 새말로 97 신도림테크노마트
              9층 57-1번 기둥 / 02-2111-8899
            </p>

            <nav aria-label="주요 수리 서비스" style={footerServiceNavStyle}>
              <Link href="/repair-services/iphone" style={footerLinkStyle}>
                아이폰 수리
              </Link>
              <Link href="/repair-services/ipad" style={footerLinkStyle}>
                아이패드 수리
              </Link>
              <Link href="/repair-services/macbook" style={footerLinkStyle}>
                맥북 수리
              </Link>
              <Link href="/repair-services/surface" style={footerLinkStyle}>
                서피스 수리
              </Link>
              <Link href="/repair-services/lenovo" style={footerLinkStyle}>
                레노버 수리
              </Link>
              <Link
                href="/repair-services/notebook-tablet"
                style={footerLinkStyle}
              >
                ASUS·HP·LG 노트북 수리
              </Link>
              <Link href="/branches/seolleung" style={footerLinkStyle}>
                강남 아이폰 수리 선릉점
              </Link>
              <Link href="/contact" style={footerLinkStyle}>
                온라인 수리 문의
              </Link>
            </nav>

            <p>
              네이버 톡톡 :{" "}
              <a
                href="https://talk.naver.com/WCH5S2X"
                target="_blank"
                rel="noreferrer"
                style={footerTalkLinkStyle}
              >
                상담 바로가기
              </a>
            </p>

            <p style={{ marginTop: "14px" }}>
              <a href="/privacy" style={footerLinkStyle}>
                개인정보처리방침
              </a>

              {" · "}

              <a href="/terms" style={footerLinkStyle}>
                이용약관
              </a>
            </p>

            <p
              style={{
                marginTop: "18px",
                color: "#94a3b8",
                fontSize: "13px",
              }}
            >
              © 아이스마일어게인 All Rights Reserved.
            </p>

          </div>
          </footer>
<AdClickTracker />
<GoogleAnalyticsTracker />
<NaverConversionTracker />
</body>
</html>
  );
}

const footerLinkStyle = {
  color: "#cbd5e1",
  textDecoration: "none",
  fontWeight: "800",
};

const footerTalkLinkStyle = {
  color: "#ffffff",
  textDecoration: "underline",
  fontWeight: "800",
};

const footerServiceNavStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px 18px",
  marginTop: "18px",
};
