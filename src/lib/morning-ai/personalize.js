/**
 * ===========================================================
 * Good Morning AI
 * personalize.js
 *
 * 역할
 * - 사용자의 질문 의도 분석
 * - 저장된 공통 브리핑과 질문 연결
 * - Horizon 결과 구조 생성
 *
 * 현재 단계
 * - 규칙 기반 개인화
 * - 추후 실제 AI 모델 연결 예정
 * ===========================================================
 */

function normalizeQuestion(question) {
    return String(question || "")
      .trim()
      .replace(/\s+/g, " ");
  }
  
  function detectIntent(question) {
    const text = question.replace(/\s+/g, "");
  
    if (
      text.includes("돈") ||
      text.includes("매출") ||
      text.includes("장사") ||
      text.includes("사업") ||
      text.includes("수익") ||
      text.includes("고객")
    ) {
      return "business";
    }
  
    if (
      text.includes("주식") ||
      text.includes("증시") ||
      text.includes("환율") ||
      text.includes("코스피") ||
      text.includes("나스닥") ||
      text.includes("투자")
    ) {
      return "market";
    }
  
    if (
      text.includes("날씨") ||
      text.includes("비") ||
      text.includes("눈") ||
      text.includes("외출") ||
      text.includes("이동") ||
      text.includes("갈까")
    ) {
      return "weather";
    }
  
    if (
      text.includes("뉴스") ||
      text.includes("세상") ||
      text.includes("정치") ||
      text.includes("경제") ||
      text.includes("이슈")
    ) {
      return "news";
    }
  
    if (
      text.includes("여친") ||
      text.includes("남친") ||
      text.includes("연애") ||
      text.includes("사람") ||
      text.includes("관계")
    ) {
      return "relationship";
    }
  
    return "general";
  }
  
  function getInterpretation(intent) {
    const map = {
      business:
        "이 질문은 오늘의 고객 흐름과 매출 가능성을 확인하고, 어디에 시간과 집중력을 써야 하는지 판단하려는 질문입니다.",
  
      market:
        "이 질문은 시장의 단기 등락보다 환율, 증시, 투자심리가 어떤 방향으로 연결되는지 확인하려는 질문입니다.",
  
      weather:
        "이 질문은 날씨 자체뿐 아니라 이동, 외부 일정, 컨디션에 미칠 영향을 함께 확인하려는 질문입니다.",
  
      news:
        "이 질문은 단순한 뉴스 목록보다 오늘의 판단에 영향을 줄 핵심 변화가 무엇인지 확인하려는 질문입니다.",
  
      relationship:
        "이 질문은 상대의 마음을 단정하기보다 오늘 어떤 태도와 대화가 관계에 도움이 될지 확인하려는 질문입니다.",
  
      general:
        "이 질문은 오늘 무엇을 먼저 보고, 어떤 기준으로 하루의 방향을 정해야 하는지 확인하려는 질문입니다.",
    };
  
    return map[intent] || map.general;
  }
  
  function getActions(intent) {
    const map = {
      business: [
        "오전에는 최근 문의와 고객 반응이 많았던 항목을 먼저 확인하세요.",
        "오후에는 고객이 바로 판단할 수 있도록 가격, 시간, 진행 과정을 명확하게 안내하세요.",
        "저녁에는 문의가 실제 방문이나 접수로 연결된 이유를 기록하세요.",
      ],
  
      market: [
        "환율과 미국 시장의 흐름을 함께 확인하세요.",
        "강한 제목이나 단기 등락만으로 판단하지 마세요.",
        "중요한 결정은 시장의 방향이 확인된 뒤 진행하세요.",
      ],
  
      weather: [
        "외출 전 시간대별 날씨와 이동 시간을 확인하세요.",
        "중요한 외부 일정은 날씨 변수를 고려해 여유 있게 출발하세요.",
        "무리한 이동보다는 하루의 컨디션을 지키는 선택을 하세요.",
      ],
  
      news: [
        "반복해서 등장하는 핵심 키워드를 먼저 확인하세요.",
        "그 뉴스가 내 일과 생활에 어떤 영향을 줄지 연결해 보세요.",
        "확인되지 않은 내용은 사실로 단정하지 마세요.",
      ],
  
      relationship: [
        "상대의 반응을 미리 단정하지 마세요.",
        "부담이 적은 짧은 대화부터 시작하세요.",
        "오늘은 결과보다 대화의 분위기를 확인하세요.",
      ],
  
      general: [
        "오늘 가장 중요한 질문을 한 문장으로 정리하세요.",
        "필요한 정보 세 가지만 확인하세요.",
        "저녁에는 오늘의 선택이 적절했는지 짧게 기록하세요.",
      ],
    };
  
    return map[intent] || map.general;
  }
  
  function makeFlows(brief) {
    const impactTop5 = Array.isArray(brief?.impact_top5)
      ? brief.impact_top5
      : [];
  
    if (impactTop5.length > 0) {
      return impactTop5.slice(0, 5).map((item) => ({
        label: item?.title || "흐름",
        value: Math.min(100, Math.max(0, Number(item?.score) || 0)),
        reason: item?.reason || "",
      }));
    }
  
    return [
      {
        label: "뉴스",
        value: 70,
        reason: "오늘의 주요 이슈를 확인하는 단계입니다.",
      },
      {
        label: "시장",
        value: 65,
        reason: "환율과 증시 흐름을 확인하는 단계입니다.",
      },
      {
        label: "날씨",
        value: 60,
        reason: "이동과 일정 변수를 확인하는 단계입니다.",
      },
      {
        label: "선택",
        value: 68,
        reason: "오늘의 행동 방향을 정리하는 단계입니다.",
      },
    ];
  }
  
  export function personalizeMorningBrief(question, brief) {
    const cleanQuestion = normalizeQuestion(question);
    const intent = detectIntent(cleanQuestion);
  
    const confidence = Math.min(
      100,
      Math.max(0, Number(brief?.ai_confidence_score) || 70)
    );
  
    const headline =
      brief?.ai_one_line ||
      brief?.summary ||
      "오늘은 하나의 정보보다 전체 흐름을 먼저 확인하세요.";
  
    return {
      question: cleanQuestion,
      intent,
  
      headline,
  
      interpretation: getInterpretation(intent),
  
      opportunity:
        brief?.business_point ||
        "여러 흐름이 같은 방향을 가리키는 지점에 오늘의 기회가 있을 수 있습니다.",
  
      risk:
        brief?.uncertainty_note ||
        "아직 확인되지 않은 정보를 사실처럼 단정하지 않는 것이 중요합니다.",
  
      actions: getActions(intent),
  
      confidence,
  
      marketMood:
        brief?.ai_market_mood ||
        "확인 중",
  
      direction:
        brief?.ai_direction ||
        "관망",
  
      flows: makeFlows(brief),
  
      evidence: makeFlows(brief)
        .slice(0, 3)
        .map((item) => item.label),
  
      briefing: {
        date: brief?.note_date || null,
  
        weather:
          brief?.weather_summary ||
          "날씨 데이터가 아직 준비되지 않았습니다.",
  
        news:
          brief?.news_summary ||
          "뉴스 데이터가 아직 준비되지 않았습니다.",
  
        market:
          brief?.market_summary ||
          "시장 데이터가 아직 준비되지 않았습니다.",
  
        technology:
          brief?.tech_summary ||
          "기술 데이터가 아직 준비되지 않았습니다.",
  
        connection:
          brief?.ai_connection_flow ||
          brief?.ai_reasoning_summary ||
          "",
  
        detail:
          brief?.detailed_analysis ||
          "",
      },
  
      sourceStatus: brief ? "database" : "fallback",
    };
  }