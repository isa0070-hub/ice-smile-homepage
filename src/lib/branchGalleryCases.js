import {
  getPublicRepairCasePath,
  isPublicRepairCaseSlug,
} from "./publicRepairCases.js"

const galleryCaseGroups = Object.freeze({
  iphone: Object.freeze({
    terms: Object.freeze(["아이폰", "iphone"]),
    excludeTerms: Object.freeze([
      "아이패드",
      "ipad",
      "맥북",
      "macbook",
      "서피스",
      "surface",
      "노트북",
      "notebook",
      "laptop",
      "태블릿",
      "tablet",
    ]),
    fallbackHref: "/repair-cases?device=iphone",
  }),
  tablet: Object.freeze({
    terms: Object.freeze([
      "아이패드",
      "ipad",
      "태블릿",
      "tablet",
      "갤럭시탭",
      "galaxy tab",
      "y700",
      "p11",
      "p12",
      "샤오신패드",
      "요가탭",
      "tb321",
      "tb322",
      "tb373",
      "tb375",
    ]),
    excludeTerms: Object.freeze([
      "아이폰",
      "iphone",
      "맥북",
      "macbook",
      "서피스",
      "surface",
      "노트북",
      "notebook",
      "laptop",
      "씽크패드",
      "thinkpad",
      "아이디어패드",
      "ideapad",
    ]),
    fallbackHref: "/repair-cases?device=ipad",
  }),
  surface: Object.freeze({
    terms: Object.freeze(["서피스", "surface"]),
    excludeTerms: Object.freeze([
      "아이폰",
      "iphone",
      "아이패드",
      "ipad",
      "맥북",
      "macbook",
      "레노버",
      "lenovo",
    ]),
    fallbackHref:
      "/repair-cases?category=%EB%A7%88%EC%9D%B4%ED%81%AC%EB%A1%9C%EC%86%8C%ED%94%84%ED%8A%B8+%EC%84%9C%ED%94%BC%EC%8A%A4",
  }),
})

const searchFields = Object.freeze(["device", "model", "title", "symptom"])

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function includesAny(value, terms) {
  const normalizedValue = normalize(value)
  return terms.some((term) => normalizedValue.includes(normalize(term)))
}

function matchesGalleryGroup(item, group) {
  const config = galleryCaseGroups[group]

  if (!config) return false

  const metadata = `${item?.device || ""} ${item?.model || ""}`
  const fallbackText = `${item?.title || ""} ${item?.symptom || ""}`

  if (includesAny(metadata, config.excludeTerms)) {
    return false
  }

  if (includesAny(metadata, config.terms)) {
    return true
  }

  if (includesAny(fallbackText, config.excludeTerms)) {
    return false
  }

  return includesAny(fallbackText, config.terms)
}

function compareNewestFirst(left, right) {
  const leftTime = new Date(left?.created_at || 0).getTime()
  const rightTime = new Date(right?.created_at || 0).getTime()

  if (leftTime !== rightTime) {
    return rightTime - leftTime
  }

  return String(right?.id || "").localeCompare(String(left?.id || ""))
}

export function getGalleryCaseSearchFilter(group) {
  const config = galleryCaseGroups[group]

  if (!config) return ""

  return config.terms
    .flatMap((term) =>
      searchFields.map((field) => `${field}.ilike.%${term}%`),
    )
    .join(",")
}

export function selectLatestGalleryCase(cases, { branchNames, group }) {
  const allowedBranches = new Set((branchNames || []).map(normalize))

  return (
    (cases || [])
      .filter((item) => allowedBranches.has(normalize(item?.branch)))
      .filter((item) => isPublicRepairCaseSlug(item?.slug))
      .filter((item) => matchesGalleryGroup(item, group))
      .sort(compareNewestFirst)[0] || null
  )
}

export function getGalleryCaseHref(item, group) {
  if (item && isPublicRepairCaseSlug(item.slug)) {
    return getPublicRepairCasePath(item.slug)
  }

  return galleryCaseGroups[group]?.fallbackHref || "/repair-cases"
}

export { galleryCaseGroups, matchesGalleryGroup }
