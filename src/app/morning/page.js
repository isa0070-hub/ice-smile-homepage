"use client";

import { useEffect, useState } from "react";

const movingQuestions = [
  "오늘 돈을 벌고 싶어요",
  "오늘 날씨는 어떨까요",
  "오늘 꼭 알아야 할 뉴스는",
  "아이와 어디를 갈까요",
  "오늘 세상은 어떤 방향인가요",
  "무엇을 준비하면 좋을까요",
  "여친 남친 생기게 해주세요",
  "오늘 조심해야 할 것은",
  "오늘 장사는 어떤 흐름일까요",
  "사람들은 무엇에 관심이 있을까요",
  "오늘 놓치면 안 되는 흐름은",
  "오늘 시간을 어디에 써야 할까요",
  "오늘 나를 움직일 신호는",
  "내 선택은 어디로 가야 할까요",
];

const fixedSideQuestions = [
  { text: "기회는 어디에 있을까요", className: "fixedLeftTop" },
  { text: "오늘 장사는 어떤 흐름일까요", className: "fixedRightTop" },
  { text: "마음을 어디에 두면 좋을까요", className: "fixedLeftBottom" },
  { text: "나에게 필요한 관점은 무엇일까요", className: "fixedRightBottom" },
];

const dataWords = [
  "NEWS",
  "WEATHER",
  "KOSPI",
  "NASDAQ",
  "USD",
  "AI",
  "OIL",
  "GOLD",
  "POLICY",
  "MARKET",
  "RISK",
  "CHANCE",
];

function makeItems() {
  return movingQuestions.map((text, index) => ({
    id: index,
    text,
    x: 10 + Math.random() * 76,
    y: 18 + Math.random() * 62,
    scale: 0.84 + Math.random() * 0.42,
    opacity: 0.2 + Math.random() * 0.46,
    blur: Math.random() > 0.72 ? 2 : 0,
    color: index % 3 === 0 ? "blue" : index % 3 === 1 ? "purple" : "cyan",
  }));
}

function extractKeywords(text) {
  const base = text
    .replace(/[^\w가-힣\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);

  const extra = ["오늘", "흐름", "기회", "위험", "선택"];
  return [...new Set([...base, ...extra])].slice(0, 7);
}
function createHorizonResult(question) {
    const q = question || "";
  
    const isMoney =
      q.includes("돈") ||
      q.includes("장사") ||
      q.includes("매출") ||
      q.includes("기회");
  
    const isWeather =
      q.includes("날씨") ||
      q.includes("이동") ||
      q.includes("갈까");
  
    const isNews =
      q.includes("뉴스") ||
      q.includes("세상") ||
      q.includes("흐름");
  
    const isRelationship =
      q.includes("여친") ||
      q.includes("남친") ||
      q.includes("사람");
  
    if (isMoney) {
      return {
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
  
    return {
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
export default function MorningPage() {
  const [mounted, setMounted] = useState(false);
  const [question, setQuestion] = useState("");
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState("home");
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    setMounted(true);
    setItems(makeItems());

    const timer = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          x: 10 + Math.random() * 76,
          y: 18 + Math.random() * 62,
          scale: 0.84 + Math.random() * 0.42,
          opacity: 0.2 + Math.random() * 0.46,
          blur: Math.random() > 0.72 ? 2 : 0,
        }))
      );
    }, 16000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mode !== "understanding") return;

    const stepTimer = setInterval(() => {
      setStep((v) => Math.min(v + 1, 3));
    }, 1300);

    const resultTimer = setTimeout(() => {
      setMode("result");
    }, 5600);

    return () => {
      clearInterval(stepTimer);
      clearTimeout(resultTimer);
    };
  }, [mode]);

  function submit(e) {
    e.preventDefault();
    if (!question.trim()) return;
    setStep(0);
    setMode("understanding");
  }

  if (!mounted) return null;

  if (mode === "understanding") {
    const keywords = extractKeywords(question);

    return (
      <main className="morningPage">
        <div className="bg" />
        <div className="underGlow" />

        <header className="identity">
          <div className="logoIcon">✦</div>
          <div>
            <strong> Oneul.H </strong>
            <span>AI Hologram</span>
          </div>
        </header>

        <div className="horizon">Today’s Horizon</div>

        <section className="dataField">
          {dataWords.map((word, index) => (
            <span key={word} className={`dataWord d${index + 1}`}>
              {word}
            </span>
          ))}
        </section>

        <section className="understandingBox">
          <p className="userQuestion">“{question}”</p>

          <div className="keywordCloud">
            {keywords.map((word, index) => (
              <span key={`${word}-${index}`} className={`keyword k${index + 1}`}>
                {word}
              </span>
            ))}
          </div>

          <p className="thinkingText">
            {
              [
                "최고의 질문에 답을 찾고 있습니다.",
                "질문을 확장 분석하고 있습니다.",
                "오늘에 영감을 주는 데이터를 연결하고 있습니다.",
                "당신만의 Horizon을 만드는 중입니다.",
              ][step]
            }
          </p>

          <div className="horizonLoadingBar">
            <span />
          </div>
        </section>

        <PageStyle />
      </main>
    );
  }

  if (mode === "result") {
  const horizonResult = createHorizonResult(question);
    return (
      <main className="resultPage">
        <header className="identity">
          <div className="logoIcon">✦</div>
          <div>
            <strong> Morning Brain </strong>
            <span>AI Hologram</span>
          </div>
        </header>

        <section className="horizonHero">
  <div className="heroGlow" />

  <div className="confidenceBadge">
    <span>Confidence</span>
    <strong>94%</strong>
  </div>

  <p className="resultLabel">TODAY’S HORIZON</p>

  <h1 className="horizonBigTitle">
    <span>오늘은</span>
    <span>흐름을 먼저 보세요.</span>
  </h1>

  <div className="heroQuestionText">“{question}”</div>
  <div className="heroSubMessage">
  AI가 오늘의 흐름을 당신의 질문 기준으로 다시 정리했습니다.
</div>

<form className="resultSearchBar" onSubmit={submit}>
  <div className="searchBrand">Oneul.H</div>

  <input
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    placeholder="?"
    aria-label="질문 입력"
  />

  <button type="submit" className="aiButton">
    <span>✦</span>
    AI
  </button>
</form>
</section>
<form className="resultSearchBar" onSubmit={submit}>
  <div className="searchBrand">Oneul.H</div>

  <input
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    placeholder="?"
    aria-label="질문 입력"
  />

  <button type="submit" className="aiButton">
    <span>✦</span>
    AI
  </button>
</form>
        <section className="horizonLayout">
          <div className="horizonMain">
            <div className="resultCard mainInsight">
              <p>오늘의 한 줄</p>
              <h2>{horizonResult.headline}</h2>
              <span>
              <p>{horizonResult.interpretation}</p>
              </span>
            </div>

            <div className="resultCard interpretation">
              <p>질문 해석</p>
              <h3>이 질문은 오늘의 방향을 정하려는 질문입니다.</h3>
              <span>
                단순한 정보 검색이 아니라, 지금 무엇을 보고 어떤 판단을 해야 하는지에 가까운 질문으로 해석됩니다.
              </span>
            </div>

            <div className="resultCard newsBrief">
              <p>간밤 브리핑</p>
              <ul>
                <li>사회 · 경제 · 정치 흐름에서 오늘 영향을 줄 수 있는 변화</li>
                <li>사람들의 관심이 이동하는 지점</li>
                <li>오늘 하루 판단에 참고할 만한 핵심 이벤트</li>
              </ul>
            </div>

            <div className="resultCard sourceLinks">
              <p>원문 확인</p>
              <div className="linkRows">
                <span>주요 뉴스 원문 1</span>
                <span>경제 흐름 원문 2</span>
                <span>사회 이슈 원문 3</span>
              </div>
            </div>
          </div>

          <aside className="horizonSide">
            <div className="resultCard small">
            {horizonResult.opportunity}
              <span>움직임이 생기는 쪽을 먼저 보고, 급한 결정보다는 흐름을 확인합니다.</span>
            </div>

            <div className="resultCard small">
            {horizonResult.risk}
              <span>뉴스 제목만 보고 판단하지 말고, 원인과 다음 흐름을 함께 봅니다.</span>
            </div>

            <div className="resultCard small">
              <p>날씨 · 이동</p>
              <span>외부 일정, 이동, 고객 방문, 컨디션에 영향을 주는 변수를 확인합니다.</span>
            </div>

            <div className="resultCard small">
              <p>오늘의 선택</p>
              <span>지금 할 일, 지켜볼 일, 미룰 일을 구분하는 것이 좋습니다.</span>
            </div>
          </aside>
        </section>

        <PageStyle />
      </main>
    );
  }

  return (
    <main className="morningPage">
      <div className="bg" />
      <div className="orb orbA" />
      <div className="orb orbB" />
      <div className="orb orbC" />

      <header className="identity">
        <div className="logoIcon">✦</div>
        <div>
          <strong> Oneul.H </strong>
          <span>AI Hologram</span>
        </div>
      </header>

      <div className="horizon">Today’s Horizon</div>

      <h1 className="fixedQuestion">상상만하던 당신의 세상을 열어보세요</h1>

      {fixedSideQuestions.map((item) => (
        <button
          key={item.text}
          type="button"
          className={`fixedSideQuestion ${item.className}`}
          onClick={() => setQuestion(item.text)}
        >
          {item.text}
        </button>
      ))}

      <section className="questionSpace">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`floatingQuestion ${item.color}`}
            onClick={() => setQuestion(item.text)}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              opacity: item.opacity,
              filter: `blur(${item.blur}px)`,
              transform: `translate(-50%, -50%) scale(${item.scale})`,
            }}
          >
            {item.text}
          </button>
        ))}
      </section>

      <form className="glassWindow" onSubmit={submit}>
        <div className="searchBrand">Oneul.H</div>

        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="?"
          aria-label="질문 입력"
        />

        <button type="submit" className="aiButton">
          <span>✦</span>
          AI
        </button>
      </form>

      <PageStyle />
    </main>
  );
}

function PageStyle() {
  return (
    <style jsx global>{`
      html,
      body {
        margin: 0;
        overflow: hidden;
      }

      .morningPage,
      .resultPage {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        overflow: hidden;
        background: #f7fbff;
        font-family: Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
        isolation: isolate;
      }

      .bg {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 50% 38%, rgba(255,255,255,1) 0%, rgba(235,247,255,.96) 34%, rgba(232,235,255,.95) 66%, rgba(250,252,255,1) 100%);
      }

      .bg::before {
        content: "";
        position: absolute;
        inset: -20%;
        background:
          radial-gradient(circle at 14% 25%, rgba(56,189,248,.3), transparent 31%),
          radial-gradient(circle at 86% 23%, rgba(139,92,246,.26), transparent 32%),
          radial-gradient(circle at 52% 84%, rgba(96,165,250,.24), transparent 36%);
        filter: blur(62px);
        animation: bgMove 20s ease-in-out infinite alternate;
      }

      .bg::after {
        content: "";
        position: absolute;
        inset: 0;
        background-image:
          radial-gradient(circle, rgba(37,99,235,.13) 1px, transparent 1.5px),
          radial-gradient(circle, rgba(124,58,237,.08) 1px, transparent 1.5px);
        background-size: 120px 120px, 210px 210px;
        opacity: .28;
        animation: particleMove 54s linear infinite;
      }

      .orb {
        position: absolute;
        border-radius: 999px;
        filter: blur(18px);
        opacity: .58;
        pointer-events: none;
        z-index: 1;
      }

      .orbA {
        width: 170px;
        height: 170px;
        left: 5%;
        bottom: 8%;
        background: radial-gradient(circle, rgba(56,189,248,.85), rgba(167,139,250,.55), transparent 72%);
        animation: orbMoveA 18s ease-in-out infinite;
      }

      .orbB {
        width: 120px;
        height: 120px;
        right: 8%;
        top: 35%;
        background: radial-gradient(circle, rgba(196,181,253,.9), rgba(147,197,253,.55), transparent 72%);
        animation: orbMoveB 20s ease-in-out infinite;
      }

      .orbC {
        width: 90px;
        height: 90px;
        left: 48%;
        bottom: 18%;
        background: radial-gradient(circle, rgba(125,211,252,.72), rgba(129,140,248,.42), transparent 72%);
        animation: orbMoveC 16s ease-in-out infinite;
      }

      .identity {
        position: absolute;
        left: 54px;
        top: 42px;
        z-index: 20;
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .logoIcon {
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        color: white;
        background: linear-gradient(135deg, #2563eb, #8b5cf6);
        box-shadow: 0 14px 34px rgba(79,70,229,.22);
        font-size: 18px;
      }

      .identity strong {
        display: block;
        color: rgba(15,23,42,.88);
        font-size: 27px;
        font-weight: 950;
        letter-spacing: -0.045em;
      }

      .identity span {
        display: block;
        margin-top: 4px;
        color: rgba(37,99,235,.6);
        font-size: 15px;
        font-weight: 760;
      }

      .horizon {
        position: absolute;
        right: 56px;
        top: 51px;
        z-index: 20;
        color: rgba(79,70,229,.5);
        font-size: 14px;
        font-weight: 900;
        letter-spacing: .16em;
        text-transform: uppercase;
      }

      .fixedQuestion {
        position: absolute;
        left: 50%;
        top: 9%;
        z-index: 8;
        transform: translateX(-50%);
        margin: 0;
        white-space: nowrap;
        font-size: clamp(32px, 3.2vw, 58px);
        font-weight: 900;
        letter-spacing: -0.07em;
        color: rgba(37,99,235,.78);
        text-shadow:
          0 0 22px rgba(96,165,250,.28),
          0 16px 42px rgba(79,70,229,.12);
        animation: fixedBreath 5.8s ease-in-out infinite;
        pointer-events: none;
      }

      .fixedSideQuestion {
        position: absolute;
        z-index: 9;
        border: 0;
        background: transparent;
        color: rgba(37,99,235,.62);
        font-size: clamp(21px, 1.65vw, 32px);
        font-weight: 820;
        letter-spacing: -0.065em;
        line-height: 1.35;
        cursor: pointer;
        text-align: left;
        text-shadow: 0 0 24px rgba(96,165,250,.3);
        animation: sideBreath 6.8s ease-in-out infinite;
      }

      .fixedLeftTop {
        left: 7%;
        top: 25%;
        max-width: 260px;
      }

      .fixedRightTop {
        right: 7%;
        top: 24%;
        max-width: 280px;
        text-align: right;
        animation-delay: 1.1s;
      }

      .fixedLeftBottom {
        left: 7%;
        bottom: 14%;
        max-width: 300px;
        animation-delay: 2.2s;
      }

      .fixedRightBottom {
        right: 7%;
        bottom: 14%;
        max-width: 330px;
        text-align: right;
        animation-delay: 3.3s;
      }

      .questionSpace {
        position: absolute;
        inset: 0;
        z-index: 3;
      }

      .floatingQuestion {
        position: absolute;
        border: 0;
        background: transparent;
        padding: 0;
        font-size: clamp(20px, 1.55vw, 31px);
        font-weight: 760;
        letter-spacing: -0.065em;
        white-space: nowrap;
        cursor: pointer;
        text-shadow: 0 0 24px rgba(96,165,250,.28);
        transition:
          left 15.5s linear,
          top 15.5s linear,
          opacity 15.5s ease-in-out,
          filter 15.5s ease-in-out,
          transform 15.5s linear;
        will-change: left, top, transform, opacity, filter;
      }

      .floatingQuestion.blue {
        color: rgba(37,99,235,.68);
      }

      .floatingQuestion.purple {
        color: rgba(124,58,237,.6);
      }

      .floatingQuestion.cyan {
        color: rgba(14,116,144,.56);
      }

      .floatingQuestion:hover,
      .fixedSideQuestion:hover {
        opacity: 1 !important;
        filter: blur(0px) !important;
        color: rgba(79,70,229,.96);
      }

      .glassWindow {
        position: absolute;
        left: 50%;
        top: 52%;
        transform: translate(-50%, -50%);
        z-index: 10;
        width: min(820px, 74vw);
        height: 62px;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 0 14px 0 18px;
        box-sizing: border-box;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(255,255,255,.24), rgba(255,255,255,.1));
        border: 1px solid rgba(255,255,255,.62);
        backdrop-filter: blur(8px) saturate(165%);
        -webkit-backdrop-filter: blur(8px) saturate(165%);
        box-shadow:
          0 20px 70px rgba(37,99,235,.09),
          0 0 0 1px rgba(147,197,253,.16),
          inset 0 1px 1px rgba(255,255,255,.72),
          inset 0 -1px 1px rgba(37,99,235,.1);
        overflow: hidden;
      }

      .glassWindow::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(105deg, transparent 10%, rgba(255,255,255,.3) 45%, transparent 72%);
        transform: translateX(-120%);
        animation: glassLight 7s linear infinite;
        pointer-events: none;
        z-index: 0;
      }

      .glassWindow::after {
        content: "";
        position: absolute;
        left: 8%;
        right: 8%;
        bottom: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(37,99,235,.25), transparent);
        pointer-events: none;
        z-index: 0;
      }

      .searchBrand,
      .glassWindow input,
      .aiButton {
        position: relative;
        z-index: 2;
      }

      .searchBrand {
        min-width: 92px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: rgba(255,255,255,.22);
        color: rgba(37,99,235,.66);
        font-size: 13px;
        font-weight: 950;
        letter-spacing: -0.02em;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.28);
      }

      .glassWindow input {
        flex: 1;
        height: 100%;
        border: 0 !important;
        outline: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        appearance: none;
        -webkit-appearance: none;
        color: rgba(15,23,42,.9);
        font-size: clamp(20px, 1.8vw, 29px);
        font-weight: 540;
        letter-spacing: -0.055em;
        text-align: center;
      }

      .glassWindow input::placeholder {
        color: rgba(71,85,105,.34);
      }

      .aiButton {
        height: 40px;
        padding: 0 19px;
        border: 0;
        border-radius: 999px;
        background: rgba(255,255,255,.24);
        color: rgba(30,41,59,.74);
        font-size: 16px;
        font-weight: 950;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 7px;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.32);
      }

      .aiButton span {
        color: rgba(79,70,229,.72);
      }

      .underGlow {
        position: absolute;
        inset: -20%;
        background:
          radial-gradient(circle at 50% 45%, rgba(255,255,255,.92), transparent 26%),
          radial-gradient(circle at 50% 55%, rgba(96,165,250,.22), transparent 38%);
        filter: blur(38px);
        animation: bgMove 10s ease-in-out infinite alternate;
      }

      .dataField {
        position: absolute;
        inset: 0;
        z-index: 2;
      }

      .dataWord {
        position: absolute;
        color: rgba(37,99,235,.18);
        font-size: clamp(18px, 1.5vw, 28px);
        font-weight: 900;
        letter-spacing: .14em;
        animation: dataFloat 12s ease-in-out infinite;
      }

      .d1 { left: 12%; top: 25%; }
      .d2 { left: 70%; top: 20%; animation-delay: .7s; }
      .d3 { left: 18%; bottom: 22%; animation-delay: 1.4s; }
      .d4 { right: 14%; bottom: 28%; animation-delay: 2.1s; }
      .d5 { left: 43%; top: 19%; animation-delay: 2.8s; }
      .d6 { right: 30%; top: 40%; animation-delay: 3.5s; }
      .d7 { left: 32%; bottom: 13%; animation-delay: 4.2s; }
      .d8 { right: 8%; top: 58%; animation-delay: 4.9s; }
      .d9 { left: 8%; top: 56%; animation-delay: 5.6s; }
      .d10 { right: 40%; bottom: 19%; animation-delay: 6.3s; }
      .d11 { left: 50%; top: 70%; animation-delay: 7s; }
      .d12 { right: 12%; top: 34%; animation-delay: 7.7s; }

      .understandingBox {
        position: relative;
        z-index: 6;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .userQuestion {
        font-size: clamp(30px, 3vw, 52px);
        color: rgba(15,23,42,.82);
        font-weight: 850;
        letter-spacing: -0.07em;
        margin: 0 0 46px;
      }

      .keywordCloud {
        position: relative;
        width: min(620px, 80vw);
        height: 230px;
      }

      .keyword {
        position: absolute;
        color: rgba(37,99,235,.72);
        font-weight: 900;
        font-size: clamp(24px, 2.2vw, 42px);
        letter-spacing: -0.07em;
        animation: keywordPulse 2.4s ease-in-out infinite;
      }

      .k1 { left: 42%; top: 0%; }
      .k2 { left: 8%; top: 32%; animation-delay: .2s; }
      .k3 { right: 8%; top: 34%; animation-delay: .4s; }
      .k4 { left: 36%; top: 58%; animation-delay: .6s; }
      .k5 { left: 18%; top: 76%; animation-delay: .8s; }
      .k6 { right: 18%; top: 76%; animation-delay: 1s; }
      .k7 { left: 46%; top: 37%; animation-delay: 1.2s; }

      .thinkingText {
        margin-top: 22px;
        font-size: 26px;
        color: rgba(30,64,175,.82);
        font-weight: 900;
        letter-spacing: -0.04em;
        text-shadow: 0 0 18px rgba(96,165,250,.22);
      }

      .horizonLoadingBar {
        width: min(420px, 62vw);
        height: 5px;
        margin-top: 20px;
        border-radius: 999px;
        background: rgba(37,99,235,.12);
        overflow: hidden;
      }

      .horizonLoadingBar span {
        display: block;
        width: 42%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(
          90deg,
          rgba(96,165,250,.15),
          rgba(37,99,235,.75),
          rgba(139,92,246,.65)
        );
        box-shadow: 0 0 22px rgba(96,165,250,.55);
        animation: horizonLoading 1.45s ease-in-out infinite;
      }

      .resultPage {
        overflow-y: auto;
        background:
          radial-gradient(circle at 50% 0%, rgba(219,234,254,.9), transparent 34%),
          linear-gradient(180deg, #f8fbff, #edf5ff);
        color: #172033;
      }

      .resultHero {
        position: relative;
        z-index: 5;
        max-width: 1160px;
        margin: 132px auto 0;
        padding: 0 40px;
      }

      .resultHero p {
        color: rgba(79,70,229,.58);
        font-size: 14px;
        font-weight: 950;
        letter-spacing: .18em;
        text-transform: uppercase;
      }

      .resultHero h1 {
        margin: 10px 0;
        font-size: clamp(44px, 5vw, 78px);
        letter-spacing: -0.08em;
        color: rgba(15,23,42,.9);
      }

      .resultHero span {
        color: rgba(37,99,235,.68);
        font-size: 24px;
        font-weight: 700;
      }

      .horizonLayout {
        position: relative;
        z-index: 5;
        max-width: 1160px;
        margin: 34px auto 80px;
        padding: 0 40px;
        display: grid;
        grid-template-columns: 1.65fr .9fr;
        gap: 20px;
      }

      .horizonMain,
      .horizonSide {
        display: grid;
        gap: 18px;
      }

      .horizonSide {
        align-content: start;
      }

      .resultCard {
        padding: 26px;
        border-radius: 28px;
        background: rgba(255,255,255,.46);
        border: 1px solid rgba(255,255,255,.68);
        backdrop-filter: blur(16px);
        box-shadow: 0 20px 70px rgba(37,99,235,.08);
      }

      .mainInsight {
        padding: 32px;
        min-height: 170px;
      }

      .resultCard p {
        margin: 0 0 12px;
        color: rgba(37,99,235,.72);
        font-weight: 950;
      }

      .resultCard h2 {
        margin: 0 0 12px;
        font-size: clamp(30px, 3vw, 46px);
        letter-spacing: -0.07em;
      }

      .resultCard h3 {
        margin: 0 0 12px;
        font-size: 27px;
        letter-spacing: -0.06em;
      }

      .resultCard span,
      .resultCard li {
        color: rgba(51,65,85,.72);
        line-height: 1.7;
      }

.heroQuestion {
  position: absolute;
  left: 56px;
  bottom: 58px;
  z-index: 8;
  max-width: 420px;
}

.heroQuestion span {
  display: block;
  color: rgba(79,70,229,.5);
  font-size: 12px;
  font-weight: 950;
  letter-spacing: .16em;
  text-transform: uppercase;
}

.heroQuestion p {
  margin: 9px 0 0;
  color: rgba(15,23,42,.76);
  font-size: clamp(22px, 2vw, 34px);
  font-weight: 850;
  letter-spacing: -0.07em;
}

.scrollCue {
  position: absolute;
  left: 50%;
  bottom: 42px;
  transform: translateX(-50%);
  z-index: 8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  color: rgba(37,99,235,.48);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .14em;
  text-transform: uppercase;
  animation: scrollPulse 2s ease-in-out infinite;
}

.scrollCue b {
  font-size: 22px;
  line-height: 1;
}

.resultDataAura {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.resultDataAura i {
  position: absolute;
  width: 180px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(37,99,235,.22), transparent);
  animation: dataLineMove 11s linear infinite;
}

.resultDataAura i:nth-child(1) { left: 8%; top: 24%; animation-delay: 0s; }
.resultDataAura i:nth-child(2) { left: 64%; top: 32%; animation-delay: 1.6s; }
.resultDataAura i:nth-child(3) { left: 22%; top: 72%; animation-delay: 3.1s; }
.resultDataAura i:nth-child(4) { left: 70%; top: 68%; animation-delay: 4.7s; }
.resultDataAura i:nth-child(5) { left: 44%; top: 18%; animation-delay: 6.2s; }
.resultDataAura i:nth-child(6) { left: 38%; top: 84%; animation-delay: 7.8s; }

@keyframes titleBreath {
  0%, 100% {
    opacity: .82;
    filter: blur(.4px);
    transform: translateY(0) scale(.99);
  }
  50% {
    opacity: 1;
    filter: blur(0);
    transform: translateY(-6px) scale(1.015);
  }
}

@keyframes scrollPulse {
  0%, 100% {
    opacity: .35;
    transform: translateX(-50%) translateY(0);
  }
  50% {
    opacity: .9;
    transform: translateX(-50%) translateY(8px);
  }
}

@keyframes dataLineMove {
  0% {
    opacity: 0;
    transform: translateX(-80px) scaleX(.4);
  }
  25% {
    opacity: .75;
  }
  100% {
    opacity: 0;
    transform: translateX(180px) scaleX(1.4);
  }
}
      .resultCard ul {
        margin: 0;
        padding-left: 18px;
      }

      .linkRows {
        display: grid;
        gap: 10px;
      }

      .linkRows span {
        padding: 13px 15px;
        border-radius: 16px;
        background: rgba(255,255,255,.38);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.38);
      }

      .resultCard.small {
        min-height: 112px;
      }

      @keyframes fixedBreath {
        0%, 100% {
          opacity: .5;
          filter: blur(1.3px);
          transform: translateX(-50%) scale(.96);
        }
        48% {
          opacity: .95;
          filter: blur(0px);
          transform: translateX(-50%) scale(1.03);
        }
      }

      @keyframes sideBreath {
        0%, 100% {
          opacity: .42;
          filter: blur(1.4px);
          transform: scale(.96);
        }
        50% {
          opacity: .92;
          filter: blur(0px);
          transform: scale(1.035);
        }
      }

      @keyframes keywordPulse {
        0%, 100% {
          opacity: .32;
          filter: blur(1.5px);
          transform: scale(.92);
        }
        50% {
          opacity: .95;
          filter: blur(0);
          transform: scale(1.05);
        }
      }

      @keyframes dataFloat {
        0%, 100% {
          opacity: .1;
          transform: translateY(0);
        }
        50% {
          opacity: .28;
          transform: translateY(-24px);
        }
      }

      @keyframes horizonLoading {
        0% {
          transform: translateX(-115%);
        }
        100% {
          transform: translateX(245%);
        }
      }

      @keyframes glassLight {
        0% { transform: translateX(-120%); }
        100% { transform: translateX(120%); }
      }

      @keyframes bgMove {
        from { transform: scale(1) translate(-1%, -1%); }
        to { transform: scale(1.08) translate(1%, 1%); }
      }

      @keyframes particleMove {
        from { background-position: 0 0, 0 0; }
        to { background-position: 240px 240px, -210px 310px; }
      }

      @keyframes orbMoveA {
        0%, 100% { transform: translate(0,0) scale(1); }
        50% { transform: translate(66px,-44px) scale(1.08); }
      }

      @keyframes orbMoveB {
        0%, 100% { transform: translate(0,0) scale(1); }
        50% { transform: translate(-74px,52px) scale(1.12); }
      }
.horizonHero {
  position: relative;
  min-height: 100vh;
  max-width: none;
  margin: 0;
  padding: 0 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.heroGlow {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 760px;
  height: 420px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background:
    radial-gradient(circle, rgba(96,165,250,.34), transparent 62%),
    radial-gradient(circle at 68% 42%, rgba(139,92,246,.22), transparent 58%);
  filter: blur(48px);
  opacity: .9;
  animation: heroGlowMove 10s ease-in-out infinite alternate;
}

.resultLabel {
  position: relative;
  z-index: 2;
  margin: 0 0 30px;
  color: rgba(79,70,229,.62);
  font-size: 16px;
  font-weight: 950;
  letter-spacing: .26em;
}

.horizonBigTitle {
  position: relative;
  z-index: 2;
  margin: 0;
  text-align: center;
  color: rgba(15,23,42,.92);
  font-size: clamp(72px, 9vw, 148px);
  line-height: .94;
  font-weight: 950;
  letter-spacing: -0.1em;
}

.horizonBigTitle span {
  display: block;
}

.horizonBigTitle span:nth-child(2) {
  color: rgba(37,99,235,.86);
}

.heroQuestionText {
  position: relative;
  z-index: 2;
  margin-top: 36px;
  max-width: 760px;
  color: rgba(51,65,85,.72);
  font-size: clamp(24px, 2vw, 36px);
  font-weight: 850;
  letter-spacing: -0.07em;
  text-align: center;
}

.confidenceBadge {
  position: absolute;
  right: 56px;
  top: 132px;
  z-index: 3;
  padding: 17px 21px;
  border-radius: 24px;
  background: rgba(255,255,255,.42);
  border: 1px solid rgba(255,255,255,.68);
  backdrop-filter: blur(18px);
  box-shadow: 0 20px 60px rgba(37,99,235,.08);
}

.confidenceBadge span {
  display: block;
  color: rgba(79,70,229,.58);
  font-size: 12px;
  font-weight: 950;
  letter-spacing: .15em;
  text-transform: uppercase;
}

.confidenceBadge strong {
  display: block;
  margin-top: 5px;
  color: rgba(15,23,42,.86);
  font-size: 34px;
  font-weight: 950;
}

@keyframes heroGlowMove {
  0% {
    transform: translate(-52%, -50%) scale(.96);
    opacity: .65;
  }
  100% {
    transform: translate(-48%, -52%) scale(1.08);
    opacity: .95;
  }
}
      @keyframes orbMoveC {
        0%, 100% { transform: translate(0,0) scale(1); }
        50% { transform: translate(34px,-58px) scale(1.12); }
      }
       .horizonHero {
  position: relative;
  min-height: 100vh;
  margin: 0;
  padding: 0 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.horizonHero .resultLabel {
  margin: 0 0 34px;
  color: rgba(79,70,229,.62);
  font-size: 16px;
  font-weight: 950;
  letter-spacing: .26em;
}

.horizonBigTitle {
  margin: 0;
  text-align: center;
  font-size: clamp(96px, 11vw, 180px);
  line-height: .9;
  font-weight: 950;
  letter-spacing: -0.11em;
  color: rgba(15,23,42,.92);
}

.horizonBigTitle span {
  display: block;
}

.horizonBigTitle span:nth-child(2) {
  color: rgba(37,99,235,.86);
}

.heroQuestionText {
  margin-top: 38px;
  color: rgba(51,65,85,.74);
  font-size: clamp(28px, 2.4vw, 44px);
  font-weight: 900;
  letter-spacing: -0.075em;
  text-align: center;
}
  .resultSearchBar {
  position: relative;
  z-index: 4;
  width: min(760px, 68vw);
  height: 58px;
  margin-top: 42px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 14px 0 18px;
  box-sizing: border-box;
  border-radius: 999px;
  background: rgba(255,255,255,.28);
  border: 1px solid rgba(255,255,255,.68);
  backdrop-filter: blur(14px) saturate(170%);
  -webkit-backdrop-filter: blur(14px) saturate(170%);
  box-shadow:
    0 22px 70px rgba(37,99,235,.08),
    inset 0 1px 1px rgba(255,255,255,.72);
}

.resultSearchBar input {
  flex: 1;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(15,23,42,.88);
  font-size: 25px;
  font-weight: 650;
  letter-spacing: -0.055em;
  text-align: center;
}

.resultSearchBar input::placeholder {
  color: rgba(71,85,105,.35);
}

.horizonBigTitle {
  gap: 18px;
}

.horizonBigTitle span:nth-child(2) {
  color: rgba(59,130,246,.78);
}

.heroQuestionText {
  animation: softBreathText 5.8s ease-in-out infinite;
}

.heroGlow {
  animation: heroGlowMove 18s ease-in-out infinite alternate;
}

@keyframes softBreathText {
  0%, 100% {
    opacity: .62;
    filter: blur(.3px);
  }
  50% {
    opacity: 1;
    filter: blur(0);
  }
}
  /* 결과 화면 고급화 최종 보정 */
.horizonHero {
  overflow: hidden;
}

.horizonHero::before {
  content: "";
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(circle at 35% 42%, rgba(96,165,250,.20), transparent 34%),
    radial-gradient(circle at 68% 48%, rgba(139,92,246,.18), transparent 36%),
    radial-gradient(circle at 50% 72%, rgba(56,189,248,.12), transparent 34%);
  filter: blur(52px);
  animation: heroAmbientMove 26s ease-in-out infinite alternate;
  z-index: 0;
}

.horizonHero::after {
  content: "";
  position: absolute;
  width: 620px;
  height: 620px;
  left: 50%;
  top: 52%;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  border: 1px solid rgba(96,165,250,.12);
  box-shadow:
    0 0 0 90px rgba(96,165,250,.035),
    0 0 0 180px rgba(139,92,246,.025);
  animation: heroRingBreath 18s ease-in-out infinite;
  z-index: 1;
  pointer-events: none;
}

.horizonBigTitle {
  position: relative;
  z-index: 3;
  gap: 22px;
}

.horizonBigTitle span:first-child {
  color: rgba(30,41,59,.92);
  text-shadow: 0 18px 60px rgba(30,64,175,.12);
}

.horizonBigTitle span:nth-child(2) {
  background: linear-gradient(
    90deg,
    rgba(37,99,235,.78),
    rgba(96,165,250,.92),
    rgba(124,58,237,.72)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent !important;
  text-shadow: 0 22px 80px rgba(37,99,235,.18);
}

.heroQuestionText {
  margin-top: 42px;
  padding: 13px 24px;
  border-radius: 999px;
  background: rgba(255,255,255,.34);
  border: 1px solid rgba(255,255,255,.62);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 18px 54px rgba(37,99,235,.07);
  animation: softBreathText 6s ease-in-out infinite;
}

.heroSubMessage {
  position: relative;
  z-index: 3;
  margin-top: 22px;
  color: rgba(71,85,105,.62);
  font-size: 20px;
  font-weight: 750;
  letter-spacing: -0.045em;
  text-align: center;
}

.resultSearchBar {
  position: relative;
  z-index: 4;
  width: min(720px, 66vw);
  height: 56px;
  margin-top: 34px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 14px 0 18px;
  box-sizing: border-box;
  border-radius: 999px;
  background: rgba(255,255,255,.30);
  border: 1px solid rgba(255,255,255,.68);
  backdrop-filter: blur(16px) saturate(170%);
  -webkit-backdrop-filter: blur(16px) saturate(170%);
  box-shadow:
    0 22px 70px rgba(37,99,235,.08),
    inset 0 1px 1px rgba(255,255,255,.72);
}

.resultSearchBar input {
  flex: 1;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(15,23,42,.88);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.055em;
  text-align: center;
}

.resultSearchBar input::placeholder {
  color: rgba(71,85,105,.34);
}

.confidenceBadge {
  transform: scale(.92);
  opacity: .86;
}

@keyframes heroAmbientMove {
  0% {
    transform: translate(-2%, -1%) scale(1);
  }
  100% {
    transform: translate(2%, 2%) scale(1.08);
  }
}

@keyframes heroRingBreath {
  0%, 100% {
    opacity: .42;
    transform: translate(-50%, -50%) scale(.94);
  }
  50% {
    opacity: .82;
    transform: translate(-50%, -50%) scale(1.04);
  }
}

@keyframes softBreathText {
  0%, 100% {
    opacity: .72;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-3px);
  }
}
    `}</style>
  );
}

