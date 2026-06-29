export function generateEnglishSlug(form) {
    const source = [
      form.title,
      form.device,
      form.model,
      form.symptom,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  
    const map = [
      ["맥북", "macbook"],
      ["아이폰", "iphone"],
      ["아이패드", "ipad"],
      ["애플워치", "apple-watch"],
      ["서피스", "surface"],
      ["레노버", "lenovo"],
      ["lg그램", "lg-gram"],
      ["그램", "lg-gram"],
  
      ["전원불량", "power-issue"],
      ["전원불", "power-issue"],
      ["전원안됨", "no-power"],
      ["전원 안켜짐", "no-power"],
      ["충전안됨", "not-charging"],
      ["충전 안됨", "not-charging"],
      ["충전불량", "charging-issue"],
      ["액정파손", "broken-screen"],
      ["액정 파손", "broken-screen"],
      ["액정교체", "screen-replacement"],
      ["액정수리", "screen-repair"],
      ["배터리교체", "battery-replacement"],
      ["배터리", "battery"],
      ["후면유리", "back-glass"],
      ["카메라렌즈", "camera-lens"],
      ["카메라", "camera"],
      ["침수", "water-damage"],
      ["터치불량", "touch-issue"],
      ["수리", "repair"],
      ["교체", "replacement"],
    ];
  
    const words = [];
  
    map.forEach(([ko, en]) => {
      if (source.includes(ko)) words.push(en);
    });
  
    if (words.length === 0) {
      return source
        .replace(/[^\w\s-]/g, " ")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
    }
  
    return [...new Set(words)]
      .join("-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
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