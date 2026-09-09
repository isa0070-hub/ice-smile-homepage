import assert from "node:assert/strict";
import test from "node:test";

import {
  makeRepairCaseMetaDescription,
  makeRepairCaseMetaTitle,
  sanitizeLegacyRepairCaseText,
  sanitizeRepairCaseSearchText,
} from "../src/lib/legacyRepairCasePresentation.js";

test("known repair-case typos are corrected without inventing details", () => {
  const source =
    "화장실에서 떨어뜨러서 액정검정 멍 이보며 화면백화가 생기고 전원이꺼지는 상태";

  assert.equal(
    sanitizeRepairCaseSearchText(source),
    "화장실에서 떨어뜨려 액정에 검은 멍이 보이며 화면 백화가 생기고 전원이 꺼지는 상태",
  );
});

test("neutral content cleanup applies to every repair case", () => {
  const source =
    "부산, 대구, 인천, 광주 등 전국 주요 도시에서도 택배 접수 문의가 많습니다. 실제 액정 파손 상태를 확인했습니다.";

  assert.equal(
    sanitizeLegacyRepairCaseText("new-unreviewed-case", source),
    "실제 액정 파손 상태를 확인했습니다.",
  );
});

test("meta titles are deterministic, branded once and never contain ellipsis", () => {
  const storedTitle =
    "강남 아이폰수리 아이폰15프로 액정파손 및 화면 황변 수리 과정… 상세 후기";
  const first = makeRepairCaseMetaTitle(storedTitle);
  const second = makeRepairCaseMetaTitle(storedTitle);

  assert.equal(first, second);
  assert.ok(Array.from(first).length <= 60);
  assert.equal(first.includes("…"), false);
  assert.equal(first.match(/아이스마일어게인/gu)?.length, 1);
});

test("distinct iPad 9th-generation cases keep distinct metadata", () => {
  const nowonTitle = makeRepairCaseMetaTitle(
    "노원 아이패드수리, 전체 유리가 파손된 아이패드 9세대 전면 유리 교체",
  );
  const songpaTitle = makeRepairCaseMetaTitle(
    "송파 아이패드 수리｜아이패드 9세대 액정수리, 홈버튼 주변 전면 유리파손 해결",
  );
  const nowonDescription = makeRepairCaseMetaDescription({
    displayTitle:
      "노원 아이패드수리, 전체 유리가 파손된 아이패드 9세대 전면 유리 교체",
    branchIntro: "강변역 1번 출구 인근 아이스마일어게인 강변역점",
  });
  const songpaDescription = makeRepairCaseMetaDescription({
    displayTitle:
      "송파 아이패드 수리｜아이패드 9세대 액정수리, 홈버튼 주변 전면 유리파손 해결",
    branchIntro: "강변역 1번 출구 인근 아이스마일어게인 강변역점",
  });

  assert.notEqual(nowonTitle, songpaTitle);
  assert.notEqual(nowonDescription, songpaDescription);
  assert.match(nowonTitle, /^노원/u);
  assert.match(songpaTitle, /^송파/u);
  assert.match(nowonDescription, /예상 비용/u);
  assert.ok(Array.from(nowonDescription).length <= 155);
  assert.ok(Array.from(songpaDescription).length <= 155);
});
