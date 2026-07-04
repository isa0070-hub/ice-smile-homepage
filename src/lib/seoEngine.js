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
  
    const blockedTokens = new Set(["repair", "replacement", "service", "case"]);
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
      form.seo_keyword,
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
  
  function parseRepairType(source = "") {
    const text = compactText(source);
  
    const repairRules = [
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
          "렌즈파손",
          "렌즈교체",
          "cameralens",
        ],
      },
      {
        slug: "camera",
        patterns: [
          "카메라불량",
          "카메라안됨",
          "카메라교체",
          "camera",
        ],
      },
      {
        slug: "battery",
        patterns: [
          "배터리",
          "밧데리",
          "성능저하",
          "효율저하",
          "효율",
          "광탈",
          "소모빠름",
          "소모가빠름",
          "스웰링",
          "부풀음",
          "배부름",
          "battery",
          "swelling",
        ],
      },
      {
        slug: "charging",
        patterns: [
          "충전안됨",
          "충전불량",
          "충전단자",
          "충전포트",
          "충전문제",
          "충전이안됨",
          "charging",
          "chargeport",
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
        slug: "touch",
        patterns: [
          "터치불량",
          "터치안됨",
          "터치먹통",
          "touch",
        ],
      },
      {
        slug: "power",
        patterns: [
          "전원불량",
          "전원안됨",
          "전원무",
          "전원꺼짐",
          "부팅안됨",
          "부팅불량",
          "boot",
          "power",
        ],
      },
      {
        slug: "water-damage",
        patterns: [
          "침수",
          "물들어감",
          "액체유입",
          "커피",
          "음료",
          "waterdamage",
          "liquiddamage",
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
        slug: "keyboard",
        patterns: [
          "키보드",
          "keyboard",
        ],
      },
      {
        slug: "trackpad",
        patterns: [
          "트랙패드",
          "터치패드",
          "trackpad",
          "touchpad",
        ],
      },
      {
        slug: "speaker",
        patterns: [
          "스피커",
          "speaker",
        ],
      },
      {
        slug: "microphone",
        patterns: [
          "마이크",
          "microphone",
          "mic",
        ],
      },
      {
        slug: "wifi",
        patterns: [
          "와이파이",
          "wifi",
          "wi-fi",
        ],
      },
      {
        slug: "bluetooth",
        patterns: [
          "블루투스",
          "bluetooth",
        ],
      },
      {
        slug: "face-id",
        patterns: [
          "페이스아이디",
          "faceid",
          "face-id",
        ],
      },
      {
        slug: "true-tone",
        patterns: [
          "트루톤",
          "truetone",
          "true-tone",
        ],
      },
      {
        slug: "fan",
        patterns: [
          "팬소음",
          "쿨러",
          "팬불량",
          "fan",
          "cooler",
        ],
      },
      {
        slug: "overheating",
        patterns: [
          "발열",
          "과열",
          "overheating",
          "heat",
        ],
      },
    ];
  
    for (const rule of repairRules) {
      if (rule.patterns.some((pattern) => text.includes(compactText(pattern)))) {
        return rule.slug;
      }
    }
  
    if (text.includes("교체")) return "replacement";
    if (text.includes("수리")) return "repair";
  
    return "repair";
  }
  
  export function getRepairSeoParts(form = {}) {
    const source = getSourceText(form);
    const device = parseDevice(source);
    const model = parseModel(source, device);
    const repairType = parseRepairType(source);
  
    return {
      device,
      model,
      repairType,
      slug: joinSlugParts([device, model, repairType]),
    };
  }
  
  export function generateEnglishSlug(form = {}) {
    const { device, model, repairType } = getRepairSeoParts(form);
  
    const slug = joinSlugParts([device, model, repairType]);
  
    if (slug) return slug;
  
    return "repair-case";
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
  
  export function generateAltText(form = {}, index = null) {
    const base = `${form.branch || "수리전문 공식서비스센터"} ${
      form.device || "기기"
    } ${form.model || ""} ${
      form.symptom || "수리"
    } 수리사례 이미지 ${form.title || ""}`.trim();
  
    return index === null ? base : `${base} 상세사진 ${index + 1}`;
  }
  
  function getImageGroup(index) {
    if (index <= 3) return "initial";
    if (index <= 7) return "disassemble";
    if (index <= 11) return "repair";
    if (index <= 15) return "assemble";
    return "complete";
  }
  
  function getBaseInfo(form = {}) {
    return {
      branch: form.branch || "수리전문 공식서비스센터",
      device: form.device || "기기",
      model: form.model || "",
      symptom: form.symptom || "수리",
      title: form.title || "",
    };
  }
  
  export function generateGroupAltText(form = {}, index = 0) {
    const group = getImageGroup(index);
    const { branch, device, model, symptom, title } = getBaseInfo(form);
    const target = `${branch} ${device} ${model} ${symptom}`
      .replace(/\s+/g, " ")
      .trim();
  
    const photoNo = index + 1;
    const groupNo = Math.floor(index / 4) + 1;
  
    const detailByGroup = {
      initial: [
        "입고된 기기의 외관 상태와 파손 부위를 확인하는 초기 점검 장면입니다.",
        "화면과 프레임 상태를 확인하며 수리 전 증상을 기록하는 과정입니다.",
        "고객 요청 증상과 실제 기기 상태를 비교하며 점검하는 이미지입니다.",
        "수리 전 기본 기능과 손상 범위를 확인하는 초기 확인 과정입니다.",
      ],
      disassemble: [
        "수리를 위해 기기를 분해하고 내부 구조를 확인하는 과정입니다.",
        "내부 커넥터와 주요 부품 상태를 점검하는 분해 작업 이미지입니다.",
        "메인보드와 연결 부위를 확인하며 고장 원인을 찾는 과정입니다.",
        "내부 오염과 부품 손상 여부를 세밀하게 확인하는 점검 장면입니다.",
      ],
      repair: [
        "문제가 확인된 부위를 중심으로 수리 작업을 진행하는 과정입니다.",
        "부품 교체와 내부 클리닝을 함께 진행하며 상태를 개선하는 장면입니다.",
        "수리 부위 주변을 점검하고 정상 작동을 위한 작업을 이어가는 이미지입니다.",
        "손상 부위 수리 후 연결 상태와 내부 상태를 다시 확인하는 과정입니다.",
      ],
      assemble: [
        "수리 완료 후 부품 위치와 체결 상태를 확인하며 조립하는 과정입니다.",
        "액정과 내부 부품 정렬 상태를 확인하며 마감하는 장면입니다.",
        "조립 후 화면과 주요 기능이 정상적으로 반응하는지 확인하는 이미지입니다.",
        "수리 후 기기 외관과 내부 연결 상태를 함께 점검하는 과정입니다.",
      ],
      complete: [
        "수리 완료 후 전원과 화면 상태를 최종 확인하는 테스트 이미지입니다.",
        "출고 전 터치, 화면, 충전 등 기본 기능을 점검하는 과정입니다.",
        "수리 완료 상태를 확인하고 고객 안내 전 마지막 검수를 진행하는 장면입니다.",
        "최종 테스트를 마친 뒤 정상 작동 여부를 확인하는 완료 이미지입니다.",
      ],
    };
  
    const groupTexts = detailByGroup[group];
    const detailText = groupTexts[index % 4];
  
    return `${target} 수리사례 상세사진 ${photoNo}번 이미지입니다. ${title} 관련 ${groupNo}번째 수리 단계로, ${detailText}`
      .replace(/\s+/g, " ")
      .trim();
  }
  
  export function generateImageDescription(form = {}, index = 0) {
    const group = getImageGroup(index);
    const { device, model, symptom } = getBaseInfo(form);
    const target = `${device} ${model}`.replace(/\s+/g, " ").trim();
  
    const textMap = {
      initial: `${target}의 ${symptom} 증상을 확인하기 위해 입고 상태와 기본 작동 여부를 점검하는 단계입니다.`,
      disassemble: `${target} 내부를 분해하여 ${symptom} 원인과 관련된 부품 상태를 확인하는 과정입니다.`,
      repair: `${target}의 문제 부위를 수리하고 내부 클리닝과 상태 점검을 함께 진행하는 단계입니다.`,
      assemble: `수리 작업 후 ${target}을 다시 조립하며 연결 상태와 기능 작동 여부를 확인하는 과정입니다.`,
      complete: `${target} ${symptom} 수리 완료 후 출고 전 최종 테스트를 진행하는 단계입니다.`,
    };
  
    return textMap[group];
  }
  
  export function generateAltFromDescription(form = {}, description, index = 0) {
    const branch = form.branch || "수리전문 공식서비스센터";
    const device = form.device || "기기";
    const model = form.model || "";
    const symptom = form.symptom || "수리";
    const cleanDescription = (description || "").trim();
  
    if (!cleanDescription) {
      return generateGroupAltText(form, index);
    }
  
    return `${branch} ${device} ${model} ${symptom} 수리사례 이미지입니다. ${cleanDescription} 과정입니다.`
      .replace(/\s+/g, " ")
      .trim();
  }