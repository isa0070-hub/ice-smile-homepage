export function generateEnglishSlug(form) {
    const text = [
      form.title,
      form.device,
      form.model,
      form.symptom,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .replace(/\s+/g, "");
  
    const dictionary = [
      // ===== Device =====
      ["아이폰", "iphone"],
      ["아이패드프로", "ipad-pro"],
      ["아이패드에어", "ipad-air"],
      ["아이패드미니", "ipad-mini"],
      ["아이패드", "ipad"],
      ["맥북프로", "macbook-pro"],
      ["맥북에어", "macbook-air"],
      ["맥북", "macbook"],
      ["애플워치", "apple-watch"],
      ["서피스프로", "surface-pro"],
      ["서피스랩탑", "surface-laptop"],
      ["서피스북", "surface-book"],
      ["서피스고", "surface-go"],
      ["서피스", "surface"],
      ["레노버", "lenovo"],
      ["lg그램", "lg-gram"],
      ["그램", "lg-gram"],
  
      // ===== Model =====
      ["16프로맥스","16-pro-max"],
      ["16프로","16-pro"],
      ["16플러스","16-plus"],
      ["16","16"],
  
      ["15프로맥스","15-pro-max"],
      ["15프로","15-pro"],
      ["15플러스","15-plus"],
      ["15","15"],
  
      ["14프로맥스","14-pro-max"],
      ["14프로","14-pro"],
      ["14플러스","14-plus"],
      ["14","14"],
  
      ["13프로맥스","13-pro-max"],
      ["13프로","13-pro"],
      ["13미니","13-mini"],
      ["13","13"],
  
      ["12.9","12-9"],
      ["11인치","11"],
      ["10.9","10-9"],
  
      // ===== Repair =====
      ["액정파손","broken-screen"],
      ["액정교체","screen-replacement"],
      ["액정수리","screen-repair"],
  
      ["배터리교체","battery-replacement"],
      ["배터리성능저하","battery-replacement"],
      ["배터리스웰링","battery-replacement"],
  
      ["후면유리","back-glass"],
      ["카메라렌즈","camera-lens"],
  
      ["충전안됨","charging"],
      ["충전불량","charging"],
      ["전원불량","power"],
      ["전원안됨","power"],
      ["부팅안됨","boot"],
      ["침수","water-damage"],
  
      ["메인보드","logic-board"],
      ["보드수리","board-repair"],
  
      ["터치불량","touch"],
      ["발열","overheating"],
      ["팬소음","fan"],
      ["스피커불량","speaker"],
      ["마이크불량","microphone"],
      ["와이파이불량","wifi"],
      ["블루투스불량","bluetooth"],
      ["트루톤","true-tone"],
      ["페이스아이디","face-id"],
    ];
  
    const result = [];
  
    let remain = text;
  
    for (const [ko, en] of dictionary) {
      if (remain.includes(ko)) {
        result.push(en);
  
        remain = remain.replaceAll(ko, "");
      }
    }
  
    // 중복 제거
    const unique = [...new Set(result)];
  
    // repair/replacement 같은 일반 단어 제거
    const filtered = unique.filter((word) => {
      return !(
        word === "repair" ||
        word === "replacement" ||
        word === "screen" ||
        word === "battery"
      );
    });
  
    return filtered
      .join("-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 90);
  }
  
  export function generateSeoKeyword(form) {
    return [form.branch, form.device, form.model, form.symptom]
      .filter(Boolean)
      .join(" ");
  }
  
  export function generateAltText(form, index = null) {
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
  
  function getBaseInfo(form) {
    return {
      branch: form.branch || "수리전문 공식서비스센터",
      device: form.device || "기기",
      model: form.model || "",
      symptom: form.symptom || "수리",
      title: form.title || "",
    };
  }
  
  export function generateGroupAltText(form, index = 0) {
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
  
  export function generateImageDescription(form, index = 0) {
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
  export function generateAltFromDescription(form, description, index = 0) {
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