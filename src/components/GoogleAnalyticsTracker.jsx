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

export default function GoogleAnalyticsTracker() {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  const excluded = isExcludedPath(pathname);

  useEffect(() => {
    if (
      !isReady ||
      excluded ||
      typeof window === "undefined" ||
      typeof window.gtag !== "function"
    ) {
      return;
    }

    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: pathname,
    });
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