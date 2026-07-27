"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAVER_ACCOUNT_ID = "s_2da30a0ee568";
const NAVER_COOKIE_DOMAIN = "ismileagain.co.kr";

const EXCLUDED_PATHS = ["/admin", "/morning", "/api"];

const CUSTOM_CONVERSIONS = {
  phone_gangbyeon: "custom001",
  phone_seolleung: "custom002",
  phone_sindorim: "custom003",
  kakao_talk: "custom004",
  naver_talk: "custom005",
  online_inquiry_click: "custom006",
};

function isExcludedPath(pathname = "") {
  return EXCLUDED_PATHS.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function initializeNaverTracking() {
  if (typeof window === "undefined" || !window.wcs) {
    return false;
  }

  window.wcs_add = window.wcs_add || {};
  window.wcs_add.wa = NAVER_ACCOUNT_ID;
  window.wcs.inflow(NAVER_COOKIE_DOMAIN);
  return true;
}

function sendPageView() {
  if (!initializeNaverTracking()) {
    return false;
  }

  window.wcs_do();
  return true;
}

function sendConversion(type) {
  if (!initializeNaverTracking() || !type) {
    return false;
  }

  window.wcs.trans({ type });
  return true;
}

function classifyContactConversion(element) {
  if (!element || typeof window === "undefined") {
    return null;
  }

  const anchor = element.closest("a[href]");
  const rawHref = anchor?.getAttribute("href") || "";

  if (rawHref.toLowerCase().startsWith("tel:")) {
    const phoneNumber = rawHref.replace(/\D/g, "");

    if (phoneNumber.endsWith("0234245295")) {
      return CUSTOM_CONVERSIONS.phone_gangbyeon;
    }

    if (phoneNumber.endsWith("025545295")) {
      return CUSTOM_CONVERSIONS.phone_seolleung;
    }

    if (phoneNumber.endsWith("0221118899")) {
      return CUSTOM_CONVERSIONS.phone_sindorim;
    }
  }

  if (rawHref) {
    try {
      const url = new URL(rawHref, window.location.origin);
      const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";

      if (
        url.hostname === "pf.kakao.com" ||
        url.hostname.endsWith(".pf.kakao.com")
      ) {
        return CUSTOM_CONVERSIONS.kakao_talk;
      }

      if (
        url.hostname === "talk.naver.com" ||
        url.hostname.endsWith(".talk.naver.com")
      ) {
        return CUSTOM_CONVERSIONS.naver_talk;
      }

      if (
        url.origin === window.location.origin &&
        normalizedPath === "/contact"
      ) {
        return CUSTOM_CONVERSIONS.online_inquiry_click;
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function trackNaverLead() {
  return sendConversion("lead");
}

export default function NaverConversionTracker() {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const excluded = isExcludedPath(pathname);

  useEffect(() => {
    if (!isReady || excluded) {
      return;
    }

    const timer = window.setTimeout(sendPageView, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, excluded, isReady]);

  useEffect(() => {
    if (!isReady || excluded) {
      return;
    }

    function handleContactClick(event) {
      if (!(event.target instanceof Element)) {
        return;
      }

      const clickedElement = event.target.closest(
        "a[href], button, [role='button']"
      );

      if (!clickedElement) {
        return;
      }

      const conversionType = classifyContactConversion(clickedElement);

      if (conversionType) {
        sendConversion(conversionType);
      }
    }

    document.addEventListener("click", handleContactClick, true);

    return () => {
      document.removeEventListener("click", handleContactClick, true);
    };
  }, [excluded, isReady]);

  if (excluded) {
    return null;
  }

  return (
    <Script
      src="https://wcs.naver.net/wcslog.js"
      strategy="afterInteractive"
      onReady={() => setIsReady(true)}
    />
  );
}
