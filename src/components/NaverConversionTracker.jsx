"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAVER_ACCOUNT_ID = "s_2da30a0ee568";
const NAVER_COOKIE_DOMAIN = "ismileagain.co.kr";
const LEAD_RETRY_DELAY_MS = 150;
const LEAD_MAX_ATTEMPTS = 8;
const PHONE_LIST_OPEN_SESSION_KEY = "ismile_phone_list_open_naver";
let phoneListOpenSentInMemory = false;
let phoneListOpenPendingPromise = null;

const EXCLUDED_PATHS = ["/admin", "/morning", "/api"];

const CUSTOM_CONVERSIONS = {
  phone_gangbyeon: "custom001",
  phone_seolleung: "custom002",
  phone_sindorim: "custom003",
  kakao_talk: "custom004",
  naver_talk: "custom005",
  online_inquiry_click: "custom006",
  phone_list_open: "custom007",
};

function isExcludedPath(pathname = "") {
  return EXCLUDED_PATHS.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function initializeNaverTracking() {
  if (
    typeof window === "undefined" ||
    !window.wcs ||
    typeof window.wcs.inflow !== "function"
  ) {
    return false;
  }

  try {
    window.wcs_add = window.wcs_add || {};
    window.wcs_add.wa = NAVER_ACCOUNT_ID;
    window.wcs.inflow(NAVER_COOKIE_DOMAIN);
    return true;
  } catch {
    return false;
  }
}

function sendPageView() {
  if (
    !initializeNaverTracking() ||
    typeof window.wcs_do !== "function"
  ) {
    return false;
  }

  try {
    window.wcs_do();
    return true;
  } catch {
    return false;
  }
}

function sendConversion(type) {
  if (
    !initializeNaverTracking() ||
    !type ||
    typeof window.wcs.trans !== "function"
  ) {
    return false;
  }

  try {
    const result = window.wcs.trans({ type });
    return result !== false;
  } catch {
    return false;
  }
}

function hasPhoneListOpenInSession() {
  if (phoneListOpenSentInMemory) {
    return true;
  }

  try {
    return window.sessionStorage.getItem(PHONE_LIST_OPEN_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markPhoneListOpenInSession() {
  phoneListOpenSentInMemory = true;

  try {
    window.sessionStorage.setItem(PHONE_LIST_OPEN_SESSION_KEY, "1");
  } catch {
    // 저장소를 사용할 수 없어도 전환 이벤트 전송은 계속합니다.
  }
}

async function sendConversionWithRetry(type) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    for (let attempt = 0; attempt < LEAD_MAX_ATTEMPTS; attempt += 1) {
      if (sendConversion(type)) {
        return true;
      }

      if (attempt < LEAD_MAX_ATTEMPTS - 1) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, LEAD_RETRY_DELAY_MS);
        });
      }
    }
  } catch {
    return false;
  }

  return false;
}

function trackPhoneListOpenOnce() {
  if (hasPhoneListOpenInSession()) {
    return Promise.resolve(false);
  }

  if (phoneListOpenPendingPromise) {
    return phoneListOpenPendingPromise;
  }

  phoneListOpenPendingPromise = sendConversionWithRetry(
    CUSTOM_CONVERSIONS.phone_list_open
  )
    .then((sent) => {
      if (sent) {
        markPhoneListOpenInSession();
      }
      return sent;
    })
    .finally(() => {
      phoneListOpenPendingPromise = null;
    });

  return phoneListOpenPendingPromise;
}

function classifyContactConversion(element) {
  if (!element || typeof window === "undefined") {
    return null;
  }

  const dataElement = element.closest("[data-naver-conversion]");
  const dataConversion = dataElement?.getAttribute("data-naver-conversion");

  if (dataConversion === "phone_list_open") {
    return CUSTOM_CONVERSIONS.phone_list_open;
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

export async function trackNaverLead() {
  return sendConversionWithRetry("lead");
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
    if (excluded) {
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

      if (!conversionType) {
        return;
      }

      if (conversionType === CUSTOM_CONVERSIONS.phone_list_open) {
        void trackPhoneListOpenOnce();
        return;
      }

      sendConversion(conversionType);
    }

    document.addEventListener("click", handleContactClick, true);

    return () => {
      document.removeEventListener("click", handleContactClick, true);
    };
  }, [excluded]);

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
