import {
  ORGANIZATION_ID,
  branchSeo,
  getBranchLocalBusinessId,
} from "@/lib/branchSeo";

export const SITE_URL = "https://www.ismileagain.co.kr";
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function getOrganizationJsonLd() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "아이스마일어게인",
    url: `${SITE_URL}/`,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon.png`,
    },
    image: `${SITE_URL}/opengraph-image.jpg`,
    sameAs: [
      "https://talk.naver.com/WCH5S2X",
      "https://pf.kakao.com/_ftxmXX",
    ],
    department: Object.values(branchSeo).map((seo) => ({
      "@id": getBranchLocalBusinessId(seo),
    })),
  };
}

export function getWebSiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: "아이스마일어게인",
    alternateName: "아이스마일어게인 스마트기기 수리",
    inLanguage: "ko-KR",
    publisher: {
      "@id": ORGANIZATION_ID,
    },
  };
}
