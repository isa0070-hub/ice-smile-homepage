const serviceCardCatalog = Object.freeze({
  iphone: Object.freeze({
    key: "iphone",
    icon: "phone",
    href: "/repair-services/iphone",
    title: "아이폰 수리",
    parts: Object.freeze([
      "액정",
      "배터리",
      "후면유리",
      "카메라렌즈",
      "충전단자",
      "침수",
    ]),
  }),
  ipad: Object.freeze({
    key: "ipad",
    icon: "tablet",
    href: "/repair-services/ipad",
    title: "아이패드 수리",
    parts: Object.freeze([
      "액정",
      "전면유리",
      "배터리",
      "충전단자",
      "전원불량",
      "침수",
    ]),
  }),
  macbook: Object.freeze({
    key: "macbook",
    icon: "laptop",
    href: "/repair-services/macbook",
    title: "맥북 수리",
    parts: Object.freeze([
      "액정",
      "배터리",
      "키보드",
      "트랙패드",
      "침수",
      "전원불량",
    ]),
  }),
  appleWatch: Object.freeze({
    key: "appleWatch",
    icon: "watch",
    href: "/repair-services/apple",
    title: "애플워치 수리",
    parts: Object.freeze(["액정", "배터리"]),
  }),
  surface: Object.freeze({
    key: "surface",
    icon: "surface",
    href: "/repair-services/surface",
    title: "서피스 수리",
    parts: Object.freeze(["액정", "배터리", "충전불량", "전원불량"]),
  }),
  lenovo: Object.freeze({
    key: "lenovo",
    icon: "laptop",
    href: "/repair-services/lenovo",
    title: "레노버 노트북·태블릿",
    parts: Object.freeze([
      "액정",
      "배터리",
      "충전단자",
      "키보드",
      "침수",
      "전원불량",
    ]),
  }),
  notebookTablet: Object.freeze({
    key: "notebookTablet",
    icon: "tools",
    href: "/repair-services/notebook-tablet",
    title: "ASUS·HP·LG 노트북",
    parts: Object.freeze([
      "액정",
      "배터리",
      "키보드",
      "트랙패드",
      "충전·전원불량",
    ]),
  }),
})

const branchServiceCardKeys = Object.freeze({
  gangbyeon: Object.freeze([
    "iphone",
    "ipad",
    "macbook",
    "surface",
    "notebookTablet",
  ]),
  seolleung: Object.freeze([
    "iphone",
    "ipad",
    "macbook",
    "appleWatch",
    "surface",
    "lenovo",
    "notebookTablet",
  ]),
  sindorim: Object.freeze([
    "iphone",
    "ipad",
    "surface",
    "notebookTablet",
  ]),
})

const appleServiceCardKeys = Object.freeze([
  "iphone",
  "ipad",
  "macbook",
  "appleWatch",
])

export function getBranchServiceCards(branchSlug) {
  return (branchServiceCardKeys[branchSlug] || []).map(
    (key) => serviceCardCatalog[key],
  )
}

export function branchOffersRepairService(branchSlug, serviceSlug) {
  const cards = getBranchServiceCards(branchSlug)

  if (serviceSlug === "apple") {
    return cards.some((card) => appleServiceCardKeys.includes(card.key))
  }

  return cards.some(
    (card) => card.href === `/repair-services/${serviceSlug}`,
  )
}

export { branchServiceCardKeys, serviceCardCatalog }
