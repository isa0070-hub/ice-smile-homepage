"use client";

import { usePathname } from "next/navigation";

export default function FloatingNaverTalk() {
  const pathname = usePathname();

  // 관리자 화면과 광고 전용 랜딩에서는 고객용 고정 톡톡 숨김
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/landing/")
  ) {
    return null;
  }

  return (
    <a
      href="https://talk.naver.com/WCH5S2X"
      target="_blank"
      rel="noreferrer"
      aria-label="네이버 톡톡 상담"
      data-ga-contact="naver_talk"
      className="floating-naver-talk"
    >
      <span className="floating-naver-talk-badge">톡톡</span>
      <span className="floating-naver-talk-text">네이버 상담</span>
    </a>
  );
}
