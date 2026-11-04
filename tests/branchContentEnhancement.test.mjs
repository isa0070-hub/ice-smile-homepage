import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import {
  getBranchServiceCards,
  branchServiceCardKeys,
} from "../src/lib/branchServiceCards.js"
import {
  getGalleryCaseHref,
  getGalleryCaseSearchFilter,
  matchesGalleryGroup,
  selectLatestGalleryCase,
} from "../src/lib/branchGalleryCases.js"

test("branch service cards match each branch's confirmed service scope", () => {
  assert.deepEqual(branchServiceCardKeys.seolleung, [
    "iphone",
    "ipad",
    "macbook",
    "appleWatch",
    "surface",
    "lenovo",
    "notebookTablet",
  ])
  assert.deepEqual(branchServiceCardKeys.gangbyeon, [
    "iphone",
    "ipad",
    "macbook",
    "surface",
    "notebookTablet",
  ])
  assert.deepEqual(branchServiceCardKeys.sindorim, [
    "iphone",
    "ipad",
    "surface",
    "notebookTablet",
  ])

  for (const slug of Object.keys(branchServiceCardKeys)) {
    const cards = getBranchServiceCards(slug)
    const hrefs = cards.map((card) => card.href)

    assert.equal(new Set(hrefs).size, hrefs.length)
    assert.ok(cards.every((card) => card.href.startsWith("/repair-services/")))
    assert.ok(cards.every((card) => card.title.length > 0))
    assert.ok(cards.every((card) => card.parts.length >= 2))
  }
})

test("latest gallery case is deterministic and limited to branch and device", () => {
  const cases = [
    {
      id: "5",
      branch: "강변점",
      slug: "newer-other-branch",
      device: "아이폰",
      model: "아이폰17프로",
      title: "아이폰 액정 교체",
      created_at: "2026-11-04T10:00:00Z",
    },
    {
      id: "4",
      branch: "선릉점",
      slug: "unsafe/path",
      device: "아이폰",
      model: "아이폰17프로",
      title: "아이폰 액정 교체",
      created_at: "2026-11-04T09:00:00Z",
    },
    {
      id: "3",
      branch: "선릉점",
      slug: "latest-seolleung-iphone",
      device: "아이폰",
      model: "아이폰15프로",
      title: "아이폰15프로 액정 교체",
      created_at: "2026-11-04T08:00:00Z",
    },
    {
      id: "2",
      branch: "선릉점",
      slug: "seolleung-surface",
      device: "마이크로소프트 서피스",
      model: "서피스프로9",
      title: "서피스 액정 교체",
      created_at: "2026-11-04T07:00:00Z",
    },
  ]

  const latest = selectLatestGalleryCase(cases, {
    branchNames: ["선릉점", "아이스마일어게인 선릉점"],
    group: "iphone",
  })

  assert.equal(latest?.slug, "latest-seolleung-iphone")
  assert.equal(
    getGalleryCaseHref(latest, "iphone"),
    "/repair-cases/latest-seolleung-iphone",
  )
})

test("gallery device matching separates tablet, notebook and Surface cases", () => {
  assert.equal(
    matchesGalleryGroup(
      { device: "레노버 태블릿", model: "Y700 4세대" },
      "tablet",
    ),
    true,
  )
  assert.equal(
    matchesGalleryGroup(
      { device: "레노버 노트북", model: "아이디어패드 T490s" },
      "tablet",
    ),
    false,
  )
  assert.equal(
    matchesGalleryGroup(
      { device: "마이크로소프트 서피스", model: "Surface Pro 9" },
      "surface",
    ),
    true,
  )
  assert.match(getGalleryCaseSearchFilter("surface"), /device\.ilike\.%서피스%/)
  assert.equal(
    getGalleryCaseHref(null, "iphone"),
    "/repair-cases?device=iphone",
  )
  assert.match(getGalleryCaseHref(null, "surface"), /category=/)
})

test("branch page renders semantic links and immediate case revalidation", () => {
  const pageSource = readFileSync(
    new URL("../src/app/branches/[slug]/page.js", import.meta.url),
    "utf8",
  )
  const revalidationSource = readFileSync(
    new URL("../src/lib/adminRevalidation.js", import.meta.url),
    "utf8",
  )

  assert.match(pageSource, /href=\{item\.href\}/)
  assert.match(pageSource, /href=\{href\}/)
  assert.match(pageSource, /id="branch-recent-cases"/)
  assert.match(pageSource, /getLatestBranchGalleryCase/)
  assert.doesNotMatch(pageSource, /Math\.random/)
  assert.match(
    revalidationSource,
    /revalidatePath\("\/branches\/\[slug\]", "page"\)/,
  )
})

test("branch quick menu links to real sections with a recent-case fallback", () => {
  const pageSource = readFileSync(
    new URL("../src/app/branches/[slug]/page.js", import.meta.url),
    "utf8",
  )
  const cssSource = readFileSync(
    new URL("../src/app/branches/[slug]/page.module.css", import.meta.url),
    "utf8",
  )

  assert.match(pageSource, /href: "#branch-services"/)
  assert.match(pageSource, /href: "#branch-visit"/)
  assert.match(
    pageSource,
    /recentCases\.length > 0 \? "#branch-recent-cases" : "\/repair-cases"/,
  )
  assert.match(pageSource, /href: contactHref/)
  assert.match(pageSource, /id="branch-services"/)
  assert.match(pageSource, /id="branch-visit"/)
  assert.match(pageSource, /id="branch-recent-cases"/)
  assert.match(pageSource, /페이지 바로가기/)
  assert.match(cssSource, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/)
  assert.match(cssSource, /scroll-margin-top: 110px/)
})

test("branch sitemap modification date matches the branch content release", () => {
  const sitemapSource = readFileSync(
    new URL("../src/app/sitemap.js", import.meta.url),
    "utf8",
  )

  assert.match(
    sitemapSource,
    /BRANCH_CONTENT_LAST_MODIFIED = new Date\("2026-11-04T00:00:00\+09:00"\)/,
  )
  assert.match(sitemapSource, /lastModified: BRANCH_CONTENT_LAST_MODIFIED/)
})
