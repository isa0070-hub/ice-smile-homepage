"use client";

import { usePathname } from "next/navigation";

export default function RouteLayout({
  children,
  siteHeader,
  notices,
  footer,
}) {
  const pathname = usePathname();

  const isMorningPage =
    pathname === "/morning" || pathname?.startsWith("/morning/");

  // 모닝 AI 페이지에서는 기존 홈페이지 공통 요소를 출력하지 않음
  if (isMorningPage) {
    return <>{children}</>;
  }

  // 기존 홈페이지와 다른 페이지는 지금 구조 그대로 유지
  return (
    <>
      {siteHeader}

      {notices}

      <div style={{ paddingTop: "78px" }}>{children}</div>

      {footer}
    </>
  );
}