import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import HomeNoticePopup from "@/components/HomeNoticePopup";
import PopupNotice from "@/components/PopupNotice";
import GoogleAnalyticsTracker from "@/components/GoogleAnalyticsTracker";

export const metadata = {
  metadataBase: new URL("https://www.ismileagain.co.kr"),

  title:
    "아이스마일어게인 | 아이폰 아이패드 맥북 서피스 노트북 수리",

  description:
    "아이패드 수리, 아이폰 수리, 맥북 수리, 마이크로소프트 서피스 수리, 레노버 노트북 수리, HP 노트북 수리, 아수스 노트북 수리 전문 공식 홈페이지입니다.",

  keywords: [
    "아이스마일어게인",
    "강남아이폰수리",
    "선릉아이폰수리",
    "강남서피스수리",
    "강변아이패드수리",
    "서피스배터리교체",
    "HP노트북수리",
    "아수스노트북수리",
    "애플워치액정수리",
    "아이폰액정수리",
    "아이폰배터리교체",
    "아이패드수리",
    "맥북수리",
    "LG그램수리",
    "레노버노트북수리",
    "맥북액정수리",
    "맥북배터리교체",
    "노트북배터리수리",
  ],

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
        <HomeNoticePopup />
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
              강변점 : 서울 광진구 광나루로56길 85 강변테크노마트
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

            <p style={{ marginTop: "8px" }}>
              <a
                href="/admin"
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                  textDecoration: "none",
                }}
              >
                관리자
              </a>
            </p>
          </div>
          </footer>

<GoogleAnalyticsTracker />
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