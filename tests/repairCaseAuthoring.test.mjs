import assert from "node:assert/strict";
import test from "node:test";

import {
  AUTHORING_STAGES,
  buildRepairCaseActionLabel,
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
  assert.match(
    searchSummary,
    /^선릉점 아이폰15프로 액정 파손·화면 줄 발생 수리사례입니다\./u,
  );
  assert.match(searchSummary, /액정 교체 작업을 진행했습니다\.$/u);
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

test("long customer-facing repair prose becomes a complete short action, title, and description", () => {
  const actualCase = {
    branch: "선릉점",
    device: "아이폰",
    model: "아이폰15프로",
    symptom:
      "처음 떨어뜨렸을 때는 찍힘만 있었고 이후 화면 하단이 떨리며 터치가 되지 않음",
    repairAction:
      "정품액정 교체를 원하셨고 정품과 가품 부품의 차이와 구별방법 등을 설명한 후 정품액정 교체를 실시 하였습니다",
    verification:
      "화면 떨림은 완전히 사라졌고 터치와 주요 기능이 정상 작동함",
  };
  const action = buildRepairCaseActionLabel(actualCase);
  const title = buildRepairCaseTitle(actualCase);
  const description = buildRepairCaseSearchSummary(actualCase);

  assert.equal(action, "정품 액정 교체");
  assert.equal(
    title,
    "선릉점 아이폰15프로 화면 떨림·터치 불량 정품 액정 교체 수리사례",
  );
  assert.equal(
    description,
    "선릉점 아이폰15프로 화면 떨림·터치 불량 수리사례입니다. 정품 액정 교체 작업을 진행한 뒤 화면 떨림 해소·터치 정상 작동을 확인했습니다.",
  );
  assert.ok(Array.from(title).length <= 48);
  assert.equal(description.split(".").filter(Boolean).length, 2);
  assert.doesNotMatch(description, /원하셨고|차이와|상태로[.]?$/u);
});

test("negative verification never becomes a normal-operation claim", () => {
  const negativeResults = [
    "교체 후에도 터치가 정상 작동하지 않음",
    "터치가 정상 작동하지 못함",
    "터치가 정상 작동 안 함",
    "터치가 정상 작동이 안 됨",
    "터치가 정상 상태가 아님",
    "충전이 정상적으로 되지 못함",
    "화면 출력이 정상적이지 못함",
  ];
  const inconclusiveResults = [
    "터치 작동 여부를 점검함",
    "충전 작동 여부를 추가 점검함",
    "전원 작동 상태를 확인함",
    "카메라 작동 테스트를 진행함",
    "Face ID 작동 여부 확인 필요",
  ];

  [...negativeResults, ...inconclusiveResults].forEach((verification) => {
    const description = buildRepairCaseSearchSummary({
      ...completeDraft,
      verification,
    });

    assert.match(description, /액정 교체 작업을 진행했습니다\.$/u);
    assert.doesNotMatch(
      description,
      /정상 작동을 확인했습니다|화면 출력 정상|정상 작동/u,
    );
  });
});

test("negated symptoms and skipped repairs never become positive SEO facts", () => {
  const connectorCase = {
    branch: "선릉점",
    device: "아이폰",
    model: "아이폰15프로",
    symptom: "화면은 파손되지 않았으나 터치가 되지 않음",
    repairAction: "액정 교체는 하지 않고 커넥터를 재장착함",
    verification: "터치가 정상 작동함",
  };
  const chargingCase = {
    branch: "강변점",
    device: "아이폰",
    model: "아이폰14프로",
    symptom: "배터리는 부풀지 않았고 충전만 되지 않음",
    repairAction: "배터리 교체 없이 충전 단자를 교체함",
    verification: "충전이 정상 작동함",
  };
  const connectorText = [
    buildRepairCaseTitle(connectorCase),
    buildRepairCaseSearchSummary(connectorCase),
  ].join(" ");
  const chargingText = [
    buildRepairCaseTitle(chargingCase),
    buildRepairCaseSearchSummary(chargingCase),
  ].join(" ");

  assert.equal(buildRepairCaseActionLabel(connectorCase), "커넥터 재장착");
  assert.match(connectorText, /터치 불량/u);
  assert.match(connectorText, /커넥터 재장착/u);
  assert.doesNotMatch(connectorText, /액정 파손|액정 교체/u);

  assert.equal(buildRepairCaseActionLabel(chargingCase), "충전 단자 교체");
  assert.match(chargingText, /충전 불량/u);
  assert.match(chargingText, /충전 단자 교체/u);
  assert.doesNotMatch(chargingText, /배터리 성능 저하|배터리 교체/u);
});

test("an inspected part never borrows a replacement action from a later clause", () => {
  const cases = [
    {
      repairAction: "액정 커넥터를 점검했고 배터리를 교체했습니다",
      expected: "배터리 교체",
      rejected: /액정 교체/u,
    },
    {
      repairAction: "배터리 상태를 점검하고 충전 단자를 교체했습니다",
      expected: "충전 단자 교체",
      rejected: /배터리 교체/u,
    },
    {
      repairAction: "화면 이상 여부를 점검한 후 충전 단자를 교체했습니다",
      expected: "충전 단자 교체",
      rejected: /액정 교체/u,
    },
    {
      repairAction: "액정 상태를 확인했습니다. 배터리를 교체했습니다.",
      expected: "배터리 교체",
      rejected: /액정 교체/u,
    },
    {
      repairAction: "액정 교체는 하지 않았고 배터리를 교체했습니다.",
      expected: "배터리 교체",
      rejected: /액정 교체/u,
    },
    {
      repairAction: "액정 상태 확인 및 배터리 교체",
      expected: "배터리 교체",
      rejected: /액정 교체/u,
    },
    {
      repairAction: "배터리 상태 점검 및 충전 단자 교체",
      expected: "충전 단자 교체",
      rejected: /배터리 교체/u,
    },
    {
      repairAction: "액정 커넥터를 점검하여 배터리를 교체했습니다",
      expected: "배터리 교체",
      rejected: /액정 교체|커넥터 수리/u,
    },
    {
      repairAction: "액정은 정상으로 확인되어 배터리를 교체했습니다",
      expected: "배터리 교체",
      rejected: /액정 교체/u,
    },
    {
      repairAction: "화면 정상 / 충전 단자 교체",
      expected: "충전 단자 교체",
      rejected: /액정 교체/u,
    },
    {
      repairAction: "배터리 교체 대신 충전 단자를 교체",
      expected: "충전 단자 교체",
      rejected: /배터리 교체/u,
    },
    {
      repairAction: "배터리 말고 충전 단자를 교체",
      expected: "충전 단자 교체",
      rejected: /배터리 교체/u,
    },
    {
      repairAction: "배터리 교체가 아니라 충전 단자를 교체",
      expected: "충전 단자 교체",
      rejected: /배터리 교체/u,
    },
    {
      repairAction: "액정 교체 안 하고 배터리를 교체",
      expected: "배터리 교체",
      rejected: /액정 교체/u,
    },
    {
      repairAction: "액정은 교체 안 함, 배터리만 교체함",
      expected: "배터리 교체",
      rejected: /액정 교체/u,
    },
    {
      repairAction: "액정이 아니라 배터리를 교체",
      expected: "배터리 교체",
      rejected: /액정 교체/u,
    },
    {
      repairAction: "액정 교체를 검토했지만 배터리를 교체함",
      expected: "배터리 교체",
      rejected: /액정 교체/u,
    },
    {
      repairAction: "액정 교체 여부를 점검한 후 배터리를 교체함",
      expected: "배터리 교체",
      rejected: /액정 교체/u,
    },
  ];

  cases.forEach(({ repairAction, expected, rejected }) => {
    const label = buildRepairCaseActionLabel({ repairAction });

    assert.equal(label, expected);
    assert.doesNotMatch(label, rejected);
  });
});

test("symptom labels keep normal parts separate from the damaged part", () => {
  const cameraCase = {
    branch: "선릉점",
    device: "아이폰",
    model: "아이폰15프로",
    symptom: "화면은 정상이고 후면 카메라 유리가 파손됨",
    repairAction: "카메라 렌즈를 교체함",
  };
  const rearGlassCase = {
    branch: "강변점",
    device: "아이폰",
    model: "아이폰14프로",
    symptom: "후면 유리가 파손되었으나 화면과 터치는 정상임",
    repairAction: "후면 유리를 교체함",
  };
  const powerCase = {
    branch: "신도림점",
    device: "아이폰",
    model: "아이폰13",
    symptom: "터치는 정상이나 전원이 들어오지 않음",
    repairAction: "메인보드를 수리함",
  };
  const chargingCase = {
    branch: "선릉점",
    device: "아이폰",
    model: "아이폰14",
    symptom: "배터리 성능은 정상이나 충전이 되지 않음",
    repairAction: "충전 단자를 교체함",
  };

  const cameraTitle = buildRepairCaseTitle(cameraCase);
  const rearGlassTitle = buildRepairCaseTitle(rearGlassCase);
  const powerTitle = buildRepairCaseTitle(powerCase);
  const chargingTitle = buildRepairCaseTitle(chargingCase);

  assert.match(cameraTitle, /카메라 렌즈 파손/u);
  assert.doesNotMatch(cameraTitle, /액정 파손/u);
  assert.match(rearGlassTitle, /후면 유리 파손/u);
  assert.doesNotMatch(rearGlassTitle, /액정 파손/u);
  assert.match(powerTitle, /전원 불량/u);
  assert.doesNotMatch(powerTitle, /터치 불량/u);
  assert.match(chargingTitle, /충전 불량/u);
  assert.doesNotMatch(chargingTitle, /배터리 성능 저하/u);

  const contrastCases = [
    {
      symptom: "전원은 들어오지만 충전이 되지 않음",
      expected: /충전 불량/u,
      rejected: /전원 불량/u,
    },
    {
      symptom: "충전은 되지만 터치가 되지 않음",
      expected: /터치 불량/u,
      rejected: /충전 불량/u,
    },
    {
      symptom: "터치는 되지만 화면이 깨짐",
      expected: /액정 파손/u,
      rejected: /터치 불량/u,
    },
    {
      symptom: "화면 깨짐은 없고 터치가 되지 않음",
      expected: /터치 불량/u,
      rejected: /액정 파손/u,
    },
    {
      symptom: "터치 정상 및 전원 안됨",
      expected: /전원 불량/u,
      rejected: /터치 불량/u,
    },
    {
      symptom: "충전 정상 / 전원 안됨",
      expected: /전원 불량/u,
      rejected: /충전 불량/u,
    },
  ];

  contrastCases.forEach(({ symptom, expected, rejected }) => {
    const title = buildRepairCaseTitle({
      branch: "선릉점",
      device: "아이폰",
      model: "아이폰15프로",
      symptom,
    });

    assert.match(title, expected);
    assert.doesNotMatch(title, rejected);
  });
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
