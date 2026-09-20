import Link from "next/link";
import styles from "./page.module.css";

export const dynamic = "force-static";

export const metadata = {
  title: "강남·선릉 아이패드수리 | 아이스마일어게인 선릉점",
  description:
    "강남·선릉 아이패드 액정, 배터리, 충전불량, 버튼, 프레임, 침수 수리 상담. 선릉역 1번 출구 1분 아이스마일어게인 선릉점.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "https://www.ismileagain.co.kr/branches/seolleung",
  },
};

const symptoms = [
  {
    image: "/images/landing/ipad/screen-damage-v2.webp",
    title: "액정 · 화면 파손",
    text: "화면 깨짐 · 터치불량 · 화면 이상",
  },
  {
    image: "/images/landing/ipad/battery-v2.webp",
    title: "배터리 교체",
    text: "빠른 방전 · 전원 꺼짐 · 성능 저하",
  },
  {
    image: "/images/landing/ipad/charging-v2.webp",
    title: "충전불량",
    text: "충전 안 됨 · 접촉불량 · 충전단자 문제",
  },
  {
    image: "/images/landing/ipad/frame-button-v2.webp",
    title: "버튼 함몰 및 프레임 휨",
    text: "버튼 함몰 · 프레임 휨 · 외관 손상",
  },
  {
    image: "/images/landing/ipad/water-damage-v2.webp",
    title: "침수 · 물 접촉",
    text: "침수 · 습기유입 · 전원 이상",
  },
  {
    image: "/images/landing/ipad/other-fault.webp",
    title: "기타 아이패드 고장",
    text: "전원 · 부팅 · 기타 증상",
  },
];

export default function SeolleungIphoneLandingPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />

        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>강남 · 선릉 아이패드수리 전문</p>

            <h1 className={styles.title}>
              아이패드 수리,
              <br />
              <span className={styles.titleBlue}>
                다시, 더 오래 함께합니다.
              </span>
            </h1>

            <p className={styles.subtitle}>
              정확한 진단, 정직한 수리, 확실한 사후관리
            </p>

            <p className={styles.location}>
              <span>●</span>
              선릉역 1번 출구 1분 · 아이스마일어게인 선릉점
            </p>

            <div className={styles.primaryActions}>
              <a
                href="tel:02-554-5295"
                className={`${styles.mainButton} ${styles.phoneButton}`}
                data-ga-contact="phone_seolleung"
              >
                <span className={styles.buttonIcon}>☎</span>
                <span>
                  <strong>전화 상담하기</strong>
                  <small>02-554-5295</small>
                </span>
              </a>

              <a
                href="https://talk.naver.com/WCH5S2X"
                target="_blank"
                rel="noreferrer"
                className={`${styles.mainButton} ${styles.talkButton}`}
                data-ga-contact="naver_talk"
              >
                <span className={styles.naverIcon}>N</span>
                <span>
                  <strong>네이버 톡톡 상담</strong>
                  <small>빠른 상담이 가능합니다</small>
                </span>
              </a>
            </div>

            <div className={styles.onlineActionWrap}>
              <Link
                href="/contact?branch=seolleung&device=ipad"
                data-ga-contact="online_inquiry"
                className={styles.onlineActionButton}
              >
                <span className={styles.onlineActionIcon}>✎</span>
                온라인으로 수리 접수하기
              </Link>
            </div>

            <div className={styles.secondaryActions}>
              <a href="#seolleung-map">지도 바로 보기</a>

              <span />

              <Link href="/repair-cases">
                실제 수리사례 보기 ›
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <img
              src="/images/landing/ipad/ipad-hero-clean-no-text.png?v=4"
              alt="아이패드 두 대와 애플펜슬이 배치된 아이패드 수리 안내 이미지"
              className={styles.heroImage}
            />
          </div>
        </div>
      </section>

      <section className={styles.symptomSection}>
        <div className={styles.symptomGrid}>
          {symptoms.map((item) => (
            <article key={item.title} className={styles.symptomCard}>
              <div className={styles.symptomImageWrap}>
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className={styles.symptomImage}
                />
              </div>

              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="seolleung-map" className={styles.branchSection}>
        <div className={styles.branchWrap}>
          <div className={styles.branchHead}>
            <div>
              <p className={styles.sectionEyebrow}>SEOLLEUNG</p>
              <h2>선릉점 오시는 길</h2>
              <p>
                선릉역 1번 출구에서 도보 약 1분
              </p>
            </div>

            <div className={styles.branchHeadPhone}>
              <span>방문 전 상담</span>
              <a
                href="tel:02-554-5295"
                data-ga-contact="phone_seolleung"
              >
                02-554-5295
              </a>
            </div>
          </div>

          <div className={styles.branchMapCard}>
            <img
              src="/images/landing/seolleung-map.svg?v=2"
              alt="아이스마일어게인 선릉점 약도"
              className={styles.cleanMapImage}
            />
          </div>

          <div className={styles.branchBottom}>
            <div className={styles.branchAddress}>
              <span>아이스마일어게인 선릉점</span>
              <strong>
                서울 강남구 테헤란로 406
                샹제리제센터 A동 406호 · 4층
              </strong>
              <small>월~금 10:30~19:00</small>
            </div>

            <div className={styles.branchActions}>
              <a
                href="tel:02-554-5295"
                data-ga-contact="phone_seolleung"
                className={styles.branchPhone}
              >
                전화 상담
              </a>

              <a
                href="https://talk.naver.com/WCH5S2X"
                target="_blank"
                rel="noreferrer"
                data-ga-contact="naver_talk"
                className={styles.branchTalk}
              >
                네이버 톡톡
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.caseSection}>
        <div className={styles.caseHeader}>
          <div>
            <p className={styles.sectionEyebrow}>실제 수리사례</p>
            <h2>실제 아이패드 수리사례</h2>
            <p>
              비슷한 고장 증상과 실제 수리 과정을 확인해보세요.
            </p>
          </div>

          <Link href="/repair-cases" className={styles.caseMoreButton}>
            아이패드 수리사례 전체보기 →
          </Link>
        </div>

        <div className={styles.casePreviewGrid}>
          <Link href="/repair-services/ipad" className={styles.casePreviewCard}>
            <div className={styles.casePreviewImage}>
              <img
                src="/images/landing/ipad/cases/ipad-case-screen.webp"
                alt="아이패드 액정 파손 수리"
              />
            </div>
            <div>
              <span>액정 수리</span>
              <strong>깨진 화면 · 터치불량</strong>
              <small>아이패드 액정 수리사례 보기 →</small>
            </div>
          </Link>

          <Link href="/repair-services/ipad" className={styles.casePreviewCard}>
            <div className={styles.casePreviewImage}>
              <img
                src="/images/landing/ipad/cases/ipad-case-battery.webp"
                alt="아이패드 배터리 교체"
              />
            </div>
            <div>
              <span>배터리 교체</span>
              <strong>빠른 방전 · 성능저하</strong>
              <small>아이패드 배터리 수리사례 보기 →</small>
            </div>
          </Link>

          <Link href="/repair-services/ipad" className={styles.casePreviewCard}>
            <div className={styles.casePreviewImage}>
              <img
                src="/images/landing/ipad/cases/ipad-case-charging.webp"
                alt="아이패드 충전 수리"
              />
            </div>
            <div>
              <span>충전불량</span>
              <strong>충전 안 됨 · 접촉불량</strong>
              <small>아이패드 충전 수리사례 보기 →</small>
            </div>
          </Link>
        </div>
      </section>

      <section className={styles.finalCta}>
        <p>방문 전에 모델명과 증상을 알려주세요</p>
        <h2>수리 가능 여부부터 빠르게 확인해드립니다.</h2>

        <div className={styles.finalButtons}>
          <a
            href="tel:02-554-5295"
            data-ga-contact="phone_seolleung"
          >
            전화 상담하기
          </a>

          <a
            href="https://talk.naver.com/WCH5S2X"
            target="_blank"
            rel="noreferrer"
            data-ga-contact="naver_talk"
          >
            네이버 톡톡 상담
          </a>
        </div>
      </section>
    </main>
  );
}
