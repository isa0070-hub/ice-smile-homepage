// 공개 메타 제목에 사이트명이 붙어도 핵심 문구가 잘리지 않도록 짧게 유지합니다.
const MAX_TITLE_LENGTH = 48;
const MAX_ALT_LENGTH = 80;

export const AUTHORING_STAGES = Object.freeze([
  Object.freeze({ key: "intake", title: "접수 증상과 기기 상태" }),
  Object.freeze({ key: "diagnosis", title: "점검 결과" }),
  Object.freeze({ key: "repair", title: "진행한 수리 작업" }),
  Object.freeze({ key: "verification", title: "수리 후 기능 확인" }),
]);

const STAGE_KEYS = new Set(AUTHORING_STAGES.map((stage) => stage.key));

export function normalizeAuthoringText(value = "") {
  return String(value)
    .normalize("NFKC")
    .replace(/\s+/gu, " ")
    .trim();
}

function comparable(value = "") {
  return normalizeAuthoringText(value)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/gu, "");
}

function trimPunctuation(value = "") {
  return normalizeAuthoringText(value)
    .replace(/^[\s:;·,|/\-]+/gu, "")
    .replace(/[\s.!?。:;·,|/\-]+$/gu, "")
    .trim();
}

function makeFactLabel(value = "", maxLength = 18) {
  const firstClause = trimPunctuation(value)
    .split(/(?:,|;| 그리고 |(?:되|하)고\s|(?:했|였)으며\s)/u)[0]
    .trim();
  const label = firstClause
    .replace(/^파손된\s+/u, "")
    .replace(/(이|가)\s+(파손|고장|불량|손상)(?:됨|되었음|되었습니다)?$/u, " $2")
    .replace(/(을|를)\s+(교체|수리|세척|복구|점검)(?:함|했음|했습니다)?$/u, " $2")
    .replace(/(?:되었음|되었습니다|했음|했습니다|확인함|나타남|보임|발생함|있음|함|됨)$/u, "")
    .replace(/\s+(?:은|는|이|가|을|를|에|에서|으로|와|과|및)$/u, "")
    .replace(/\s+/gu, " ")
    .trim();

  return limitAtBoundary(label || firstClause, maxLength)
    .replace(/\s+(?:은|는|이|가|을|를|에|에서|으로|와|과|및)$/u, "")
    .trim();
}

function makeActionLabel(value = "", maxLength = 18) {
  const text = trimPunctuation(value);
  const clauses = text
    .split(/(?:,|;| 그리고 |(?:되|하)고\s|(?:했|였)으며\s)/u)
    .map((clause) => clause.trim())
    .filter(Boolean);
  const selected =
    [...clauses]
      .reverse()
      .find((clause) => /(교체|수리|세척|복구|조정|재납땜|장착|분해|점검)/u.test(clause)) ||
    clauses[0] ||
    text;

  return makeFactLabel(
    selected.replace(/^(?:파손된|손상된|불량한)\s+/u, ""),
    maxLength,
  );
}

function makeSymptomLabel(value = "", maxLength = 18) {
  const text = trimPunctuation(value);
  const source = comparable(text);
  const rules = [
    [/충전/u, /(안|되지|불가|불량|인식못)/u, "충전 불량"],
    [/전원/u, /(안|들어오지|불가|불량|꺼짐)/u, "전원 불량"],
    [/(액정|유리)/u, /(파손|깨짐|금감)/u, "액정 파손"],
    [/배터리/u, /(성능|소모|빨리|급격|부풀)/u, "배터리 성능 저하"],
    [/(화면|액정)/u, /(녹색줄|세로줄|가로줄|줄생김)/u, "화면 줄 발생"],
    [/터치/u, /(안|불가|불량|오작동)/u, "터치 불량"],
    [/(침수|물|액체)/u, /(유입|들어|침수)/u, "액체 유입"],
  ];
  const matched = rules.find(
    ([subjectPattern, statePattern]) =>
      subjectPattern.test(source) && statePattern.test(source),
  );

  return matched ? matched[2] : makeFactLabel(text, maxLength);
}

function limitAtBoundary(value, maxLength) {
  const text = trimPunctuation(value);

  if (text.length <= maxLength) return text;

  const sentenceCut = text.slice(0, maxLength + 1).search(/[.!?。;\n]/u);
  if (sentenceCut >= Math.floor(maxLength * 0.45)) {
    return trimPunctuation(text.slice(0, sentenceCut));
  }

  const sliced = text.slice(0, maxLength + 1);
  const lastSpace = sliced.lastIndexOf(" ");
  const cutPoint =
    lastSpace >= Math.floor(maxLength * 0.55) ? lastSpace : maxLength;

  return trimPunctuation(text.slice(0, cutPoint));
}

function removeIncludedParts(value, parts = []) {
  let result = normalizeAuthoringText(value);

  parts
    .map(normalizeAuthoringText)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .forEach((part) => {
      result = result.replaceAll(part, " ");
    });

  return normalizeAuthoringText(result.replace(/[|｜·ㆍ,/]+/gu, " "));
}

export function getDeviceModelLabel(draft = {}) {
  const device = normalizeAuthoringText(draft.device);
  const model = normalizeAuthoringText(draft.model);

  if (!device) return model;
  if (!model) return device;
  if (comparable(model).includes(comparable(device))) return model;

  return `${device} ${model}`;
}

function makeTitleParts(draft, factLength) {
  const branch = normalizeAuthoringText(draft.branch);
  const deviceModel = getDeviceModelLabel(draft);
  const symptom = limitAtBoundary(
    makeSymptomLabel(
      removeIncludedParts(draft.symptom, [branch, deviceModel, draft.device, draft.model]),
      factLength,
    ),
    factLength,
  );
  const action = limitAtBoundary(
    makeActionLabel(
      removeIncludedParts(draft.repairAction, [branch, deviceModel, draft.device, draft.model]),
      factLength,
    ),
    factLength,
  );

  return [branch, deviceModel, symptom, action, "수리사례"].filter(Boolean);
}

function dedupeTitleParts(parts = []) {
  const result = [];

  parts.forEach((part) => {
    const clean = normalizeAuthoringText(part);
    const cleanComparable = comparable(clean);
    if (!cleanComparable) return;

    const previous = result.at(-1);
    if (previous && comparable(previous) === cleanComparable) return;

    result.push(clean);
  });

  return result;
}

export function buildRepairCaseTitle(draft = {}) {
  for (const factLength of [18, 14, 10]) {
    const candidate = dedupeTitleParts(makeTitleParts(draft, factLength)).join(" ");
    if (candidate.length <= MAX_TITLE_LENGTH) return candidate;
  }

  const compactParts = makeTitleParts(draft, 10);
  const withoutSymptom = [compactParts[0], compactParts[1], compactParts[3], "수리사례"];
  const candidate = dedupeTitleParts(withoutSymptom).join(" ");

  if (candidate.length <= MAX_TITLE_LENGTH) return candidate;

  return dedupeTitleParts([
    normalizeAuthoringText(draft.branch),
    limitAtBoundary(getDeviceModelLabel(draft), 28),
    "수리사례",
  ]).join(" ");
}

export function buildRepairCaseKeyword(draft = {}) {
  const excluded = [
    draft.branch,
    getDeviceModelLabel(draft),
    draft.device,
    draft.model,
  ];
  const action = removeIncludedParts(draft.repairAction, excluded);
  const symptom = removeIncludedParts(draft.symptom, excluded);

  return action ? makeActionLabel(action, 36) : makeSymptomLabel(symptom || "수리", 36);
}

export function buildRepairCaseSummary(draft = {}) {
  const branch = normalizeAuthoringText(draft.branch);
  const deviceModel = getDeviceModelLabel(draft) || "기기";
  const symptom = trimPunctuation(draft.symptom);
  const diagnosis = trimPunctuation(draft.diagnosis);
  const action = trimPunctuation(draft.repairAction);
  const verification = trimPunctuation(draft.verification);

  const heading = normalizeAuthoringText(
    `${branch ? `${branch}에서 진행한` : ""} ${deviceModel} 실제 수리사례입니다.`,
  );
  const facts = [
    symptom ? `접수 증상: ${symptom}` : "",
    diagnosis ? `점검 결과: ${diagnosis}` : "",
    action ? `진행 작업: ${action}` : "",
    verification ? `완료 확인: ${verification}` : "",
  ].filter(Boolean);

  return `${heading}${facts.length ? ` ${facts.join("; ")}.` : ""}`;
}

export function buildRepairCaseSearchSummary(draft = {}) {
  const branch = normalizeAuthoringText(draft.branch);
  const deviceModel = getDeviceModelLabel(draft) || "기기";
  const symptom = limitAtBoundary(draft.symptom, 32);
  const action = limitAtBoundary(draft.repairAction, 32);
  const verification = limitAtBoundary(draft.verification, 32);
  const facts = [
    symptom ? `증상: ${symptom}` : "",
    action ? `작업: ${action}` : "",
    verification ? `완료 확인: ${verification}` : "",
  ].filter(Boolean);

  return normalizeAuthoringText(
    `${branch ? `${branch} ` : ""}${deviceModel} 수리사례입니다.${
      facts.length ? ` ${facts.join("; ")}.` : ""
    }`,
  );
}

function limitAlt(value) {
  return limitAtBoundary(value, MAX_ALT_LENGTH);
}

export function buildRepairCaseMainAlt(draft = {}) {
  const deviceModel = getDeviceModelLabel(draft) || "수리 기기";
  const keyword = buildRepairCaseKeyword(draft);

  return limitAlt(`${deviceModel} ${keyword} 대표 사진`);
}

export function buildRepairCaseImageAlt(draft = {}, description = "", index = 0) {
  const deviceModel = getDeviceModelLabel(draft) || "수리 기기";
  const detail = trimPunctuation(description);
  const suffix = `사진 ${Number(index) + 1}`;

  return limitAlt(`${deviceModel} ${detail || "수리 과정"} ${suffix}`);
}

export function sortRepairCaseImages(images = []) {
  const stageOrder = new Map(
    AUTHORING_STAGES.map((stage, index) => [stage.key, index]),
  );

  return [...images]
    .map((image, originalIndex) => ({ image, originalIndex }))
    .sort((left, right) => {
      const leftStage = stageOrder.get(left.image?.stage) ?? AUTHORING_STAGES.length;
      const rightStage = stageOrder.get(right.image?.stage) ?? AUTHORING_STAGES.length;

      if (leftStage !== rightStage) return leftStage - rightStage;

      const leftOrder = Number(left.image?.sort_order);
      const rightOrder = Number(right.image?.sort_order);
      const safeLeft = Number.isFinite(leftOrder) ? leftOrder : left.originalIndex;
      const safeRight = Number.isFinite(rightOrder) ? rightOrder : right.originalIndex;

      return safeLeft - safeRight || left.originalIndex - right.originalIndex;
    })
    .map(({ image }, index) => ({ ...image, sort_order: index }));
}

function stageContent(draft, stageKey) {
  if (stageKey === "intake") return trimPunctuation(draft.symptom);
  if (stageKey === "diagnosis") return trimPunctuation(draft.diagnosis);
  if (stageKey === "repair") return trimPunctuation(draft.repairAction);

  const verification = trimPunctuation(draft.verification);
  const notes = trimPunctuation(draft.notes);

  if (verification && notes) {
    return `${verification}\n\n현장 특이사항: ${notes}`;
  }

  return verification || notes;
}

export function buildRepairCaseContentSections(draft = {}, sortedImages = []) {
  let nextImageNumber = 1;

  return AUTHORING_STAGES.map((stage) => {
    const imageCount = sortedImages.filter((image) => image?.stage === stage.key).length;
    const imageStart = imageCount > 0 ? nextImageNumber : 0;
    const imageEnd = imageCount > 0 ? nextImageNumber + imageCount - 1 : 0;

    if (imageCount > 0) {
      nextImageNumber = imageEnd + 1;
    }

    return {
      title: stage.title,
      content: stageContent(draft, stage.key),
      image_start: imageStart,
      image_end: imageEnd,
    };
  });
}

export function parseRepairCaseContentSections(value) {
  if (value == null || value === "") return [];

  let sections = value;

  for (let count = 0; count < 3 && typeof sections === "string"; count += 1) {
    try {
      sections = JSON.parse(sections);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(sections) && sections && typeof sections === "object") {
    if (Array.isArray(sections.sections)) {
      sections = sections.sections;
    } else if (Array.isArray(sections.content_sections)) {
      sections = sections.content_sections;
    } else {
      const values = Object.values(sections);
      sections = values.every((section) => section && typeof section === "object")
        ? values
        : [];
    }
  }

  if (!Array.isArray(sections)) return [];

  return sections
    .map((section) => {
      const isClosing =
        section?.type === "closing" ||
        section?.kind === "closing" ||
        section?.section_type === "closing" ||
        (section?.image_start == null &&
          section?.image_end == null &&
          normalizeAuthoringText(section?.title).includes("마무리"));
      const start = Number(section?.image_start);
      const end = Number(section?.image_end);

      return {
        ...(isClosing ? { type: "closing" } : {}),
        title: normalizeAuthoringText(section?.title),
        content: String(section?.content || "").trim(),
        image_start: isClosing
          ? null
          : Number.isFinite(start)
            ? Math.max(0, Math.floor(start))
            : 0,
        image_end: isClosing
          ? null
          : Number.isFinite(end)
            ? Math.max(0, Math.floor(end))
            : 0,
      };
    })
    .filter((section) => section.title || section.content);
}

export function extractRepairCaseFacts(sections = [], fallback = {}) {
  const facts = {
    diagnosis: normalizeAuthoringText(fallback.diagnosis),
    repairAction: normalizeAuthoringText(fallback.repairAction),
    verification: normalizeAuthoringText(fallback.verification),
    notes: normalizeAuthoringText(fallback.notes),
  };

  parseRepairCaseContentSections(sections).forEach((section) => {
    if (section.type === "closing") return;

    const title = comparable(section.title);
    const content = String(section.content || "").trim();

    if (title.includes("점검") || title.includes("진단")) {
      facts.diagnosis ||= content;
    } else if (title.includes("수리작업") || title.includes("진행한수리")) {
      facts.repairAction ||= content;
    } else if (
      title.includes("기능확인") ||
      title.includes("완료확인") ||
      title.includes("검수")
    ) {
      const [verification, notes] = content.split(/\n\n현장 특이사항:\s*/u);
      facts.verification ||= normalizeAuthoringText(verification);
      facts.notes ||= normalizeAuthoringText(notes);
    }
  });

  return facts;
}

const UNVERIFIED_CLAIMS = [
  "무조건",
  "완벽",
  "최고",
  "1등",
  "100%",
  "새것처럼",
  "당일 보장",
];

export function validateRepairCaseDraft(draft = {}, images = []) {
  const requiredFields = [
    ["branch", "지점"],
    ["category", "카테고리"],
    ["device", "기기 종류"],
    ["model", "정확한 모델명"],
    ["symptom", "접수 증상"],
    ["diagnosis", "점검 결과"],
    ["repairAction", "실제로 진행한 작업"],
    ["verification", "수리 후 확인 결과"],
  ];
  const errors = [];
  const warnings = [];
  const checks = [];

  requiredFields.forEach(([key, label]) => {
    const complete = Boolean(normalizeAuthoringText(draft[key]));
    checks.push({ key, label, complete });
    if (!complete) errors.push(`${label} 항목을 입력해주세요.`);
  });

  images.forEach((image, index) => {
    if (!STAGE_KEYS.has(image?.stage)) {
      errors.push(`사진 ${index + 1}의 단계를 선택해주세요.`);
    }
    if (!normalizeAuthoringText(image?.description)) {
      errors.push(`사진 ${index + 1}에 실제로 보이는 내용을 적어주세요.`);
    }
  });

  if (images.length === 0) {
    warnings.push("대표 수리 사진을 추가하면 검색 결과와 고객 이해에 도움이 됩니다.");
  }

  const source = normalizeAuthoringText(
    [
      draft.title,
      draft.symptom,
      draft.diagnosis,
      draft.repairAction,
      draft.verification,
      draft.notes,
    ].join(" "),
  );
  const claims = UNVERIFIED_CLAIMS.filter((claim) => source.includes(claim));

  if (claims.length > 0) {
    warnings.push(
      `과장으로 보일 수 있는 표현을 실제 사실인지 확인해주세요: ${claims.join(", ")}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    checks,
  };
}
