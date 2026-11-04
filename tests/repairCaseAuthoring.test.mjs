import assert from "node:assert/strict";
import test from "node:test";

import {
  AUTHORING_STAGES,
  buildRepairCaseContentSections,
  buildRepairCaseImageAlt,
  buildRepairCaseKeyword,
  buildRepairCaseMainAlt,
  buildRepairCaseSearchSummary,
  buildRepairCaseSummary,
  buildRepairCaseTitle,
  extractRepairCaseFacts,
  getDeviceModelLabel,
  normalizeAuthoringText,
  parseRepairCaseContentSections,
  sortRepairCaseImages,
  validateRepairCaseDraft,
} from "../src/lib/repairCaseAuthoring.js";

const completeDraft = Object.freeze({
  branch: "선릉점",
  category: "애플",
  device: "아이폰",
  model: "아이폰15프로",
  symptom: "낙하 후 화면 파손과 녹색 줄이 발생함",
  diagnosis: "액정 패널 손상을 확인함",
  repairAction: "파손 액정을 분리하고 교체용 액정을 장착함",
  verification: "화면 출력과 터치, Face ID, 충전 기능을 확인함",
  notes: "수리 후 충격에 주의하도록 안내함",
  title: "",
});

test("authoring stage contract stays ordered and has Korean section titles", () => {
  assert.deepEqual(
    AUTHORING_STAGES.map(({ key }) => key),
    ["intake", "diagnosis", "repair", "verification"],
  );
  assert.deepEqual(
    AUTHORING_STAGES.map(({ title }) => title),
    [
      "접수 증상과 기기 상태",
      "점검 결과",
      "진행한 수리 작업",
      "수리 후 기능 확인",
    ],
  );
});

test("normalization and device/model labeling remove whitespace and duplicate device names", () => {
  assert.equal(normalizeAuthoringText("  아이폰\n  15 프로  "), "아이폰 15 프로");
  assert.equal(getDeviceModelLabel(completeDraft), "아이폰15프로");
  assert.equal(
    getDeviceModelLabel({ device: "서피스", model: "프로9" }),
    "서피스 프로9",
  );
});

test("generated title is concise, deduplicated, and uses only supplied facts", () => {
  const title = buildRepairCaseTitle({
    ...completeDraft,
    symptom: "선릉점 아이폰15프로 액정 파손",
    repairAction: "아이폰15프로 액정 교체",
  });

  assert.match(title, /^선릉점 아이폰15프로 /u);
  assert.match(title, /액정 파손/u);
  assert.match(title, /액정 교체/u);
  assert.match(title, /수리사례$/u);
  assert.ok(Array.from(title).length <= 48);
  assert.equal((title.match(/선릉점/gu) || []).length, 1);
  assert.equal((title.match(/아이폰15프로/gu) || []).length, 1);
  assert.doesNotMatch(title, /정품|당일|완벽|방수/u);
});

test("title and summaries never invent a missing diagnosis, repair, or verification", () => {
  const sparseDraft = {
    branch: "강변점",
    category: "애플",
    device: "아이패드",
    model: "아이패드9세대",
    symptom: "전면 유리가 깨진 상태",
    diagnosis: "",
    repairAction: "",
    verification: "",
    notes: "",
  };
  const combined = [
    buildRepairCaseTitle(sparseDraft),
    buildRepairCaseSummary(sparseDraft),
    buildRepairCaseSearchSummary(sparseDraft),
    ...buildRepairCaseContentSections(sparseDraft).map((section) => section.content),
  ].join(" ");

  assert.match(combined, /전면 유리가 깨진 상태/u);
  assert.doesNotMatch(combined, /액정 교체|정품|정상 작동|기능 테스트|방수|당일/u);
  assert.doesNotMatch(buildRepairCaseSummary(sparseDraft), /점검 결과:|진행 작업:|완료 확인:/u);
});

test("summary and search summary remain readable factual prose rather than a keyword list", () => {
  const summary = buildRepairCaseSummary(completeDraft);
  const searchSummary = buildRepairCaseSearchSummary(completeDraft);
  const searchSentences = searchSummary
    .split(/[.!?]+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  assert.match(summary, /접수 증상: 낙하 후 화면 파손과 녹색 줄이 발생함/u);
  assert.match(summary, /점검 결과: 액정 패널 손상을 확인함/u);
  assert.match(summary, /진행 작업: 파손 액정을 분리하고 교체용 액정을 장착함/u);
  assert.match(summary, /완료 확인: 화면 출력과 터치, Face ID, 충전 기능을 확인함/u);
  assert.ok(searchSentences.length >= 1 && searchSentences.length <= 2);
  assert.match(searchSummary, /^선릉점 아이폰15프로 수리사례입니다\./u);
  assert.match(searchSummary, /증상: .+; 작업: .+; 완료 확인: /u);
  assert.doesNotMatch(searchSummary, /선릉점\s+선릉점|아이폰\s+아이폰15프로/u);
});

test("keyword is one concise repair-action phrase without branch or model enumeration", () => {
  const keyword = buildRepairCaseKeyword({
    ...completeDraft,
    repairAction: "선릉점 아이폰 아이폰15프로 액정 모듈 교체",
  });

  assert.equal(keyword, "액정 모듈 교체");
  assert.doesNotMatch(keyword, /선릉|아이폰15프로/u);
  assert.ok(Array.from(keyword).length <= 36);
});

test("main and detail ALT text stay concise and detail ALT is based on the actual description", () => {
  const description = "파손된 액정을 분리한 뒤 내부 커넥터를 확인한 상태";
  const mainAlt = buildRepairCaseMainAlt(completeDraft);
  const detailAlt = buildRepairCaseImageAlt(completeDraft, description, 1);

  assert.match(mainAlt, /^아이폰15프로 /u);
  assert.match(mainAlt, /대표 사진$/u);
  assert.ok(Array.from(mainAlt).length <= 80);
  assert.match(detailAlt, /파손된 액정을 분리한 뒤 내부 커넥터를 확인한 상태/u);
  assert.match(detailAlt, /사진 2$/u);
  assert.doesNotMatch(detailAlt, /정품|완벽|정상 작동/u);
  assert.ok(Array.from(detailAlt).length <= 80);
});

test("image sorting is stable within stages and content ranges are 1-based with 0 for empty stages", () => {
  const images = [
    { id: "repair-later", stage: "repair", sort_order: 20, description: "두 번째 작업" },
    { id: "intake-a", stage: "intake", sort_order: 10, description: "입고 상태 A" },
    { id: "verification", stage: "verification", sort_order: 1, description: "기능 확인" },
    { id: "repair-first", stage: "repair", sort_order: 5, description: "첫 번째 작업" },
    { id: "intake-b", stage: "intake", sort_order: 10, description: "입고 상태 B" },
  ];
  const sorted = sortRepairCaseImages(images);
  const sections = buildRepairCaseContentSections(completeDraft, sorted);

  assert.deepEqual(
    sorted.map(({ id }) => id),
    ["intake-a", "intake-b", "repair-first", "repair-later", "verification"],
  );
  assert.deepEqual(
    sorted.map(({ sort_order }) => sort_order),
    [0, 1, 2, 3, 4],
  );
  assert.deepEqual(
    sections.map(({ image_start, image_end }) => [image_start, image_end]),
    [
      [1, 2],
      [0, 0],
      [3, 4],
      [5, 5],
    ],
  );
  assert.equal(sections[0].content, completeDraft.symptom);
  assert.equal(sections[1].content, completeDraft.diagnosis);
  assert.equal(sections[2].content, completeDraft.repairAction);
  assert.match(sections[3].content, new RegExp(completeDraft.verification, "u"));
  assert.match(sections[3].content, /현장 특이사항: 수리 후 충격에 주의하도록 안내함/u);
});

test("legacy and double-encoded content sections parse without changing their text or ranges", () => {
  const encoded = JSON.stringify(
    JSON.stringify({
      content_sections: [
        {
          title: "점검 결과",
          content: "메인보드의 침수 흔적을 확인함",
          image_start: "1",
          image_end: "2",
        },
        {
          type: "closing",
          title: "마무리 안내",
          content: "방문 전 연락을 부탁드립니다.",
          image_start: 99,
          image_end: 99,
        },
      ],
    }),
  );
  const parsed = parseRepairCaseContentSections(encoded);

  assert.deepEqual(parsed, [
    {
      title: "점검 결과",
      content: "메인보드의 침수 흔적을 확인함",
      image_start: 1,
      image_end: 2,
    },
    {
      type: "closing",
      title: "마무리 안내",
      content: "방문 전 연락을 부탁드립니다.",
      image_start: null,
      image_end: null,
    },
  ]);
  assert.deepEqual(parseRepairCaseContentSections("not-json"), []);
  assert.deepEqual(
    parseRepairCaseContentSections([
      {
        title: "마무리 및 지점안내",
        content: "방문 전 연락을 부탁드립니다.",
        image_start: null,
        image_end: null,
      },
    ])[0]?.type,
    "closing",
  );
});

test("facts are extracted from staged sections and fallback is used only for absent facts", () => {
  const sections = buildRepairCaseContentSections(completeDraft, []);
  const facts = extractRepairCaseFacts(sections, { notes: "기존 주의사항" });

  assert.equal(facts.diagnosis, completeDraft.diagnosis);
  assert.equal(facts.repairAction, completeDraft.repairAction);
  assert.equal(facts.verification, completeDraft.verification);
  assert.equal(facts.notes, "기존 주의사항");
});

test("validation requires every real repair fact and validates each photo stage and description", () => {
  const valid = validateRepairCaseDraft(completeDraft, [
    {
      stage: "diagnosis",
      description: "액정 패널 파손 부위를 가까이에서 확인한 사진",
    },
  ]);

  assert.equal(valid.isValid, true);
  assert.deepEqual(valid.errors, []);
  assert.ok(valid.checks.every(({ complete }) => complete));

  const invalid = validateRepairCaseDraft(
    {
      ...completeDraft,
      model: "",
      diagnosis: "",
      verification: "",
    },
    [
      { stage: "unknown", description: "" },
    ],
  );

  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.includes("정확한 모델명 항목을 입력해주세요."));
  assert.ok(invalid.errors.includes("점검 결과 항목을 입력해주세요."));
  assert.ok(invalid.errors.includes("수리 후 확인 결과 항목을 입력해주세요."));
  assert.ok(invalid.errors.includes("사진 1의 단계를 선택해주세요."));
  assert.ok(invalid.errors.includes("사진 1에 실제로 보이는 내용을 적어주세요."));
});

test("validation warns about exaggerated or unverifiable claims without hiding them", () => {
  const report = validateRepairCaseDraft(
    {
      ...completeDraft,
      title: "업계 1등의 완벽 수리",
      repairAction: "무조건 당일 보장하며 100% 새것처럼 복원",
    },
    [],
  );
  const warningText = report.warnings.join(" ");

  assert.equal(report.isValid, true);
  assert.match(warningText, /과장으로 보일 수 있는 표현/u);
  for (const claim of ["무조건", "완벽", "1등", "100%", "새것처럼", "당일 보장"]) {
    assert.ok(warningText.includes(claim), `${claim} warning should be present`);
  }
  assert.match(warningText, /대표 수리 사진을 추가/u);
});
