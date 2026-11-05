import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  findRepresentativeDetailImage,
  getUniqueRepairCaseImageUrls,
} from "../src/lib/repairCasePresentation.js";

const detailPageSource = readFileSync(
  new URL("../src/app/repair-cases/[slug]/page.js", import.meta.url),
  "utf8",
);
const createPageSource = readFileSync(
  new URL("../src/app/admin/repair-cases/page.js", import.meta.url),
  "utf8",
);
const editPageSource = readFileSync(
  new URL("../src/app/admin/repair-cases/edit/[id]/page.js", import.meta.url),
  "utf8",
);

test("representative image stays first while JSON-LD image URLs are unique", () => {
  const representative = "/images/repair-main.jpg";
  const detailImages = [
    { id: 1, image_url: "https://www.ismileagain.co.kr/images/repair-main.jpg" },
    { id: 2, image_url: "/images/repair-step-2.jpg" },
    { id: 3, image_url: "/images/repair-step-2.jpg" },
  ];

  assert.deepEqual(
    getUniqueRepairCaseImageUrls(representative, detailImages),
    [
      "https://www.ismileagain.co.kr/images/repair-main.jpg",
      "https://www.ismileagain.co.kr/images/repair-step-2.jpg",
    ],
  );
  assert.equal(
    findRepresentativeDetailImage(representative, detailImages)?.id,
    1,
  );
});

test("a separately uploaded legacy representative remains eligible for compact display", () => {
  assert.equal(
    findRepresentativeDetailImage("/images/legacy-main.jpg", [
      { image_url: "/images/repair-step-1.jpg" },
    ]),
    null,
  );
});

test("public detail suppresses a duplicated top image but preserves structured body photos", () => {
  assert.match(detailPageSource, /showStandaloneRepresentative/u);
  assert.match(detailPageSource, /!representativeDetailImage/u);
  assert.match(detailPageSource, /getSectionImages\(/u);
  assert.match(detailPageSource, /repair-process-card/u);
  assert.match(detailPageSource, /getUniqueRepairCaseImageUrls/u);
  assert.match(
    detailPageSource,
    /const mainImageStyle = \{[\s\S]*?maxHeight: "500px"/u,
  );
});

test("create and edit screens both let the author select a representative without moving body photos", () => {
  assert.match(createPageSource, /function selectMainImage\(image\)/u);
  assert.match(createPageSource, /대표사진으로 선택/u);
  assert.match(createPageSource, /본문에서는 선택한 수리 단계 위치가 그대로 유지/u);
  assert.match(editPageSource, /function selectRepresentativeImage\(image\)/u);
  assert.match(editPageSource, /현재 대표사진/u);
  assert.match(editPageSource, /본문 위치는 바뀌지 않습니다/u);
});
