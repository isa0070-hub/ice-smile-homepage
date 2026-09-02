const LEGACY_REPAIR_CASE_TITLES = Object.freeze({
  "레노버노트북-액정파손교체수리":
    "선릉점 레노버싱크 액정 파손 교체 수리 사례",
  "macbook-power-issue-water-damage-repair":
    "선릉점 맥북 프로 A1707 전원 불량 메인보드 수리 사례",
  "잠실-에서-강변점-방문-아이폰13프로-배터리교체-수리시간-20분-완료":
    "강변점 아이폰13프로 배터리 소모 빠름 교체 사례",
  "마이크로소프트-서피스프로-7-액정-파손-교체-내부-정밀-청소부터-완벽-당일수리-택배가능":
    "선릉점 서피스프로7 액정 파손 교체 수리 사례",
  "구로디지털-서피스-프로-9-액정-파손-교체-내부-정밀-크리닝-당일-완벽-택배-가능":
    "신도림점 서피스프로9 액정 파손 교체 수리 사례",
  "선릉점-아이폰15프로-액정파손-수리왕이-부활-완료":
    "선릉점 아이폰 15프로 액정 파손·녹색줄 교체 수리 사례",
});

const LOCATION_NAMES = [
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "성남",
  "분당",
  "용인",
  "수원",
  "일산",
  "김포",
  "부천",
  "전주",
  "천안",
  "청주",
  "창원",
  "강남",
  "강동",
  "서초",
  "송파",
  "하남",
  "잠실",
  "삼성동",
  "삼성역",
  "선릉",
  "역삼",
  "대치",
  "구로",
  "신도림",
  "강변",
  "광진",
];

const NEUTRAL_REPLACEMENTS = [
  [
    /아이스마일어게인의\s*공식\s*마스터\s*엔지니어\s*수리왕입니다/giu,
    "아이스마일어게인입니다",
  ],
  [
    /노트북\s*및\s*태블릿\s*PC\s*수리의\s*절대\s*강자/giu,
    "노트북 및 태블릿 PC 수리를 진행하는 전문점",
  ],
  [/수리\s*업계의\s*절대\s*강자/giu, "수리를 진행하는 전문점"],
  [
    /그럼\s*처참하게\s*깨진\s*아이폰15\s*프로가\s*어떻게\s*완벽하게\s*부활했는지,?\s*실시간\s*수리\s*과정을\s*함께\s*보시죠/giu,
    "아이폰15 프로의 액정 파손 상태와 교체 과정을 순서대로 설명합니다",
  ],
  [
    /계단에서\s*굴러\s*흉측하게\s*깨졌던\s*아이폰15\s*프로가\s*언제\s*그랬냐는\s*듯,?\s*방금\s*가로수길\s*애플스토어에서\s*픽업해\s*온\s*새\s*제품처럼\s*완벽하게\s*부활했습니다/giu,
    "액정 교체와 기능 점검 후 아이폰15 프로가 정상 작동하는 것을 확인했습니다",
  ],
  [/수리왕/giu, "아이스마일어게인"],
  [/1등\s*기술력/giu, "점검과 수리 기술"],
  [/최고의\s*기술력/giu, "점검과 수리 기술"],
  [/최고의\s*서비스/giu, "점검과 수리 서비스"],
  [/최고급\s*전용/giu, "전용"],
  [/분해\s*난이도가\s*최상급에\s*속합니다/giu, "분해 난이도가 높은 편입니다"],
  [/수리\s*완료\s*및\s*완벽한\s*대변신/giu, "수리 완료"],
  [
    /새\s*제품처럼\s*완벽하게\s*부활했습니다/giu,
    "정상 작동 상태로 복구했습니다",
  ],
  [
    /완벽한\s*컨디션으로\s*부활한/giu,
    "정상 작동 상태로 복구한",
  ],
  [/당일\s*완벽\s*복원/giu, "수리 완료"],
  [/완벽\s*기능\s*테스트/giu, "기능 테스트"],
  [/완벽\s*복원/giu, "수리 완료"],
  [/완벽하게\s*고쳐서/giu, "수리해"],
  [/완벽하게\s*부활/giu, "정상 작동 상태로 복구"],
  [/완벽해야/giu, "꼼꼼해야"],
  [/완벽\s*방수\s*실링/giu, "방수 실링"],
  [/완벽한\s*압착\s*조립/giu, "압착 조립"],
  [/완벽하게\s*교차\s*검증으로\s*재차\s*확인/giu, "여러 항목을 다시 확인"],
  [/완벽하게\s*테스트를\s*마친/giu, "기능 테스트를 마친"],
  [/완벽하게\s*제거/giu, "꼼꼼히 제거"],
  [/완벽하게\s*마무리/giu, "마무리"],
  [
    /본체\s*프레임과\s*완벽하게\s*수평을\s*이루며/giu,
    "본체 프레임에 맞춰 고르게",
  ],
  [/완벽하게\s*해결/giu, "해결"],
  [/부활\s*완료/giu, "복구 완료"],
  [/정품급(?:\s*고품질)?\s*새\s*액정/giu, "교체용 새 액정"],
  [/정품\s*신품\s*액정/giu, "교체용 새 액정"],
  [/정품\s*신품\s*패널/giu, "교체용 새 패널"],
  [/고화질\s*정품\s*새\s*액정\s*패널/giu, "고화질 교체용 새 액정 패널"],
  [/정품\s*디스플레이\s*모듈/giu, "교체용 디스플레이 모듈"],
  [/정품\s*규격의\s*새\s*단자/giu, "규격에 맞는 교체용 단자"],
  [/악명\s*높은\s*리퍼\s*비용/giu, "리퍼 비용"],
  [/비싼\s*공식\s*리퍼\s*비용/giu, "공식 리퍼 비용"],
  [/비싼\s*수리\s*비용/giu, "수리 비용"],
  [/과도한\s*공식\s*센터\s*비용/giu, "공식 센터 비용"],
];

function isTargetSlug(slug) {
  return Object.hasOwn(LEGACY_REPAIR_CASE_TITLES, String(slug || ""));
}

function countLocations(segment) {
  return LOCATION_NAMES.reduce(
    (count, location) => count + (segment.includes(location) ? 1 : 0),
    0,
  );
}

function isContactOrBranchFact(segment) {
  return /(주소\s*:|전화\s*:|Tel\.?\s*:|\b02-\d{3,4}-\d{4}\b|지점\s*안내)/iu.test(
    segment,
  );
}

function shouldRemoveSentence(segment) {
  if (
    /네이버\s*\/\s*구글\s*검색\s*최적화|검색했을\s*때도?\s*유입을\s*기대|서두에\s*배치한\s*5대\s*도시|전국\s*안심\s*택배\s*수리\s*접수\s*주요\s*5개\s*도시/iu.test(
      segment,
    )
  ) {
    return true;
  }

  if (isContactOrBranchFact(segment)) {
    return false;
  }

  return (
    countLocations(segment) >= 4 &&
    /(전국|주요\s*도시|인근\s*지역|수도권|택배|방문|유저|문의|접수)/u.test(
      segment,
    )
  );
}

function neutralizeMarketingLanguage(value) {
  return NEUTRAL_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  );
}

function sanitizeSectionNode(slug, value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeSectionNode(slug, entry));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if ((key === "title" || key === "content") && typeof entry === "string") {
        return [key, sanitizeLegacyRepairCaseText(slug, entry)];
      }

      return [key, sanitizeSectionNode(slug, entry)];
    }),
  );
}

export function getLegacyRepairCaseTitle(slug) {
  return LEGACY_REPAIR_CASE_TITLES[String(slug || "")] || "";
}

export function sanitizeLegacyRepairCaseText(slug, value) {
  if (!isTargetSlug(slug) || typeof value !== "string" || !value.trim()) {
    return value;
  }

  const withoutHashtags = value.replace(/(^|[ \t])#[^\s#]+/gmu, "$1");
  const keptText = withoutHashtags
    .split(/(\n+)/u)
    .map((segment) => {
      if (/^\n+$/u.test(segment)) return segment;

      return segment
        .split(/(?<=[.!?])\s+/u)
        .map((sentence) => sentence.trim())
        .filter(Boolean)
        .filter((sentence) => !shouldRemoveSentence(sentence))
        .join(" ");
    })
    .join("");

  return neutralizeMarketingLanguage(keptText)
    .replace(/수리\s*완료\s*및\s*수리\s*완료/gu, "수리 완료")
    .replace(/교체용\s+교체용/gu, "교체용")
    .replace(/점검과\s*수리\s*기술으로/gu, "점검과 수리로")
    .replace(/[ \t]+([,.!?])/gu, "$1")
    .replace(/[ \t]{2,}/gu, " ")
    .replace(/[ \t]+\n/gu, "\n")
    .replace(/\n[ \t]+/gu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

export function sanitizeLegacyRepairCaseSections(slug, value) {
  if (!isTargetSlug(slug) || value == null) {
    return value;
  }

  let sections = value;

  for (let parseCount = 0; parseCount < 3; parseCount += 1) {
    if (typeof sections !== "string") break;

    try {
      sections = JSON.parse(sections);
    } catch {
      return sanitizeLegacyRepairCaseText(slug, sections);
    }
  }

  return sanitizeSectionNode(slug, sections);
}

export function getLegacyRepairCasePresentation(item) {
  if (!isTargetSlug(item?.slug)) {
    return {
      displayTitle: "",
      repairContent: item?.repair_content,
      contentSections: item?.content_sections,
    };
  }

  return {
    displayTitle: getLegacyRepairCaseTitle(item.slug),
    repairContent: sanitizeLegacyRepairCaseText(item.slug, item.repair_content),
    contentSections: sanitizeLegacyRepairCaseSections(
      item.slug,
      item.content_sections,
    ),
  };
}
