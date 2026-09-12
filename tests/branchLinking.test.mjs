import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { branchSeo, branchSlugs, getBranchCanonicalUrl } from "../src/lib/branchSeo.js";

test("Gangbyeon core search identity is preserved", () => {
  const branch = branchSeo.gangbyeon;
  assert.equal(branch.title, "강변아이폰수리·강변아이패드수리 | 아이스마일어게인 강변역점");
  assert.equal(branch.h1, "강변아이폰수리·강변아이패드수리");
  assert.equal(branch.name, "아이스마일어게인 강변역점");
  assert.equal(branch.phone, "02-3424-5295");
  assert.equal(getBranchCanonicalUrl(branch), "https://www.ismileagain.co.kr/branches/gangbyeon");
  assert.equal(branch.naverMap, "https://map.naver.com/p/entry/place/31476004");
});

test("Nearby area directions point to the real Gangbyeon branch", () => {
  assert.deepEqual(branchSeo.gangbyeon.visitAreas.map(({ name }) => name), ["잠실", "건대입구", "성수"]);
  for (const area of branchSeo.gangbyeon.visitAreas) {
    assert.match(area.description, /강변역/);
    assert.match(area.description, /20호/);
  }
  assert.deepEqual(branchSlugs, ["gangbyeon", "seolleung", "sindorim"]);
});

test("Seolleung description and parking use confirmed operating conditions", () => {
  assert.match(branchSeo.seolleung.description, /10:30~19:30/);
  assert.match(branchSeo.seolleung.description, /매장 등록 시 1시간/);
  assert.match(branchSeo.seolleung.description, /2\.3m/);
  assert.match(branchSeo.seolleung.businessHours.closed, /대체공휴일/);
});

test("Branch pages connect both owned blogs with descriptive labels", () => {
  const source = readFileSync(new URL("../src/app/branches/[slug]/page.js", import.meta.url), "utf8");
  assert.match(source, /https:\/\/notion38862\.tistory\.com\//);
  assert.match(source, /https:\/\/repaircheck-note\.tistory\.com\//);
  assert.match(source, /사진과 함께 보는 수리 기록/);
  assert.match(source, /고장 증상별 수리 전 점검 가이드/);
});
