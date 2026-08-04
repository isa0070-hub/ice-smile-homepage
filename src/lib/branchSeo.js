export const branchSeo = {
    gangbyeon: {
      slug: "gangbyeon",
      phone: "02-3424-5295",
      name: "아이스마일어게인 강변역점",
      alternateName: "아이스마일어게인 강변점",
      shortName: "강변역점",
      address1: "서울특별시 광진구 광나루로56길 85",
      address2: "강변테크노마트 5층 B-20호",
      naverMap: "https://map.naver.com/p/entry/place/31476004",
      image: "/images/gangbyeon-branch.jpg",
      h1: "강변아이폰수리·강변아이패드수리",
      title:
      "강변아이폰수리·강변아이패드수리 | 아이스마일어게인 강변역점",
    description:
      "강변아이폰수리·강변아이패드수리가 필요한 분을 위한 아이스마일어게인 강변역점입니다. 강변역 1번 출구에서 약 3분 거리이며 아이폰과 아이패드의 액정·유리·배터리 수리를 진행합니다.",
    intro:
      "아이스마일어게인 강변역점은 강변테크노마트 5층 B-20호에 위치합니다. 강변아이폰수리와 강변아이패드수리를 중심으로 액정 파손, 배터리 성능 저하, 충전 불량 등 다양한 증상을 점검하고 수리합니다. 잠실과 건대입구 등 인근 지역에서도 편리하게 방문하실 수 있습니다.",
      locality: "광진구",
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
      phone: "02-554-5295",
      name: "아이스마일어게인 선릉점",
      shortName: "선릉점",
      address1: "서울특별시 강남구 테헤란로 406",
      address2: "샹제리제센터 A동 406호",
      naverMap: "https://map.naver.com/p/entry/place/20557661",
      image: "/images/seolleung-branch.jpg",
      h1: "강남아이폰수리·강남아이패드수리",
      title:
        "강남아이폰수리·강남아이패드수리 | 아이스마일어게인 선릉점",
      description:
        "강남아이폰수리·강남아이패드수리가 필요한 분을 위한 아이스마일어게인 선릉점입니다. 선릉역 1번 출구에서 약 1분 거리이며 아이폰과 아이패드의 액정·유리·배터리 수리를 진행합니다.",
      intro:
        "아이스마일어게인 선릉점은 선릉역 1번 출구 인근 샹제리제센터 A동 406호에 위치합니다. 강남아이폰수리와 강남아이패드수리를 중심으로 액정 파손, 배터리 성능 저하, 충전 불량 등 다양한 증상을 점검하고 수리합니다.",
      locality: "강남구",
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
      phone: "02-2111-8899",
      name: "아이스마일어게인 신도림점",
      shortName: "신도림점",
      h1: "신도림 아이폰·아이패드·노트북 수리",
      address1: "서울특별시 구로구 새말로 97",
      address2: "신도림테크노마트 9층 57-1번 기둥",
      naverMap: "https://map.naver.com/p/entry/place/13486497",
      image: "/images/sindorim-branch.jpg",
      title:
        "신도림 아이폰·아이패드·노트북 수리 | 아이스마일어게인 신도림점",
      description:
        "신도림테크노마트 9층 57-1번 기둥에 위치한 아이스마일어게인 신도림점입니다. 아이폰·아이패드·노트북과 서피스 수리를 진행합니다.",
      intro:
        "아이스마일어게인 신도림점은 신도림테크노마트 9층 57-1번 기둥에 위치하며, 스마트폰·태블릿·노트북의 고장 상태를 점검하고 수리합니다.",
      locality: "구로구",
      services: [
        "아이폰 액정 및 배터리 수리",
        "아이패드 액정 및 배터리 수리",
        "노트북 액정 및 전원 불량 점검",
        "서피스 액정 및 배터리 수리",
        "메인보드 정밀 점검 및 수리",
      ],
      nearbyAreas: ["신도림동", "구로동", "영등포", "목동", "문래동"],
    },
  }
  
  export function getBranchSeo(slug) {
    return branchSeo[slug] || null
  }

  export function getBranchLocalBusinessJsonLd(seo, branch = {}) {
    const canonicalUrl = `https://www.ismileagain.co.kr/branches/${seo.slug}`
    const address1 = branch.address1 || seo.address1
    const address2 = branch.address2 || seo.address2
    const naverMap = branch.naver_map || seo.naverMap
    const image = branch.map_image || seo.image

    return {
      "@type": "LocalBusiness",
      "@id": `${canonicalUrl}#localbusiness`,
      name: seo.name,
      ...(seo.alternateName ? { alternateName: seo.alternateName } : {}),
      url: canonicalUrl,
      telephone: branch.phone || seo.phone,
      parentOrganization: {
        "@id": "https://www.ismileagain.co.kr/#organization",
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: [address1, address2].filter(Boolean).join(" "),
        addressLocality: seo.locality,
        addressRegion: "서울특별시",
        addressCountry: "KR",
      },
      areaServed: seo.nearbyAreas.map((name) => ({
        "@type": "Place",
        name,
      })),
      knowsAbout: seo.services,
      ...(image
        ? { image: new URL(image, "https://www.ismileagain.co.kr").href }
        : {}),
      ...(naverMap ? { hasMap: naverMap, sameAs: [naverMap] } : {}),
    }
  }
export const branchSeo = {
    gangbyeon: {
      slug: "gangbyeon",
      phone: "02-3424-5295",
      name: "아이스마일어게인 강변점",
      shortName: "강변점",
      h1: "강변아이폰수리·강변아이패드수리",
      title:
      "강변아이폰수리·강변아이패드수리 | 아이스마일어게인 강변점",
    description:
      "강변아이폰수리·강변아이패드수리가 필요한 분을 위한 아이스마일어게인 강변점입니다. 강변역 1번 출구에서 약 3분 거리이며 아이폰과 아이패드의 액정·유리·배터리 수리를 진행합니다.",
    intro:
      "아이스마일어게인 강변점은 강변테크노마트 5층 B-20호에 위치합니다. 강변아이폰수리와 강변아이패드수리를 중심으로 액정 파손, 배터리 성능 저하, 충전 불량 등 다양한 증상을 점검하고 수리합니다. 잠실과 건대입구 등 인근 지역에서도 편리하게 방문하실 수 있습니다.",
      locality: "광진구",
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
      phone: "02-554-5295",
      name: "아이스마일어게인 선릉점",
      shortName: "선릉점",
      h1: "강남아이폰수리·강남아이패드수리",
      title:
        "강남아이폰수리·강남아이패드수리 | 아이스마일어게인 선릉점",
      description:
        "강남아이폰수리·강남아이패드수리가 필요한 분을 위한 아이스마일어게인 선릉점입니다. 선릉역 1번 출구에서 약 1분 거리이며 아이폰과 아이패드의 액정·유리·배터리 수리를 진행합니다.",
      intro:
        "아이스마일어게인 선릉점은 선릉역 1번 출구 인근 샹제리제센터 A동 406호에 위치합니다. 강남아이폰수리와 강남아이패드수리를 중심으로 액정 파손, 배터리 성능 저하, 충전 불량 등 다양한 증상을 점검하고 수리합니다.",
      locality: "강남구",
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
      phone: "02-2111-8899",
      name: "아이스마일어게인 신도림점",
      shortName: "신도림점",
      title:
        "신도림 아이폰·아이패드·노트북 수리 | 아이스마일어게인 신도림점",
      description:
        "신도림테크노마트 9층 57-1번 기둥에 위치한 아이스마일어게인 신도림점입니다. 아이폰·아이패드·노트북과 서피스 수리를 진행합니다.",
      intro:
        "아이스마일어게인 신도림점은 신도림테크노마트 9층 57-1번 기둥에 위치하며, 스마트폰·태블릿·노트북의 고장 상태를 점검하고 수리합니다.",
      locality: "구로구",
      services: [
        "아이폰 액정 및 배터리 수리",
        "아이패드 액정 및 배터리 수리",
        "노트북 액정 및 전원 불량 점검",
        "서피스 액정 및 배터리 수리",
        "메인보드 정밀 점검 및 수리",
      ],
      nearbyAreas: ["신도림동", "구로동", "영등포", "목동", "문래동"],
    },
  }
  
  export function getBranchSeo(slug) {
    return branchSeo[slug] || null
  }
