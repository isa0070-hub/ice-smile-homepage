export function createHorizonResult(question) {
    const q = (question || "").trim();
  
    const intent = detectIntent(q);
  
    const base = {
      question: q,
      intent,
      confidence: getConfidence(intent),
      flows: getFlows(intent),
      evidence: getEvidence(intent),
    };
  
    if (intent === "money") {
      return {
        ...base,
        headline: "오늘은 돈보다 흐름을 먼저 보세요.",
        interpretation:
          "이 질문은 단순히 돈을 묻는 것이 아니라, 오늘 어디에 기회가 있는지를 찾는 질문입니다.",
        opportunity:
          "사람들의 관심이 모이는 지점, 당장 불편함을 해결해 줄 수 있는 서비스, 빠른 상담이 필요한 분야에 기회가 있습니다.",
        risk:
          "급하게 따라가는 선택은 피하는 것이 좋습니다. 오늘은 새로 벌기보다 잃지 않는 판단도 중요합니다.",
        actions: [
          "오전에는 오늘 문의가 들어올 가능성이 높은 키워드를 점검하세요.",
          "오후에는 고객이 바로 결정할 수 있는 안내 문구를 정리하세요.",
          "저녁에는 오늘 반응이 있었던 흐름을 기록해 내일과 비교하세요.",
        ],
      };
    }
  
    if (intent === "weather") {
      return {
        ...base,
        headline: "오늘은 이동보다 컨디션을 먼저 보세요.",
        interpretation:
          "이 질문은 날씨 자체보다 오늘의 이동, 컨디션, 외부 일정을 함께 판단하려는 질문입니다.",
        opportunity:
          "가까운 거리, 실내 일정, 짧은 이동 안에서 만족도가 높은 선택이 좋습니다.",
        risk:
          "일정이 길어지거나 이동이 복잡해지면 하루 전체의 집중도와 만족도가 떨어질 수 있습니다.",
        actions: [
          "오전에는 날씨와 이동 시간을 먼저 확인하세요.",
          "점심 전후에는 사람이 몰리는 시간을 피하세요.",
          "오후에는 무리한 이동보다 회복 시간을 남겨두세요.",
        ],
      };
    }
  
    if (intent === "relationship") {
      return {
        ...base,
        headline: "오늘은 사람의 반응을 가볍게 살펴보세요.",
        interpretation:
          "이 질문은 관계의 결과를 바라는 질문이지만, 오늘은 억지로 만들기보다 자연스럽게 연결될 가능성을 보는 날입니다.",
        opportunity:
          "가벼운 대화, 짧은 안부, 부담 없는 만남이 좋은 흐름을 만들 수 있습니다.",
        risk:
          "너무 빠른 기대나 과한 표현은 오히려 거리를 만들 수 있습니다.",
        actions: [
          "오전에는 연락하고 싶은 사람을 한 명만 정하세요.",
          "오후에는 부담 없는 말투로 짧게 대화를 시작하세요.",
          "저녁에는 상대의 반응을 보고 다음 움직임을 정하세요.",
        ],
      };
    }
  
    if (intent === "news") {
      return {
        ...base,
        headline: "오늘은 뉴스보다 변화의 방향을 보세요.",
        interpretation:
          "이 질문은 단순한 기사 확인이 아니라, 오늘 세상이 어느 쪽으로 움직이는지 알고 싶은 질문입니다.",
        opportunity:
          "여러 뉴스가 반복해서 가리키는 공통 주제에 오늘의 힌트가 있습니다.",
        risk:
          "강한 제목이나 단편적인 이슈만 보고 판단하면 흐름을 놓칠 수 있습니다.",
        actions: [
          "오전에는 큰 이슈의 공통 키워드를 확인하세요.",
          "오후에는 내 일과 연결되는 지점을 찾으세요.",
          "저녁에는 오늘의 흐름이 내일도 이어질지 기록하세요.",
        ],
      };
    }
  
    return {
      ...base,
      headline: "오늘은 답보다 관점을 먼저 보세요.",
      interpretation:
        "이 질문은 지금 무엇을 알아야 하는지, 어떤 방향으로 하루를 시작해야 하는지 묻는 질문입니다.",
      opportunity:
        "오늘은 많은 정보를 모으기보다, 내게 필요한 한 가지 관점을 잡는 것이 중요합니다.",
      risk:
        "생각이 너무 넓어지면 오히려 아무것도 결정하지 못할 수 있습니다.",
      actions: [
        "오전에는 가장 궁금한 것을 한 문장으로 정리하세요.",
        "오후에는 그 질문과 연결되는 정보를 3개만 확인하세요.",
        "저녁에는 오늘 얻은 관점을 내일의 질문으로 남기세요.",
      ],
    };
  }
  
  function detectIntent(question) {
    const q = question.replace(/\s+/g, "");
  
    if (
      q.includes("돈") ||
      q.includes("장사") ||
      q.includes("매출") ||
      q.includes("기회") ||
      q.includes("사업")
    ) {
      return "money";
    }
  
    if (
      q.includes("날씨") ||
      q.includes("이동") ||
      q.includes("갈까") ||
      q.includes("어디")
    ) {
      return "weather";
    }
  
    if (
      q.includes("여친") ||
      q.includes("남친") ||
      q.includes("연애") ||
      q.includes("사람")
    ) {
      return "relationship";
    }
  
    if (
      q.includes("뉴스") ||
      q.includes("세상") ||
      q.includes("흐름") ||
      q.includes("변화")
    ) {
      return "news";
    }
  
    return "general";
  }
  
  function getConfidence(intent) {
    const scoreMap = {
      money: 91,
      weather: 88,
      relationship: 82,
      news: 89,
      general: 76,
    };
  
    return scoreMap[intent] || 76;
  }
  
  function getFlows(intent) {
    const flowMap = {
      money: [
        { label: "기회", value: 86 },
        { label: "관심", value: 78 },
        { label: "리스크", value: 42 },
        { label: "실행", value: 74 },
      ],
      weather: [
        { label: "이동", value: 68 },
        { label: "컨디션", value: 82 },
        { label: "일정", value: 71 },
        { label: "변수", value: 55 },
      ],
      relationship: [
        { label: "관계", value: 78 },
        { label: "대화", value: 84 },
        { label: "기대", value: 49 },
        { label: "타이밍", value: 72 },
      ],
      news: [
        { label: "뉴스", value: 88 },
        { label: "변화", value: 81 },
        { label: "관심", value: 76 },
        { label: "리스크", value: 61 },
      ],
      general: [
        { label: "관점", value: 80 },
        { label: "정보", value: 68 },
        { label: "선택", value: 72 },
        { label: "실행", value: 63 },
      ],
    };
  
    return flowMap[intent] || flowMap.general;
  }
  
  function getEvidence(intent) {
    const evidenceMap = {
      money: ["질문 속 기회/수익 의도", "오늘의 관심 흐름", "실행 가능성"],
      weather: ["날씨/이동 의도", "컨디션 변수", "일정 영향"],
      relationship: ["관계 의도", "대화 가능성", "상대 반응 변수"],
      news: ["뉴스/세상 흐름 의도", "공통 이슈", "변화 방향"],
      general: ["질문 의도", "오늘의 선택 기준", "관점 정리"],
    };
  
    return evidenceMap[intent] || evidenceMap.general;
  }