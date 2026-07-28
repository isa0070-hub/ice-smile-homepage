// src/lib/seoEngine.js

/*
  아이스마일어게인 SEO Engine V2 - 1단계
  목적:
  - 네이버/구글 검색엔진이 이해하기 쉬운 짧고 일관된 URL 생성
  - 새 아이폰/아이패드/맥북/서피스 모델 자동 인식
  - battery-replacement-battery-repair 같은 중복 URL 방지
  - 기존 관리자 페이지와 호환 유지
*/

function normalizeText(value = "") {
  return String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(value = "") {
  return normalizeText(value).replace(/[\s._/\\-]+/g, "");
}

function cleanSlug(value = "") {
  return String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/&/g, "-and-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function limitSlug(slug, maxLength = 90) {
  const clean = cleanSlug(slug);

  if (clean.length <= maxLength) return clean;

  return clean
    .slice(0, maxLength)
    .replace(/-[^-]*$/g, "")
    .replace(/^-|-$/g, "");
}

function joinSlugParts(parts = []) {
  const tokens = parts
    .filter(Boolean)
    .flatMap((part) => cleanSlug(part).split("-"))
    .filter(Boolean);

    const blockedTokens = new Set(["service", "case"]);
  const result = [];
  const used = new Set();

  for (const token of tokens) {
    if (blockedTokens.has(token)) continue;
    if (used.has(token)) continue;

    used.add(token);
    result.push(token);
  }

  return limitSlug(result.join("-"));
}

function getSourceText(form = {}) {
  return [
    form.title,
    form.device,
    form.model,
    form.symptom,
    form.repair_content,
  ]
    .filter(Boolean)
    .join(" ");
}

function parseDevice(source = "") {
  const text = compactText(source);

  const deviceRules = [
    {
      slug: "ipad-pro",
      patterns: ["아이패드프로", "ipadpro"],
    },
    {
      slug: "ipad-air",
      patterns: ["아이패드에어", "ipadair"],
    },
    {
      slug: "ipad-mini",
      patterns: ["아이패드미니", "ipadmini"],
    },
    {
      slug: "ipad",
      patterns: ["아이패드", "ipad"],
    },
    {
      slug: "iphone",
      patterns: ["아이폰", "iphone"],
    },
    {
      slug: "macbook-pro",
      patterns: ["맥북프로", "macbookpro"],
    },
    {
      slug: "macbook-air",
      patterns: ["맥북에어", "macbookair"],
    },
    {
      slug: "macbook",
      patterns: ["맥북", "macbook"],
    },
    {
      slug: "imac",
      patterns: ["아이맥", "imac"],
    },
    {
      slug: "apple-watch",
      patterns: ["애플워치", "applewatch"],
    },
    {
      slug: "surface-laptop-studio",
      patterns: ["서피스랩탑스튜디오", "surfacelaptopstudio"],
    },
    {
      slug: "surface-laptop",
      patterns: ["서피스랩탑", "surfacelaptop"],
    },
    {
      slug: "surface-pro",
      patterns: ["서피스프로", "surfacepro"],
    },
    {
      slug: "surface-book",
      patterns: ["서피스북", "surfacebook"],
    },
    {
      slug: "surface-go",
      patterns: ["서피스고", "surfacego"],
    },
    {
      slug: "surface",
      patterns: ["서피스", "surface"],
    },
    {
      slug: "lg-gram",
      patterns: ["lg그램", "엘지그램", "그램", "lggram"],
    },
    {
      slug: "lenovo",
      patterns: ["레노버", "lenovo"],
    },
    {
      slug: "galaxy-book",
      patterns: ["갤럭시북", "galaxybook"],
    },
    {
      slug: "notebook",
      patterns: ["노트북", "laptop", "notebook"],
    },
    {
      slug: "airpods",
      patterns: ["에어팟", "airpods"],
    },
  ];

  for (const rule of deviceRules) {
    if (rule.patterns.some((pattern) => text.includes(pattern))) {
      return rule.slug;
    }
  }

  return "";
}

function parseIphoneModel(source = "") {
  const text = compactText(source);

  const seMatch = text.match(/(?:아이폰|iphone)?se([1-9])?/);
  if (seMatch) {
    return seMatch[1] ? `se-${seMatch[1]}` : "se";
  }

  const modelMatch = text.match(
    /(?:아이폰|iphone)?(1[0-9]|2[0-9])(?:프로맥스|promax|프로max|pro맥스|프로|pro|플러스|plus|미니|mini)?/
  );

  if (!modelMatch) {
    const appleModelNo = text.match(/a\d{4}/);
    return appleModelNo ? appleModelNo[0] : "";
  }

  const number = modelMatch[1];

  let suffix = "";

  if (
    text.includes(`${number}프로맥스`) ||
    text.includes(`${number}promax`) ||
    text.includes(`${number}프로max`) ||
    text.includes(`${number}pro맥스`)
  ) {
    suffix = "pro-max";
  } else if (
    text.includes(`${number}프로`) ||
    text.includes(`${number}pro`)
  ) {
    suffix = "pro";
  } else if (
    text.includes(`${number}플러스`) ||
    text.includes(`${number}plus`)
  ) {
    suffix = "plus";
  } else if (
    text.includes(`${number}미니`) ||
    text.includes(`${number}mini`)
  ) {
    suffix = "mini";
  }

  return joinSlugParts([number, suffix]);
}

function parseIpadModel(source = "") {
  const text = compactText(source);
  const parts = [];

  if (text.includes("129") || text.includes("12인치9")) {
    parts.push("12-9");
  } else if (text.includes("109") || text.includes("10인치9")) {
    parts.push("10-9");
  } else if (text.includes("105") || text.includes("10인치5")) {
    parts.push("10-5");
  } else if (text.includes("97") || text.includes("9인치7")) {
    parts.push("9-7");
  } else if (
    text.includes("13인치") ||
    text.includes("13inch") ||
    text.includes("ipadpro13") ||
    text.includes("아이패드프로13")
  ) {
    parts.push("13");
  } else if (
    text.includes("11인치") ||
    text.includes("11inch") ||
    text.includes("ipadpro11") ||
    text.includes("아이패드프로11") ||
    text.includes("ipadair11") ||
    text.includes("아이패드에어11")
  ) {
    parts.push("11");
  }

  const generationMatch = text.match(/(\d{1,2})(?:세대|generation|gen)/);
  if (generationMatch && !parts.includes(`${generationMatch[1]}th`)) {
    parts.push(`${generationMatch[1]}th`);
  }

  const chipMatch = text.match(/m([1-9]|10)/);
  if (chipMatch) {
    parts.push(`m${chipMatch[1]}`);
  }

  const appleModelNo = text.match(/a\d{4}/);
  if (!parts.length && appleModelNo) {
    parts.push(appleModelNo[0]);
  }

  return joinSlugParts(parts);
}

function parseMacModel(source = "") {
  const text = compactText(source);
  const parts = [];

  const sizeMatch = text.match(/(13|14|15|16)(?:인치|inch)/);
  if (sizeMatch) {
    parts.push(sizeMatch[1]);
  }

  const chipMatch = text.match(/m([1-9]|10)/);
  if (chipMatch) {
    parts.push(`m${chipMatch[1]}`);
  }

  const yearMatch = text.match(/20(1[5-9]|2[0-9])/);
  if (!chipMatch && yearMatch) {
    parts.push(yearMatch[0]);
  }

  const appleModelNo = text.match(/a\d{4}/);
  if (!parts.length && appleModelNo) {
    parts.push(appleModelNo[0]);
  }

  return joinSlugParts(parts);
}

function parseSurfaceModel(source = "", deviceSlug = "") {
  const text = compactText(source);

  const patternsByDevice = {
    "surface-pro": [
      /(?:서피스프로|surfacepro|프로)(\d{1,2})/,
      /(?:surfacepro)(\d{1,2})/,
    ],
    "surface-laptop": [
      /(?:서피스랩탑|surfacelaptop|랩탑)(\d{1,2})/,
    ],
    "surface-book": [
      /(?:서피스북|surfacebook|북)(\d{1,2})/,
    ],
    "surface-go": [
      /(?:서피스고|surfacego|고)(\d{1,2})/,
    ],
    "surface-laptop-studio": [
      /(?:서피스랩탑스튜디오|surfacelaptopstudio|스튜디오)(\d{1,2})?/,
    ],
  };

  const patterns = patternsByDevice[deviceSlug] || [
    /(?:서피스|surface)(?:프로|pro|랩탑|laptop|북|book|고|go)?(\d{1,2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  const msModelNo = text.match(/\b\d{4}\b/);
  if (msModelNo) {
    return msModelNo[0];
  }

  return "";
}

function parseAppleWatchModel(source = "") {
  const text = compactText(source);
  const parts = [];

  const ultraMatch = text.match(/(?:울트라|ultra)(\d)?/);
  if (ultraMatch) {
    parts.push("ultra");
    if (ultraMatch[1]) parts.push(ultraMatch[1]);
    return joinSlugParts(parts);
  }

  const seMatch = text.match(/se(\d)?/);
  if (seMatch) {
    parts.push("se");
    if (seMatch[1]) parts.push(seMatch[1]);
    return joinSlugParts(parts);
  }

  const seriesMatch = text.match(/(?:시리즈|series)?(\d{1,2})(?:세대|series)?/);
  if (seriesMatch) {
    parts.push(`series-${seriesMatch[1]}`);
  }

  const sizeMatch = text.match(/(38|40|41|42|44|45|49)mm/);
  if (sizeMatch) {
    parts.push(`${sizeMatch[1]}mm`);
  }

  return joinSlugParts(parts);
}

function parseGenericModel(source = "", deviceSlug = "") {
  const text = compactText(source);
  const parts = [];

  if (deviceSlug === "lg-gram") {
    const gramSize = text.match(/(?:그램|gram)?(13|14|15|16|17)(?:인치|inch)?/);
    if (gramSize) parts.push(gramSize[1]);
  }

  if (deviceSlug === "lenovo") {
    if (text.includes("리전") || text.includes("legion")) {
      parts.push("legion");
    } else if (text.includes("아이디어패드") || text.includes("ideapad")) {
      parts.push("ideapad");
    } else if (text.includes("씽크패드") || text.includes("thinkpad")) {
      parts.push("thinkpad");
    } else if (text.includes("요가") || text.includes("yoga")) {
      parts.push("yoga");
    }

    const numberMatch = text.match(/\d{1,2}/);
    if (numberMatch && parts.length) {
      parts.push(numberMatch[0]);
    }
  }

  const modelNo = text.match(/[a-z]{1,3}\d{3,5}[a-z0-9-]*/);
  if (!parts.length && modelNo) {
    parts.push(modelNo[0]);
  }

  return joinSlugParts(parts);
}

function parseModel(source = "", deviceSlug = "") {
  if (deviceSlug === "iphone") {
    return parseIphoneModel(source);
  }

  if (deviceSlug.startsWith("ipad")) {
    return parseIpadModel(source);
  }

  if (
    deviceSlug.startsWith("macbook") ||
    deviceSlug === "imac"
  ) {
    return parseMacModel(source);
  }

  if (deviceSlug.startsWith("surface")) {
    return parseSurfaceModel(source, deviceSlug);
  }

  if (deviceSlug === "apple-watch") {
    return parseAppleWatchModel(source);
  }

  return parseGenericModel(source, deviceSlug);
}

function parseRepairPart(source = "") {
  const text = compactText(source);

  const rules = [
    {
      slug: "back-glass",
      patterns: [
        "후면유리",
        "후면글라스",
        "뒷유리",
        "뒷판",
        "백글라스",
        "backglass",
        "backcover",
      ],
    },
    {
      slug: "camera-lens",
      patterns: [
        "카메라렌즈",
        "렌즈깨짐",
        "렌즈파손",
        "렌즈교체",
        "cameralens",
      ],
    },
    {
      slug: "charging-port",
      patterns: [
        "충전단자",
        "충전포트",
        "충전잭",
        "chargeport",
        "chargingport",
      ],
    },
    {
      slug: "battery",
      patterns: [
        "배터리",
        "밧데리",
        "성능저하",
        "효율저하",
        "배터리효율",
        "스웰링",
        "부풀음",
        "배터리팽창",
        "배부름",
        "battery",
        "swelling",
      ],
    },
    {
      slug: "screen",
      patterns: [
        "액정",
        "화면파손",
        "화면깨짐",
        "화면불량",
        "디스플레이",
        "전면유리",
        "lcd",
        "screen",
        "display",
      ],
    },
    {
      slug: "logic-board",
      patterns: [
        "메인보드",
        "보드수리",
        "로직보드",
        "logicboard",
        "mainboard",
        "boardrepair",
      ],
    },
    {
      slug: "camera",
      patterns: [
        "카메라불량",
        "카메라안됨",
        "카메라교체",
        "초점불량",
        "카메라떨림",
        "카메라흔들림",
        "camera",
      ],
    },
    {
      slug: "touch",
      patterns: [
        "터치불량",
        "터치안됨",
        "터치먹통",
        "touch",
      ],
    },
    {
      slug: "keyboard",
      patterns: ["키보드", "keyboard"],
    },
    {
      slug: "trackpad",
      patterns: ["트랙패드", "터치패드", "trackpad", "touchpad"],
    },
    {
      slug: "speaker",
      patterns: ["스피커", "speaker"],
    },
    {
      slug: "microphone",
      patterns: ["마이크", "microphone", "mic"],
    },
    {
      slug: "wifi",
      patterns: ["와이파이", "wifi", "wi-fi"],
    },
    {
      slug: "bluetooth",
      patterns: ["블루투스", "bluetooth"],
    },
    {
      slug: "face-id",
      patterns: ["페이스아이디", "faceid", "face-id"],
    },
    {
      slug: "true-tone",
      patterns: ["트루톤", "truetone", "true-tone"],
    },
    {
      slug: "fan",
      patterns: ["팬소음", "쿨러", "팬불량", "fan", "cooler"],
    },
  ];

  for (const rule of rules) {
    if (
      rule.patterns.some((pattern) =>
        text.includes(compactText(pattern))
      )
    ) {
      return rule.slug;
    }
  }

  return "";
}

function parseRepairSymptoms(source = "") {
  const text = compactText(source);

  const rules = [
    {
      slug: "water-damage",
      patterns: [
        "침수",
        "물들어감",
        "물이들어감",
        "액체유입",
        "음료침수",
        "커피쏟음",
        "음료쏟음",
        "waterdamage",
        "liquiddamage",
      ],
    },
    {
      slug: "battery-swelling",
      patterns: [
        "배터리스웰링",
        "스웰링",
        "배터리부풀음",
        "배터리부풀어",
        "배터리팽창",
        "배부름",
        "batteryswelling",
        "swollenbattery",
      ],
    },
    {
      slug: "screen-lifting",
      patterns: [
        "액정들뜸",
        "화면들뜸",
        "유리들뜸",
        "액정벌어짐",
        "화면벌어짐",
        "들뜸",
        "screenlifting",
      ],
    },
    {
      slug: "crack",
      patterns: [
        "깨짐",
        "깨졌",
        "금이감",
        "금감",
        "크랙",
        "유리깨짐",
        "crack",
        "cracked",
      ],
    },
    {
      slug: "damage",
      patterns: [
        "파손",
        "손상",
        "찌그러짐",
        "damage",
        "damaged",
        "broken",
      ],
    },
    {
      slug: "no-power",
      patterns: [
        "전원불",
        "전원안됨",
        "전원이안됨",
        "전원무",
        "전원먹통",
        "전원이안켜짐",
        "전원불량",
        "nopower",
        "deaddevice",
      ],
    },
    {
      slug: "no-display",
      patterns: [
        "화면불",
        "화면안나옴",
        "화면이안나옴",
        "화면먹통",
        "검은화면",
        "무화면",
        "nodisplay",
        "blackscreen",
      ],
    },
    {
      slug: "touch-issue",
      patterns: [
        "터치불량",
        "터치안됨",
        "터치가안됨",
        "터치먹통",
        "touchissue",
        "notouch",
      ],
    },
    {
      slug: "not-charging",
      patterns: [
        "충전안됨",
        "충전이안됨",
        "충전불량",
        "충전문제",
        "notcharging",
        "chargingissue",
      ],
    },
    {
      slug: "battery-drain",
      patterns: [
        "배터리광탈",
        "광탈",
        "소모빠름",
        "소모가빠름",
        "배터리빨리닳음",
        "batterydrain",
        "fastdrain",
      ],
    },
    {
      slug: "boot-issue",
      patterns: [
        "부팅안됨",
        "부팅불량",
        "무한재부팅",
        "재부팅반복",
        "부팅반복",
        "bootloop",
        "bootissue",
      ],
    },
    {
      slug: "overheating",
      patterns: [
        "발열",
        "과열",
        "뜨거워짐",
        "overheating",
      ],
    },
    {
      slug: "camera-issue",
      patterns: [
        "카메라불량",
        "카메라안됨",
        "초점불량",
        "카메라떨림",
        "카메라흔들림",
        "cameraissue",
      ],
    },
  ];

  const symptoms = [];

  for (const rule of rules) {
    const matched = rule.patterns.some((pattern) =>
      text.includes(compactText(pattern))
    );

    if (matched && !symptoms.includes(rule.slug)) {
      symptoms.push(rule.slug);
    }
  }

  // 깨짐과 파손이 함께 감지되면 더 구체적인 crack만 사용
  const filteredSymptoms = symptoms.includes("crack")
    ? symptoms.filter((symptom) => symptom !== "damage")
    : symptoms;

  // URL이 지나치게 길어지지 않도록 핵심 증상은 최대 2개
  return filteredSymptoms.slice(0, 2);
}

function parseRepairAction(source = "") {
  const text = compactText(source);

  const replacementPatterns = [
    "교체",
    "교환",
    "부품교체",
    "액정교체",
    "배터리교체",
    "유리교체",
    "replacement",
    "replace",
  ];

  if (
    replacementPatterns.some((pattern) =>
      text.includes(compactText(pattern))
    )
  ) {
    return "replacement";
  }

  const repairPatterns = [
    "메인보드수리",
    "보드수리",
    "로직보드수리",
    "납땜수리",
    "회로수리",
    "복구",
    "복원",
    "boardrepair",
    "logicboardrepair",
  ];

  if (
    repairPatterns.some((pattern) =>
      text.includes(compactText(pattern))
    )
  ) {
    return "repair";
  }

  const cleaningPatterns = [
    "클리닝",
    "세척",
    "침수세척",
    "내부세척",
    "cleaning",
  ];

  if (
    cleaningPatterns.some((pattern) =>
      text.includes(compactText(pattern))
    )
  ) {
    return "cleaning";
  }

  const diagnosisPatterns = [
    "정밀점검",
    "고장점검",
    "진단",
    "diagnosis",
    "inspection",
  ];

  if (
    diagnosisPatterns.some((pattern) =>
      text.includes(compactText(pattern))
    )
  ) {
    return "diagnosis";
  }

  if (text.includes("수리") || text.includes("repair")) {
    return "repair";
  }

  return "";
}
export function getRepairSeoParts(form = {}) {
const source = getSourceText(form);

const device = parseDevice(source);
const model = parseModel(source, device);
const repairType = parseRepairPart(source);
const symptoms = parseRepairSymptoms(source);
const action = parseRepairAction(source);

const slug = joinSlugParts([
  device,
  model,
  repairType,
  ...symptoms,
  action,
]);

return {
  device,
  model,
  repairType,
  symptoms,
  action,
  slug,
};
}

export function generateEnglishSlug(form = {}) {
const { slug } = getRepairSeoParts(form);

return slug || "repair-case";
}

export function generateUniqueSlug(form = {}, existingSlugs = []) {
  const baseSlug = generateEnglishSlug(form);
  const usedSlugs = new Set(
    existingSlugs
      .filter(Boolean)
      .map((slug) => cleanSlug(slug))
  );

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let index = 2;
  let nextSlug = `${baseSlug}-${index}`;

  while (usedSlugs.has(nextSlug)) {
    index += 1;
    nextSlug = `${baseSlug}-${index}`;
  }

  return nextSlug;
}

export function generateSeoKeyword(form = {}) {
  return [
    form.branch,
    form.device,
    form.model,
    form.symptom,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeImageSeoText(value = "") {
  return String(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function joinImageSeoText(...values) {
  return values
    .flat()
    .map((value) => normalizeImageSeoText(value))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function limitImageSeoText(value, maxLength = 80) {
  const text = normalizeImageSeoText(value);

  if (text.length <= maxLength) return text;

  const sliced = text.slice(0, maxLength + 1);
  const lastSpace = sliced.lastIndexOf(" ");
  const cutPoint =
    lastSpace >= Math.floor(maxLength * 0.6)
      ? lastSpace
      : maxLength;

  return text
    .slice(0, cutPoint)
    .replace(/[\s,.:;·/_-]+$/g, "")
    .trim();
}

function getImageGroup(index) {
  if (index <= 3) return "initial";
  if (index <= 7) return "disassemble";
  if (index <= 11) return "repair";
  if (index <= 15) return "assemble";
  return "complete";
}

function getImageGroupIndex(group, index) {
  const groupStartMap = {
    initial: 0,
    disassemble: 4,
    repair: 8,
    assemble: 12,
    complete: 16,
  };

  return Math.max(0, index - groupStartMap[group]);
}

function getBaseInfo(form = {}) {
  const branch = normalizeImageSeoText(form.branch);
  const device =
    normalizeImageSeoText(form.device) || "기기";
  const model = normalizeImageSeoText(form.model);
  const symptom = normalizeImageSeoText(form.symptom);
  const repairContent = normalizeImageSeoText(
    form.repair_content,
  );
  const deviceModel = joinImageSeoText(device, model);
  const repairTask =
    repairContent || symptom || "수리";
  const issueLabel =
    symptom || `${repairTask} 접수 내용`;

  return {
    branch,
    device,
    model,
    symptom,
    repairContent,
    deviceModel,
    repairTask,
    issueLabel,
  };
}

export function generateAltText(form = {}, index = null) {
  const { branch, deviceModel, repairTask } = getBaseInfo(form);
  const base = joinImageSeoText(
    branch,
    deviceModel,
    repairTask,
  );

  if (index === null) {
    return limitImageSeoText(`${base} 대표 이미지`);
  }

  return limitImageSeoText(
    `${base} 상세사진 ${index + 1}`,
  );
}

function includesCompactText(text, patterns = []) {
  return patterns.some((pattern) =>
    text.includes(compactText(pattern))
  );
}

function getRepairSceneProfile(form = {}, baseInfo = getBaseInfo(form)) {
  const source = getSourceText(form);
  const sourceText = compactText(source);
  const repairPart = parseRepairPart(source);
  const deviceText = compactText(baseInfo.deviceModel);
  const isLaptop = includesCompactText(deviceText, [
    "맥북",
    "노트북",
    "그램",
    "갤럭시북",
    "서피스랩탑",
  ]);

  if (
    includesCompactText(sourceText, [
      "침수",
      "액체유입",
      "음료",
      "커피",
      "물들어감",
      "waterdamage",
      "liquiddamage",
    ])
  ) {
    return {
      target: "침수 부위",
      access: isLaptop
        ? "하판과 내부 연결 부품"
        : "외장 패널과 내부 연결 부품",
      existingPart: "오염·부식이 확인된 내부 부품",
      check: "전원 인가와 주요 기능 작동 상태",
      repairScenes: [
        "침수 흔적과 부식 범위 근접 확인",
        "오염된 내부 부품과 메인보드 상태 점검",
        "침수 부위 세척과 부식 제거 작업",
        "세척·복구 후 내부 회로와 커넥터 상태",
      ],
    };
  }

  if (repairPart === "battery") {
    return {
      target: "배터리",
      access: isLaptop
        ? "하판과 배터리 커넥터"
        : "전면 패널과 배터리 커넥터",
      existingPart: "기존 배터리",
      check: "충전 반응과 배터리 인식 상태",
      repairScenes: [
        "기존 배터리의 팽창·손상 여부 확인과 분리",
        "분리한 기존 배터리와 교체용 새 배터리 비교",
        "새 배터리 장착 위치와 접착 상태",
        "배터리 커넥터 연결과 내부 고정 상태",
      ],
    };
  }

  if (
    repairPart === "screen" ||
    repairPart === "touch"
  ) {
    return {
      target: "액정",
      access: isLaptop
        ? "디스플레이 베젤과 화면 연결 케이블"
        : "전면 액정과 디스플레이 케이블",
      existingPart: "파손 또는 불량 액정",
      check: "화면 출력과 터치 작동 상태",
      repairScenes: [
        "파손 또는 불량 액정 분리 작업",
        "분리한 기존 액정과 교체용 새 액정 비교",
        "새 액정의 디스플레이 케이블 연결 상태",
        "액정 장착 전 화면 출력과 터치 테스트",
      ],
    };
  }

  if (repairPart === "charging-port") {
    return {
      target: "충전단자",
      access: "외장 패널과 충전단자 연결 케이블",
      existingPart: "불량 충전단자",
      check: "케이블 연결과 충전 반응 상태",
      repairScenes: [
        "불량 충전단자와 주변 부품 상태 확인",
        "기존 충전단자 분리와 연결 부위 점검",
        "교체용 충전단자 장착 위치 확인",
        "충전단자 케이블 연결과 충전 반응 테스트",
      ],
    };
  }

  if (repairPart === "logic-board") {
    return {
      target: "메인보드",
      access: isLaptop
        ? "하판과 메인보드 연결 부품"
        : "외장 패널과 메인보드 연결 부품",
      existingPart: "점검 대상 메인보드",
      check: "전원 인가와 주요 기능 작동 상태",
      repairScenes: [
        "메인보드 손상 부위 현미경 점검",
        "불량 회로와 미세 부품 상태 확인",
        "메인보드 납땜·회로 복구 작업",
        "보드 수리 후 전원과 기능 테스트",
      ],
    };
  }

  if (
    repairPart === "camera" ||
    repairPart === "camera-lens"
  ) {
    const isLens = repairPart === "camera-lens";

    return {
      target: isLens ? "카메라 렌즈" : "카메라 모듈",
      access: isLens
        ? "파손 렌즈와 주변 프레임"
        : "외장 패널과 카메라 연결 케이블",
      existingPart: isLens
        ? "파손된 기존 카메라 렌즈"
        : "불량 카메라 모듈",
      check: "카메라 촬영과 초점 작동 상태",
      repairScenes: isLens
        ? [
            "파손된 카메라 렌즈와 주변 프레임 확인",
            "깨진 렌즈 조각 제거와 접착면 정리",
            "교체용 새 카메라 렌즈 위치 확인",
            "새 렌즈 부착과 카메라 촬영 테스트",
          ]
        : [
            "불량 카메라 모듈과 연결 부위 확인",
            "기존 카메라 모듈 분리 작업",
            "교체용 카메라 모듈 장착과 케이블 연결",
            "카메라 촬영·초점·떨림 보정 테스트",
          ],
    };
  }

  return {
    target: "수리 대상 부품",
    access: isLaptop
      ? "하판과 내부 연결 부품"
      : "외장 패널과 내부 연결 부품",
    existingPart: "기존 수리 대상 부품",
    check: "접수 증상과 기본 기능 작동 상태",
    repairScenes: [
      "수리 대상 부품의 손상 상태 확인",
      "기존 부품 분리와 연결 부위 점검",
      "교체 또는 복구한 부품 장착 과정",
      "수리 부품 연결과 기능 작동 테스트",
    ],
  };
}

function getImageSceneDetail(form = {}, index = 0) {
  const group = getImageGroup(index);
  const baseInfo = getBaseInfo(form);
  const profile = getRepairSceneProfile(form, baseInfo);
  const {
    repairTask,
    issueLabel,
  } = baseInfo;

  const sceneMap = {
    initial: [
      `입고 당시 ${issueLabel}과 외관 상태`,
      `${repairTask} 전 전면·측면 상태`,
      `${issueLabel} 확인을 위한 수리 전 점검`,
      `${repairTask} 전 전체 상태 확인`,
    ],
    disassemble: [
      `${repairTask} 진행을 위한 ${profile.access} 분해 과정`,
      `${profile.access} 분리 후 내부가 열린 상태`,
      `${profile.target} 연결 케이블·커넥터 점검`,
      `${profile.existingPart}가 확인된 내부 구조`,
    ],
    repair: profile.repairScenes,
    assemble: [
      `${repairTask} 후 내부 부품과 케이블 정리`,
      `재조립 전 ${profile.check} 1차 점검`,
      `${profile.access} 재조립 과정`,
      "접착면·나사·커넥터 고정 상태 확인",
    ],
    complete: [
      `${repairTask} 완료 후 외관 상태`,
      `${profile.check} 확인`,
      `${issueLabel} 개선 여부 점검`,
      "화면·터치·버튼 등 기본 기능 테스트",
      "수리 부위와 조립 상태 최종 확인",
      "반복 테스트를 마친 품질 검사 상태",
      "외관 정리와 출고 준비 상태",
      "최종 검수를 마친 수리 완료 기기",
    ],
  };

  const groupScenes =
    sceneMap[group] || sceneMap.complete;
  const relativeIndex = getImageGroupIndex(group, index);

  return groupScenes[relativeIndex % groupScenes.length];
}

// 새 규칙 적용 직후 화면에 남아 있는 이전 자동문구를 구분할 때만 사용한다.
// 관리자 페이지가 수동으로 고친 문구는 보존하면서 기존 자동문구만 새 문구로 바꿀 수 있다.
export function generateLegacyGroupAltText(form = {}, index = 0) {
  const group = getImageGroup(index);
  const {
    branch,
    deviceModel,
    symptom,
    repairTask,
  } = getBaseInfo(form);

  const legacyAltTextMap = {
    initial: [
      `입고 상태와 ${symptom || repairTask} 내용 확인`,
      "수리 전 기기 상태 기록",
      `${symptom || repairTask} 관련 상태 확인`,
      `${repairTask} 작업 전 상태 점검`,
    ],
    disassemble: [
      `${repairTask} 작업 준비 단계`,
      "수리 과정 초반 기기 상태",
      `${repairTask} 작업 대상 상태 확인`,
      "본격적인 수리 전 상태 기록",
    ],
    repair: [
      `${repairTask} 작업 진행`,
      `${repairTask} 과정 중간 상태`,
      "수리 대상 부위 작업 과정",
      `${repairTask} 작업 후 상태 확인`,
    ],
    assemble: [
      "수리 후 기기 정리 과정",
      `${repairTask} 마무리 단계`,
      "수리 후 상태 확인 과정",
      "작업 완료 전 기기 상태 점검",
    ],
    complete: [
      `${repairTask} 완료 상태`,
      "수리 후 기본 작동 상태 확인",
      `${symptom || repairTask} 수리 결과 확인`,
      "출고 전 기기 상태 점검",
      "접수 증상 수리 후 확인",
      "수리 마감 상태 확인",
      "출고 준비를 마친 기기",
      "최종 검수를 마친 수리 완료 상태",
    ],
  };

  const groupTexts =
    legacyAltTextMap[group] || legacyAltTextMap.complete;
  const relativeIndex = getImageGroupIndex(group, index);
  const detailText =
    groupTexts[relativeIndex % groupTexts.length];
  const importantPhoto =
    index === 0 || index === 16;

  return limitImageSeoText(
    joinImageSeoText(
      importantPhoto ? branch : "",
      deviceModel,
      detailText,
    ),
  );
}

export function generateLegacyImageDescription(
  form = {},
  index = 0,
) {
  const group = getImageGroup(index);
  const {
    deviceModel,
    symptom,
    repairTask,
  } = getBaseInfo(form);
  const issue = symptom || repairTask;

  const legacyDescriptionMap = {
    initial: [
      `${deviceModel}의 입고 상태와 접수된 ${issue} 내용을 확인한 사진입니다.`,
      `수리를 시작하기 전 ${deviceModel}의 상태를 다른 각도에서 기록한 사진입니다.`,
      `${deviceModel}에서 접수된 ${issue} 관련 상태를 확인한 사진입니다.`,
      `${repairTask} 작업 전 ${deviceModel}의 상태를 점검한 사진입니다.`,
    ],
    disassemble: [
      `${deviceModel}의 ${repairTask} 작업을 준비하는 단계의 사진입니다.`,
      `${deviceModel} 수리 과정 초반의 기기 상태를 기록한 사진입니다.`,
      `${repairTask} 작업을 진행하기 전 대상 상태를 확인한 사진입니다.`,
      `본격적인 수리 작업 전에 ${deviceModel}의 상태를 다시 확인한 사진입니다.`,
    ],
    repair: [
      `${deviceModel}의 ${repairTask} 작업이 진행되는 과정을 기록한 사진입니다.`,
      `${repairTask} 작업 중간에 ${deviceModel}의 상태를 확인한 사진입니다.`,
      `${deviceModel}의 수리 대상 부위를 작업하는 과정을 담은 사진입니다.`,
      `${repairTask} 작업 후 결과를 확인하는 단계의 사진입니다.`,
    ],
    assemble: [
      `${deviceModel} 수리 후 마무리 작업이 진행되는 과정을 담은 사진입니다.`,
      `${repairTask} 작업을 마무리하며 ${deviceModel}의 상태를 확인한 사진입니다.`,
      `수리 후 ${deviceModel}의 상태를 다시 점검하는 과정을 담은 사진입니다.`,
      `작업 완료 전 ${deviceModel}의 전체 상태를 확인한 사진입니다.`,
    ],
    complete: [
      `${deviceModel}의 ${repairTask} 작업이 완료된 상태를 기록한 사진입니다.`,
      `수리 후 ${deviceModel}의 기본 작동 상태를 확인한 사진입니다.`,
      `${issue} 수리 결과를 확인한 ${deviceModel} 사진입니다.`,
      `출고 전 ${deviceModel}의 상태를 최종 점검한 사진입니다.`,
      `접수된 ${issue} 증상을 수리 후 다시 확인한 사진입니다.`,
      `${deviceModel} 수리 마감 상태를 확인한 사진입니다.`,
      `출고 준비를 마친 ${deviceModel}의 상태를 기록한 사진입니다.`,
      `최종 검수를 마친 ${deviceModel}의 수리 완료 사진입니다.`,
    ],
  };

  const groupTexts =
    legacyDescriptionMap[group] ||
    legacyDescriptionMap.complete;
  const relativeIndex = getImageGroupIndex(group, index);

  return groupTexts[relativeIndex % groupTexts.length];
}

function addSubjectParticle(value = "") {
  const text = normalizeImageSeoText(value);
  const lastCharacter = text.at(-1);

  if (!lastCharacter) return text;

  const code = lastCharacter.charCodeAt(0);
  const isHangulSyllable =
    code >= 0xac00 && code <= 0xd7a3;

  if (!isHangulSyllable) {
    return `${text}이`;
  }

  const hasFinalConsonant =
    (code - 0xac00) % 28 !== 0;

  return `${text}${hasFinalConsonant ? "이" : "가"}`;
}

export function generateGroupAltText(form = {}, index = 0) {
  const {
    branch,
    deviceModel,
  } = getBaseInfo(form);
  const detailText = getImageSceneDetail(form, index);

  // 지점명은 핵심 사진에만 넣어 동일 키워드의 과도한 반복을 막는다.
  const importantPhoto =
    index === 0 || index === 16;

  return limitImageSeoText(
    joinImageSeoText(
      importantPhoto ? branch : "",
      deviceModel,
      detailText,
    ),
  );
}

export function generateImageDescription(form = {}, index = 0) {
  const { deviceModel } = getBaseInfo(form);
  const detailText = getImageSceneDetail(form, index);
  const subject = addSubjectParticle(
    `${deviceModel}의 ${detailText}`,
  );

  return `사진에는 ${subject} 담겨 있습니다.`;
}

function makeConciseAltDetail(description) {
  return normalizeImageSeoText(description)
    .replace(/[.!?]+$/g, "")
    .replace(/^사진에는\s*/g, "")
    .replace(/\s*(?:이|가)\s*담겨\s*있습니다$/g, "")
    .replace(/\s*사진입니다$/g, "")
    .replace(/\s*(?:장면|과정|모습|단계|상태)입니다$/g, "")
    .replace(/(?:을|를)\s*다른 각도에서 기록한$/g, " 다른 각도")
    .replace(/(?:을|를)\s*준비하는 단계의?$/g, " 준비 단계")
    .replace(/(?:이|가)\s*진행되는 과정을 기록한$/g, " 진행 과정")
    .replace(/(?:을|를)\s*담은$/g, "")
    .replace(/(?:이|가)\s*진행되는 과정$/g, " 진행 과정")
    .replace(/(?:을|를)\s*확인한$/g, " 확인")
    .replace(/(?:을|를)\s*점검한$/g, " 점검")
    .replace(/(?:을|를)\s*기록한$/g, " 기록")
    .replace(/\s*(장면|과정|모습|단계|상태)의$/g, " $1")
    .trim();
}

export function generateAltFromDescription(
  form = {},
  description,
  index = 0,
) {
  const cleanDescription = normalizeImageSeoText(description);

  if (!cleanDescription) {
    return generateGroupAltText(form, index);
  }

  const { branch, deviceModel } = getBaseInfo(form);
  const detailText = makeConciseAltDetail(cleanDescription);
  const compactDetail = compactText(detailText);
  const compactTarget = compactText(deviceModel);
  const includesTarget =
    compactTarget && compactDetail.includes(compactTarget);
  const importantPhoto =
    index === 0 || index === 16;

  return limitImageSeoText(
    joinImageSeoText(
      importantPhoto ? branch : "",
      includesTarget ? "" : deviceModel,
      detailText,
    ),
  );
}
