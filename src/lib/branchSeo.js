const BASE_URL = "https://www.ismileagain.co.kr"

export const ORGANIZATION_ID = `${BASE_URL}/#organization`

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value
  }

  Object.values(value).forEach(deepFreeze)
  return Object.freeze(value)
}

// Slugs and NAP data are deliberately kept in code until the branches table has
// an immutable, unique slug column. Database rows may enrich presentation, but
// must not silently change the public entity represented by a branch URL.
export const branchSeo = deepFreeze({
  gangbyeon: {
    slug: "gangbyeon",
    dbNames: [
      "강변점",
      "강변역점",
      "아이스마일어게인 강변점",
      "아이스마일어게인 강변역점",
    ],
    phone: "02-3424-5295",
    name: "아이스마일어게인 강변역점",
    alternateName: "아이스마일어게인 강변점",
    shortName: "강변역점",
    searchLabel: "강변",
    address1: "서울특별시 광진구 광나루로56길 85",
    address2: "강변테크노마트 5층 B-20호",
    locality: "광진구",
    postalCode: "05116",
    naverMap: "https://map.naver.com/p/entry/place/31476004",
    image: "/images/gangbyeon-branch.jpg",
    mapImage: "/images/map-gangbyeon.svg",
    visitInfo:
      "강변역 1번 출구 쪽 강변테크노마트 5층으로 오시면 됩니다.",
    h1: "강변아이폰수리·강변아이패드수리",
    title:
      "강변아이폰수리·강변아이패드수리 | 아이스마일어게인 강변역점",
    description:
      "강변아이폰수리·강변아이패드수리가 필요한 분을 위한 아이스마일어게인 강변역점입니다. 강변역 1번 출구에서 약 3분 거리이며 아이폰과 아이패드의 액정·유리·배터리 수리를 진행합니다.",
    intro:
      "아이스마일어게인 강변역점은 강변테크노마트 5층 B-20호에 위치합니다. 강변아이폰수리와 강변아이패드수리를 중심으로 액정 파손, 배터리 성능 저하, 충전 불량 등 다양한 증상을 점검하고 수리합니다. 잠실과 건대입구 등 인근 지역에서도 편리하게 방문하실 수 있습니다.",
    caseIntro: "강변역 1번 출구 인근 아이스마일어게인 강변역점",
    services: [
      "아이폰 액정 및 배터리 수리",
      "아이패드 액정 및 배터리 수리",
      "맥북 침수 및 전원 불량 점검",
      "서피스 액정 및 배터리 수리",
      "노트북 메인보드 정밀 수리",
    ],
    nearbyAreas: ["구의동", "자양동", "광장동", "건대입구", "성수동", "잠실"],
  },

  seolleung: {
    slug: "seolleung",
    dbNames: ["선릉점", "아이스마일어게인 선릉점"],
    phone: "02-554-5295",
    name: "아이스마일어게인 선릉점",
    shortName: "선릉점",
    searchLabel: "선릉",
    address1: "서울특별시 강남구 테헤란로 406",
    address2: "샹제리제센터 A동 406호",
    locality: "강남구",
    postalCode: "06192",
    naverMap: "https://map.naver.com/p/entry/place/20557661",
    image: "/images/seolleung-branch.jpg",
    mapImage: "/images/map-seolleung.svg",
    visitInfo:
      "선릉역 1번 출구에서 나오자마자 바로 옆 1분 거리에 위치하고 있습니다.",
    businessHours: {
      weekdays: "월요일~금요일 10:30~19:30",
      closed: "토요일·일요일, 공휴일·대체공휴일 휴무",
      breakTime: "브레이크타임 없음",
    },
    parkingInfo:
      "매장 등록 시 1시간 무료주차가 가능하며, 주차장 차량 높이는 2.3m로 제한됩니다.",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "10:30",
        closes: "19:30",
      },
    ],
    h1: "강남아이폰수리·강남아이패드수리",
    title:
      "강남아이폰수리·강남아이패드수리 | 아이스마일어게인 선릉점",
    description:
      "강남아이폰수리·강남아이패드수리가 필요한 분을 위한 아이스마일어게인 선릉점입니다. 선릉역 1번 출구에서 약 1분 거리이며 아이폰과 아이패드의 액정·유리·배터리 수리를 진행합니다.",
    intro:
      "아이스마일어게인 선릉점은 선릉역 1번 출구 인근 샹제리제센터 A동 406호에 위치합니다. 강남아이폰수리와 강남아이패드수리를 중심으로 액정 파손, 배터리 성능 저하, 충전 불량 등 다양한 증상을 점검하고 수리합니다.",
    caseIntro: "선릉역 1번 출구 인근 아이스마일어게인 선릉점",
    services: [
      "아이폰 액정 및 배터리 수리",
      "아이패드 액정 및 유리 수리",
      "맥북 침수 및 전원 불량 점검",
      "애플워치 액정 및 배터리 수리",
      "서피스 액정 및 배터리 수리",
    ],
    nearbyAreas: ["삼성동", "역삼동", "대치동", "도곡동", "청담동"],
  },

  sindorim: {
    slug: "sindorim",
    dbNames: ["신도림점", "아이스마일어게인 신도림점"],
    phone: "02-2111-8899",
    name: "아이스마일어게인 신도림점",
    shortName: "신도림점",
    searchLabel: "신도림",
    address1: "서울특별시 구로구 새말로 97",
    address2: "신도림테크노마트 9층 57-1번 기둥",
    locality: "구로구",
    postalCode: "08288",
    naverMap: "https://map.naver.com/p/entry/place/13486497",
    image: "/images/sindorim-branch.jpg",
    mapImage: "/images/sindorim-map-57-1.jpg",
    visitInfo:
      "신도림역에서 도보로 방문 가능한 신도림테크노마트 9층에 위치하고 있습니다.",
    h1: "신도림 아이폰·아이패드·노트북 수리",
    title:
      "신도림 아이폰·아이패드·노트북 수리 | 아이스마일어게인 신도림점",
    description:
      "신도림테크노마트 9층 57-1번 기둥에 위치한 아이스마일어게인 신도림점입니다. 아이폰·아이패드·노트북과 서피스 수리를 진행합니다.",
    intro:
      "아이스마일어게인 신도림점은 신도림테크노마트 9층 57-1번 기둥에 위치하며, 스마트폰·태블릿·노트북의 고장 상태를 점검하고 수리합니다.",
    caseIntro: "신도림테크노마트 9층 아이스마일어게인 신도림점",
    services: [
      "아이폰 액정 및 배터리 수리",
      "아이패드 액정 및 배터리 수리",
      "노트북 액정 및 전원 불량 점검",
      "서피스 액정 및 배터리 수리",
      "메인보드 정밀 점검 및 수리",
    ],
    nearbyAreas: ["신도림동", "구로동", "영등포", "목동", "문래동"],
  },
})

export const branchSlugs = Object.freeze(Object.keys(branchSeo))

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "")
}

function toInternationalPhone(value) {
  const phone = String(value || "").trim()
  return phone.startsWith("0") ? `+82-${phone.slice(1)}` : phone
}

function normalizeBranchName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim()
}

export function getBranchSeo(slug) {
  return branchSeo[slug] || null
}

export function getBranchSeoByPhone(phone) {
  const normalizedPhone = normalizePhone(phone)

  if (!normalizedPhone) return null

  return (
    Object.values(branchSeo).find(
      (seo) => normalizePhone(seo.phone) === normalizedPhone,
    ) || null
  )
}

export function getBranchSeoByName(name) {
  const normalizedName = normalizeBranchName(name)

  if (!normalizedName) return null

  return (
    Object.values(branchSeo).find((seo) =>
      seo.dbNames.some(
        (candidate) => normalizeBranchName(candidate) === normalizedName,
      ),
    ) || null
  )
}

export function getBranchSeoForRecord(branch) {
  return (
    getBranchSeoByPhone(branch?.phone) || getBranchSeoByName(branch?.name)
  )
}

export function getBranchCanonicalUrl(seo) {
  return `${BASE_URL}/branches/${seo.slug}`
}

export function getBranchLocalBusinessId(seo) {
  return `${getBranchCanonicalUrl(seo)}#localbusiness`
}

export function getBranchDisplayData(seo, branch = {}) {
  const displayBranch = branch || {}

  return {
    id: displayBranch.id || seo.slug,
    slug: seo.slug,
    name: seo.shortName,
    phone: seo.phone,
    address1: seo.address1,
    address2: seo.address2,
    visit_info: displayBranch.visit_info || seo.visitInfo,
    business_hours: seo.businessHours || null,
    parking_info: seo.parkingInfo || null,
    naver_map: seo.naverMap,
    map_image: displayBranch.map_image || seo.mapImage,
    is_active: displayBranch.is_active ?? true,
    sort_order: displayBranch.sort_order ?? branchSlugs.indexOf(seo.slug),
  }
}

export function getBranchLocalBusinessJsonLd(seo) {
  const canonicalUrl = getBranchCanonicalUrl(seo)

  return {
    "@type": "LocalBusiness",
    "@id": getBranchLocalBusinessId(seo),
    name: seo.name,
    ...(seo.alternateName ? { alternateName: seo.alternateName } : {}),
    url: canonicalUrl,
    telephone: toInternationalPhone(seo.phone),
    parentOrganization: {
      "@id": ORGANIZATION_ID,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: [seo.address1, seo.address2].filter(Boolean).join(" "),
      addressLocality: seo.locality,
      addressRegion: "서울특별시",
      postalCode: seo.postalCode,
      addressCountry: "KR",
    },
    areaServed: seo.nearbyAreas.map((name) => ({
      "@type": "Place",
      name,
    })),
    knowsAbout: seo.services,
    image: new URL(seo.image, BASE_URL).href,
    hasMap: seo.naverMap,
    sameAs: [seo.naverMap],
    ...(seo.openingHoursSpecification
      ? { openingHoursSpecification: seo.openingHoursSpecification }
      : {}),
  }
}
