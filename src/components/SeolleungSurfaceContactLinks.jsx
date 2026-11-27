"use client";

import { useSyncExternalStore } from "react";
import { getOpenAiAdsClickReference } from "@/lib/openAiAdsClick";

const contactPath = "/contact?branch=seolleung&device=surface";
const talkUrl = "https://talk.naver.com/ct/w189h6v?frm=mnmb&frm=nmb_detail#nafullscreen";

export function SeolleungSurfaceTalkLink(props) {
  return (
    <a
      {...props}
      href={talkUrl}
      target="_blank"
      rel="noreferrer"
      data-ga-contact="naver_talk"
    />
  );
}

function subscribeToBrowserHistory(onChange) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function getBrowserClickReference() {
  const params = new URLSearchParams(window.location.search);
  return getOpenAiAdsClickReference(params.get("oppref"));
}

function getServerClickReference() {
  return "";
}

export function SeolleungSurfaceInquiryLink(props) {
  // This landing is prerendered, so the click reference is read in the browser.
  const clickReference = useSyncExternalStore(
    subscribeToBrowserHistory,
    getBrowserClickReference,
    getServerClickReference,
  );
  const href = clickReference
    ? `${contactPath}&${new URLSearchParams({ oppref: clickReference })}`
    : contactPath;

  return <a {...props} href={href} data-ga-contact="online_inquiry" />;
}
