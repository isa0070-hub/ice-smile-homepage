"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const GA_MEASUREMENT_ID = "G-YELJDXWV3G";

const EXCLUDED_PATHS = [
  "/admin",
  "/morning",
  "/api",
];

function isExcludedPath(pathname = "") {
  return EXCLUDED_PATHS.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(`${prefix}/`)
  );
}

function cleanLabel(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function classifyContactClick(element) {
  if (!element || typeof window === "undefined") {
    return null;
  }

  const dataElement = element.closest("[data-ga-contact]");
  const dataType = dataElement?.getAttribute("data-ga-contact");

  if (dataType === "phone") {
    return {
      eventName: "phone_click",
      contactType: "phone",
      linkUrl: "",
    };
  }

  if (dataType === "naver_talk") {
    return {
      eventName: "naver_talk_click",
      contactType: "naver_talk",
      linkUrl: "",
    };
  }

  if (dataType === "online_inquiry") {
    return {
      eventName: "online_inquiry_click",
      contactType: "online_inquiry",
      linkUrl: "",
    };
  }

  const anchor = element.closest("a[href]");
  const rawHref = anchor?.getAttribute("href") || "";
  const absoluteHref = anchor?.href || rawHref;

  const linkText = cleanLabel(element.textContent);
  const normalizedText = linkText
    .replace(/\s+/g, "")
    .toLowerCase();

  if (rawHref.toLowerCase().startsWith("tel:")) {
    return {
      eventName: "phone_click",
      contactType: "phone",
      linkUrl: absoluteHref,
    };
  }

  if (rawHref) {
    try {
      const url = new URL(rawHref, window.location.origin);
      const normalizedPath =
        url.pathname.replace(/\/+$/, "") || "/";

      if (
        url.hostname === "talk.naver.com" ||
        url.hostname.endsWith(".talk.naver.com")
      ) {
        return {
          eventName: "naver_talk_click",
          contactType: "naver_talk",
          linkUrl: url.href,
        };
      }

      if (
        url.origin === window.location.origin &&
        normalizedPath === "/contact"
      ) {
        return {
          eventName: "online_inquiry_click",
          contactType: "online_inquiry",
          linkUrl: url.href,
        };
      }
    } catch {
      // 잘못된 주소는 텍스트 기준으로 한 번 더 확인
    }
  }

  // 링크가 아닌 버튼으로 구현된 경우를 위한 보조 판별
  if (
    normalizedText.includes("네이버톡톡") ||
    normalizedText === "톡톡"
  ) {
    return {
      eventName: "naver_talk_click",
      contactType: "naver_talk",
      linkUrl: absoluteHref,
    };
  }

  if (normalizedText.includes("전화")) {
    return {
      eventName: "phone_click",
      contactType: "phone",
      linkUrl: absoluteHref,
    };
  }

  if (
    normalizedText.includes("온라인") &&
    normalizedText.includes("문의")
  ) {
    return {
      eventName: "online_inquiry_click",
      contactType: "online_inquiry",
      linkUrl: absoluteHref,
    };
  }

  return null;
}

export default function GoogleAnalyticsTracker() {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  const excluded = isExcludedPath(pathname);

  // 페이지 방문 기록
  useEffect(() => {
    if (
      !isReady ||
      excluded ||
      typeof window === "undefined" ||
      typeof window.gtag !== "function"
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
        page_path:
          window.location.pathname +
          window.location.search,
        send_to: GA_MEASUREMENT_ID,
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname, excluded, isReady]);

  // 전화·톡톡·온라인 문의 클릭 기록
  useEffect(() => {
    if (
      !isReady ||
      excluded ||
      typeof window === "undefined" ||
      typeof window.gtag !== "function"
    ) {
      return;
    }

    function handleContactClick(event) {
      if (!(event.target instanceof Element)) {
        return;
      }

      const clickedElement = event.target.closest(
        "a[href], button, [role='button'], [data-ga-contact]"
      );

      if (!clickedElement) {
        return;
      }

      const contactEvent =
        classifyContactClick(clickedElement);

      if (!contactEvent) {
        return;
      }

      window.gtag(
        "event",
        contactEvent.eventName,
        {
          contact_type: contactEvent.contactType,
          link_text: cleanLabel(
            clickedElement.textContent
          ),
          link_url: contactEvent.linkUrl,
          page_title: document.title,
          page_location: window.location.href,
          page_path:
            window.location.pathname +
            window.location.search,
          send_to: GA_MEASUREMENT_ID,
        }
      );
    }

document.addEventListener(
  "click",
  handleContactClick,
  true
 );

return () => {
  document.removeEventListener(
    "click",
    handleContactClick,
    true
  );
};
}, [pathname, excluded, isReady]);
  
if (excluded) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />

      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        onReady={() => setIsReady(true)}
      >
        {`
          window.dataLayer = window.dataLayer || [];

          window.gtag = function () {
            window.dataLayer.push(arguments);
          };

          window.gtag("js", new Date());

          window.gtag("config", "${GA_MEASUREMENT_ID}", {
            send_page_view: false,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
          });
        `}
      </Script>
    </>
  );
}