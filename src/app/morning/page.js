"use client";

import { useEffect, useRef, useState } from "react";
import { createHorizonResult } from "./lib/horizonEngine";

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

const thinkingMessages = [
  "최고의 질문에 답을 찾고 있습니다.",
  "질문을 확장 분석하고 있습니다.",
  "오늘에 영감을 주는 데이터를 연결하고 있습니다.",
  "당신만의 Horizon을 만드는 중입니다.",
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
  const base = String(text || "")
    .replace(/[^\w가-힣\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);

  const extra = ["오늘", "흐름", "기회", "위험", "선택"];
  return [...new Set([...base, ...extra])].slice(0, 7);
}

function clampScore(value, fallback = 70) {
  const score = Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function normalizeTextArray(value, fallback = []) {
  if (!Array.isArray(value)) return fallback;

  const cleaned = value
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : fallback;
}

function normalizeFlows(value, fallback = []) {
  if (!Array.isArray(value)) return fallback;

  const cleaned = value
    .map((item) => ({
      label: String(item?.label || "흐름").trim(),
      value: clampScore(item?.value, 0),
      reason: String(item?.reason || "").trim(),
    }))
    .filter((item) => item.label);

  return cleaned.length > 0 ? cleaned : fallback;
}

function normalizeMorningResult(apiResult, question) {
  const fallback = createHorizonResult(question);
  const fallbackFlows = normalizeFlows(fallback?.flows, []);
  const briefing = apiResult?.briefing || {};

  return {
    question,
    intent: apiResult?.intent || fallback?.intent || "general",
    headline:
      apiResult?.headline ||
      fallback?.headline ||
      "오늘은 하나의 정보보다 전체 흐름을 먼저 확인하세요.",
    interpretation:
      apiResult?.interpretation ||
      fallback?.interpretation ||
      "오늘 무엇을 먼저 보고 판단할지 정리하는 질문입니다.",
    opportunity:
      apiResult?.opportunity ||
      fallback?.opportunity ||
      "여러 흐름이 같은 방향을 가리키는 지점에 기회가 있습니다.",
    risk:
      apiResult?.risk ||
      fallback?.risk ||
      "확인되지 않은 내용을 사실처럼 단정하지 않는 것이 중요합니다.",
    actions: normalizeTextArray(apiResult?.actions, fallback?.actions || []),
    confidence: clampScore(apiResult?.confidence, fallback?.confidence || 70),
    marketMood: apiResult?.marketMood || "확인 중",
    direction: apiResult?.direction || "관망",
    flows: normalizeFlows(apiResult?.flows, fallbackFlows),
    evidence: normalizeTextArray(apiResult?.evidence, fallback?.evidence || []),
    briefing: {
      date: briefing?.date || null,
      weather: briefing?.weather || "날씨 데이터가 아직 준비되지 않았습니다.",
      news: briefing?.news || "뉴스 데이터가 아직 준비되지 않았습니다.",
      market: briefing?.market || "시장 데이터가 아직 준비되지 않았습니다.",
      technology:
        briefing?.technology || "기술 데이터가 아직 준비되지 않았습니다.",
      connection: briefing?.connection || "",
      detail: briefing?.detail || "",
    },
    sourceStatus: apiResult?.sourceStatus || "fallback",
  };
}

function getHeroCopy(intent) {
  const copyMap = {
    business: ["오늘은", "고객의 흐름을 먼저 보세요."],
    money: ["오늘은", "기회의 방향을 먼저 보세요."],
    market: ["오늘은", "시장의 연결을 먼저 보세요."],
    weather: ["오늘은", "이동과 컨디션을 먼저 보세요."],
    news: ["오늘은", "뉴스의 방향을 먼저 보세요."],
    relationship: ["오늘은", "대화의 온도를 먼저 보세요."],
    general: ["오늘은", "흐름을 먼저 보세요."],
  };

  return copyMap[intent] || copyMap.general;
}


function getResultDateLabel(value) {
  if (!value) return "오늘 브리핑";

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(value);

  const [, year, month, day] = match;
  const date = new Date(`${year}-${month}-${day}T12:00:00+09:00`);
  const weekday = new Intl.DateTimeFormat("ko-KR", {
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(date);

  return `${Number(month)}월 ${Number(day)}일 ${weekday}`;
}

function getWeatherSnapshot(value) {
  const source = String(value || "").trim();
  const temperatureMatch = source.match(/(-?\d+(?:\.\d+)?)\s*(?:°|도)/);

  const conditions = [
    ["맑", "맑음"],
    ["흐", "흐림"],
    ["구름", "구름"],
    ["비", "비"],
    ["눈", "눈"],
    ["안개", "안개"],
  ];

  const condition =
    conditions.find(([keyword]) => source.includes(keyword))?.[1] ||
    (source.includes("연결되지") || source.includes("준비되지")
      ? "준비 중"
      : "확인 중");

  return {
    temperature: temperatureMatch
      ? `${Math.round(Number(temperatureMatch[1]))}°`
      : "--°",
    condition,
    detail: source || "날씨 데이터를 준비하고 있습니다.",
  };
}

function getDashboardActions(value) {
  const defaults = [
    "오전에는 오늘의 핵심 흐름을 먼저 확인하세요.",
    "오후에는 질문과 직접 연결되는 행동을 실행하세요.",
    "저녁에는 결과와 변화를 짧게 기록하세요.",
  ];

  return [0, 1, 2].map((index) => value?.[index] || defaults[index]);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestMorningAnswer(question, signal) {
  const response = await fetch("/api/morning-ai/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
    cache: "no-store",
    signal,
  });

  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new Error("Morning AI 응답 형식을 확인할 수 없습니다.");
  }

  if (!response.ok || !payload?.ok || !payload?.result) {
    throw new Error(payload?.message || "Morning AI 질문 분석에 실패했습니다.");
  }

  return payload.result;
}

export default function MorningPage() {
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState("home");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);

  useEffect(() => {
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
        })),
      );
    }, 16000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mode !== "understanding") return undefined;

    const stepTimer = setInterval(() => {
      setStep((value) => Math.min(value + 1, thinkingMessages.length - 1));
    }, 1100);

    return () => clearInterval(stepTimer);
  }, [mode]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  async function submit(event) {
    event.preventDefault();

    const cleanQuestion = question.trim().replace(/\s+/g, " ");
    if (!cleanQuestion) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setQuestion(cleanQuestion);
    setSubmittedQuestion(cleanQuestion);
    setStep(0);
    setResult(null);
    setErrorMessage("");
    setMode("understanding");

    const minimumLoadingTime = wait(1800);
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const [apiResult] = await Promise.all([
        requestMorningAnswer(cleanQuestion, controller.signal),
        minimumLoadingTime,
      ]);

      if (requestId !== requestIdRef.current) return;

      setResult(normalizeMorningResult(apiResult, cleanQuestion));
      setMode("result");
    } catch (error) {
      await minimumLoadingTime;

      if (requestId !== requestIdRef.current) return;
      if (error?.name === "AbortError" && controller.signal.aborted) {
        setErrorMessage("응답 시간이 길어져 기본 분석 결과로 먼저 안내합니다.");
      } else {
        setErrorMessage(
          error?.message ||
            "실시간 분석을 불러오지 못해 기본 결과를 표시합니다.",
        );
      }

      setResult(normalizeMorningResult(null, cleanQuestion));
      setMode("result");
    } finally {
      clearTimeout(timeoutId);

      if (requestId === requestIdRef.current) {
        controllerRef.current = null;
      }
    }
  }

  if (mode === "understanding") {
    const keywords = extractKeywords(submittedQuestion || question);

    return (
      <main className="morningPage" aria-busy="true">
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
          <p className="userQuestion">“{submittedQuestion || question}”</p>

          <div className="keywordCloud">
            {keywords.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className={`keyword k${index + 1}`}
              >
                {word}
              </span>
            ))}
          </div>

          <p className="thinkingText">{thinkingMessages[step]}</p>

          <div className="horizonLoadingBar">
            <span />
          </div>
        </section>

        <PageStyle />
      </main>
    );
  }

  if (mode === "result" && result) {
    const resultQuestion = submittedQuestion || result.question || question;
    const flows = result.flows.slice(0, 5);
    const primaryFlow = flows[0] || {
      label: "핵심 변수",
      value: 0,
      reason: "핵심 데이터를 연결하고 있습니다.",
    };
    const weather = getWeatherSnapshot(result.briefing.weather);
    const actions = getDashboardActions(result.actions);
    const resultDate = getResultDateLabel(result.briefing.date);
    const connectionLabels =
      flows.length > 0
        ? flows.map((flow) => flow.label)
        : result.evidence.length > 0
          ? result.evidence
          : ["오늘", "질문", "판단", "행동"];
    const statusText = errorMessage
      ? errorMessage
      : result.sourceStatus === "database"
        ? `${result.briefing.date || "오늘"} 저장 브리핑과 질문을 연결했습니다.`
        : "기본 분석 엔진으로 결과를 구성했습니다.";

    return (
      <main className="resultPage dashboardPage">
        <div className="dashboardBackdrop" aria-hidden="true" />

        <div className="dashboardShell">
          <header className="dashboardTopbar">
            <div className="dashboardBrand">
              <div className="dashboardBrandOrb">✦</div>
              <div>
                <strong>Oneul.H</strong>
                <span>AI Hologram</span>
              </div>
            </div>

            <div className="dashboardHorizonTitle">
              <i />
              <span>Today&apos;s Horizon</span>
              <i />
            </div>

            <div className="dashboardConfidence">
              <span className="confidenceShield">◆</span>
              <span>신뢰도</span>
              <strong>{result.confidence}%</strong>
            </div>
          </header>

          <section className="dashboardHero">
            <p className="dashboardEyebrow">오늘의 흐름을 질문 기준으로 연결했습니다</p>
            <h1>{result.headline}</h1>
            <div className="dashboardQuestionChip">“ {resultQuestion} ”</div>
            <p className="dashboardHeroSummary">
              {result.briefing.connection || result.interpretation}
            </p>
            <div
              className={`dashboardStatus ${
                result.sourceStatus === "fallback" ? "fallback" : ""
              }`}
            >
              {resultDate} · {statusText}
            </div>
          </section>

          <section className="dashboardSnapshotGrid" aria-label="오늘의 핵심 요약">
            <article className="dashboardSnapshotCard">
              <div className="dashboardSnapshotIcon weather">☁</div>
              <div>
                <span>날씨</span>
                <strong>
                  {weather.condition} <b>{weather.temperature}</b>
                </strong>
              </div>
            </article>

            <article className="dashboardSnapshotCard">
              <div className="dashboardSnapshotIcon mood">●</div>
              <div>
                <span>시장 분위기</span>
                <strong>{result.marketMood}</strong>
              </div>
            </article>

            <article className="dashboardSnapshotCard">
              <div className="dashboardSnapshotIcon direction">◎</div>
              <div>
                <span>오늘의 방향</span>
                <strong>{result.direction}</strong>
              </div>
            </article>

            <article className="dashboardSnapshotCard">
              <div className="dashboardSnapshotIcon variable">＄</div>
              <div>
                <span>핵심 변수</span>
                <strong>
                  {primaryFlow.label} <b>{primaryFlow.value}</b>
                </strong>
              </div>
            </article>
          </section>

          <section className="dashboardContentGrid">
            <div className="dashboardMainColumn">
              <article className="dashboardPanel dashboardOneLine">
                <div className="dashboardPanelTitle">
                  <span>✦</span>
                  <strong>오늘의 한 줄</strong>
                </div>
                <h2>{result.headline}</h2>
              </article>

              <article className="dashboardPanel dashboardInterpretation">
                <div className="dashboardPanelTitle">
                  <span>↗</span>
                  <strong>질문 해석</strong>
                </div>
                <p>{result.interpretation}</p>
              </article>

              <article className="dashboardPanel dashboardActionsPanel">
                <div className="dashboardPanelTitle">
                  <span>✓</span>
                  <strong>오늘 할 일</strong>
                </div>

                <div className="dashboardActionsGrid">
                  {actions.map((action, index) => (
                    <div className="dashboardActionItem" key={`${action}-${index}`}>
                      <div className="dashboardActionIcon">
                        {index === 0 ? "☀" : index === 1 ? "▣" : "☾"}
                      </div>
                      <div>
                        <strong>
                          {index === 0
                            ? "오전 확인"
                            : index === 1
                              ? "오후 실행"
                              : "저녁 기록"}
                        </strong>
                        <span>{action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="dashboardPanel dashboardBriefPanel">
                <div className="dashboardPanelTitle">
                  <span>▤</span>
                  <strong>간밤 브리핑</strong>
                </div>

                <div className="dashboardBriefGrid">
                  <div className="dashboardBriefItem">
                    <i className="briefDot news" />
                    <strong>뉴스</strong>
                    <p>{result.briefing.news}</p>
                  </div>
                  <div className="dashboardBriefItem">
                    <i className="briefDot market" />
                    <strong>시장</strong>
                    <p>{result.briefing.market}</p>
                  </div>
                  <div className="dashboardBriefItem">
                    <i className="briefDot tech" />
                    <strong>AI · 기술</strong>
                    <p>{result.briefing.technology}</p>
                  </div>
                </div>
              </article>

              <article className="dashboardPanel dashboardSourcesPanel">
                <div className="dashboardPanelTitle">
                  <span>↗</span>
                  <strong>원문 확인</strong>
                </div>

                <div className="dashboardSourceGrid">
                  <div className="dashboardSourceItem">
                    <div>
                      <strong>뉴스 원문</strong>
                      <span>데이터 연결 후 열림</span>
                    </div>
                    <b>↗</b>
                  </div>
                  <div className="dashboardSourceItem">
                    <div>
                      <strong>시장 원문</strong>
                      <span>데이터 연결 후 열림</span>
                    </div>
                    <b>↗</b>
                  </div>
                  <div className="dashboardSourceItem">
                    <div>
                      <strong>기술 원문</strong>
                      <span>데이터 연결 후 열림</span>
                    </div>
                    <b>↗</b>
                  </div>
                </div>
              </article>
            </div>

            <aside className="dashboardSideColumn">
              <article className="dashboardPanel dashboardOpportunity">
                <div className="dashboardPanelTitle green">
                  <span>↗</span>
                  <strong>오늘의 기회</strong>
                </div>
                <p>{result.opportunity}</p>
              </article>

              <article className="dashboardPanel dashboardRisk">
                <div className="dashboardPanelTitle red">
                  <span>▲</span>
                  <strong>주의할 점</strong>
                </div>
                <p>{result.risk}</p>
              </article>

              <article className="dashboardPanel dashboardInfluencePanel">
                <div className="dashboardPanelTitle">
                  <span>▥</span>
                  <strong>영향력 TOP5</strong>
                </div>

                <div className="dashboardFlowList">
                  {flows.length > 0 ? (
                    flows.map((flow, index) => (
                      <div className="dashboardFlowRow" key={`${flow.label}-${index}`}>
                        <b>{index + 1}</b>
                        <strong>{flow.label}</strong>
                        <div className="dashboardFlowTrack">
                          <i style={{ width: `${flow.value}%` }} />
                        </div>
                        <span>{flow.value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="dashboardEmptyText">
                      영향력 데이터를 준비하고 있습니다.
                    </p>
                  )}
                </div>
              </article>

              <article className="dashboardPanel dashboardConnectionPanel">
                <div className="dashboardPanelTitle">
                  <span>↔</span>
                  <strong>연결 흐름</strong>
                </div>

                <div className="dashboardConnectionFlow">
                  {connectionLabels.slice(0, 5).map((label, index) => (
                    <div className="dashboardConnectionStep" key={`${label}-${index}`}>
                      <div className="dashboardConnectionNode">
                        {index === 0
                          ? "▥"
                          : index === 1
                            ? "＄"
                            : index === 2
                              ? "◎"
                              : index === 3
                                ? "♙"
                                : "▤"}
                      </div>
                      <span>{label}</span>
                      {index < Math.min(connectionLabels.length, 5) - 1 && (
                        <b>→</b>
                      )}
                    </div>
                  ))}
                </div>
              </article>

              <article className="dashboardPanel dashboardWeatherDetail">
                <div className="dashboardPanelTitle cyan">
                  <span>☁</span>
                  <strong>날씨 · 이동</strong>
                </div>
                <p>{weather.detail}</p>
              </article>
            </aside>
          </section>

          <form className="dashboardAskBar" onSubmit={submit}>
            <div className="dashboardAskSpark">✦</div>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="다시 궁금한 것을 입력하세요"
              aria-label="새로운 질문 입력"
            />
            <button type="submit" className="dashboardAskButton">
              <span>AI</span>
              <b>✦</b>
            </button>
          </form>
        </div>

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
          onChange={(event) => setQuestion(event.target.value)}
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
        font-family:
          Pretendard,
          -apple-system,
          BlinkMacSystemFont,
          system-ui,
          sans-serif;
        isolation: isolate;
      }

      .bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(
          circle at 50% 38%,
          rgba(255, 255, 255, 1) 0%,
          rgba(235, 247, 255, 0.96) 34%,
          rgba(232, 235, 255, 0.95) 66%,
          rgba(250, 252, 255, 1) 100%
        );
      }

      .bg::before {
        content: "";
        position: absolute;
        inset: -20%;
        background:
          radial-gradient(
            circle at 14% 25%,
            rgba(56, 189, 248, 0.3),
            transparent 31%
          ),
          radial-gradient(
            circle at 86% 23%,
            rgba(139, 92, 246, 0.26),
            transparent 32%
          ),
          radial-gradient(
            circle at 52% 84%,
            rgba(96, 165, 250, 0.24),
            transparent 36%
          );
        filter: blur(62px);
        animation: bgMove 20s ease-in-out infinite alternate;
      }

      .bg::after {
        content: "";
        position: absolute;
        inset: 0;
        background-image:
          radial-gradient(
            circle,
            rgba(37, 99, 235, 0.13) 1px,
            transparent 1.5px
          ),
          radial-gradient(
            circle,
            rgba(124, 58, 237, 0.08) 1px,
            transparent 1.5px
          );
        background-size:
          120px 120px,
          210px 210px;
        opacity: 0.28;
        animation: particleMove 54s linear infinite;
      }

      .orb {
        position: absolute;
        border-radius: 999px;
        filter: blur(18px);
        opacity: 0.58;
        pointer-events: none;
        z-index: 1;
      }

      .orbA {
        width: 170px;
        height: 170px;
        left: 5%;
        bottom: 8%;
        background: radial-gradient(
          circle,
          rgba(56, 189, 248, 0.85),
          rgba(167, 139, 250, 0.55),
          transparent 72%
        );
        animation: orbMoveA 18s ease-in-out infinite;
      }

      .orbB {
        width: 120px;
        height: 120px;
        right: 8%;
        top: 35%;
        background: radial-gradient(
          circle,
          rgba(196, 181, 253, 0.9),
          rgba(147, 197, 253, 0.55),
          transparent 72%
        );
        animation: orbMoveB 20s ease-in-out infinite;
      }

      .orbC {
        width: 90px;
        height: 90px;
        left: 48%;
        bottom: 18%;
        background: radial-gradient(
          circle,
          rgba(125, 211, 252, 0.72),
          rgba(129, 140, 248, 0.42),
          transparent 72%
        );
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
        box-shadow: 0 14px 34px rgba(79, 70, 229, 0.22);
        font-size: 18px;
      }

      .identity strong {
        display: block;
        color: rgba(15, 23, 42, 0.88);
        font-size: 27px;
        font-weight: 950;
        letter-spacing: -0.045em;
      }

      .identity span {
        display: block;
        margin-top: 4px;
        color: rgba(37, 99, 235, 0.6);
        font-size: 15px;
        font-weight: 760;
      }

      .horizon {
        position: absolute;
        right: 56px;
        top: 51px;
        z-index: 20;
        color: rgba(79, 70, 229, 0.5);
        font-size: 14px;
        font-weight: 900;
        letter-spacing: 0.16em;
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
        color: rgba(37, 99, 235, 0.78);
        text-shadow:
          0 0 22px rgba(96, 165, 250, 0.28),
          0 16px 42px rgba(79, 70, 229, 0.12);
        animation: fixedBreath 5.8s ease-in-out infinite;
        pointer-events: none;
      }

      .fixedSideQuestion {
        position: absolute;
        z-index: 9;
        border: 0;
        background: transparent;
        color: rgba(37, 99, 235, 0.62);
        font-size: clamp(21px, 1.65vw, 32px);
        font-weight: 820;
        letter-spacing: -0.065em;
        line-height: 1.35;
        cursor: pointer;
        text-align: left;
        text-shadow: 0 0 24px rgba(96, 165, 250, 0.3);
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
        text-shadow: 0 0 24px rgba(96, 165, 250, 0.28);
        transition:
          left 15.5s linear,
          top 15.5s linear,
          opacity 15.5s ease-in-out,
          filter 15.5s ease-in-out,
          transform 15.5s linear;
        will-change: left, top, transform, opacity, filter;
      }

      .floatingQuestion.blue {
        color: rgba(37, 99, 235, 0.68);
      }

      .floatingQuestion.purple {
        color: rgba(124, 58, 237, 0.6);
      }

      .floatingQuestion.cyan {
        color: rgba(14, 116, 144, 0.56);
      }

      .floatingQuestion:hover,
      .fixedSideQuestion:hover {
        opacity: 1 !important;
        filter: blur(0px) !important;
        color: rgba(79, 70, 229, 0.96);
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
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.24),
          rgba(255, 255, 255, 0.1)
        );
        border: 1px solid rgba(255, 255, 255, 0.62);
        backdrop-filter: blur(8px) saturate(165%);
        -webkit-backdrop-filter: blur(8px) saturate(165%);
        box-shadow:
          0 20px 70px rgba(37, 99, 235, 0.09),
          0 0 0 1px rgba(147, 197, 253, 0.16),
          inset 0 1px 1px rgba(255, 255, 255, 0.72),
          inset 0 -1px 1px rgba(37, 99, 235, 0.1);
        overflow: hidden;
      }

      .glassWindow::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(
          105deg,
          transparent 10%,
          rgba(255, 255, 255, 0.3) 45%,
          transparent 72%
        );
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
        background: linear-gradient(
          90deg,
          transparent,
          rgba(37, 99, 235, 0.25),
          transparent
        );
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
        background: rgba(255, 255, 255, 0.22);
        color: rgba(37, 99, 235, 0.66);
        font-size: 13px;
        font-weight: 950;
        letter-spacing: -0.02em;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
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
        color: rgba(15, 23, 42, 0.9);
        font-size: clamp(20px, 1.8vw, 29px);
        font-weight: 540;
        letter-spacing: -0.055em;
        text-align: center;
      }

      .glassWindow input::placeholder {
        color: rgba(71, 85, 105, 0.34);
      }

      .aiButton {
        height: 40px;
        padding: 0 19px;
        border: 0;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.24);
        color: rgba(30, 41, 59, 0.74);
        font-size: 16px;
        font-weight: 950;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 7px;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.32);
      }

      .aiButton span {
        color: rgba(79, 70, 229, 0.72);
      }

      .underGlow {
        position: absolute;
        inset: -20%;
        background:
          radial-gradient(
            circle at 50% 45%,
            rgba(255, 255, 255, 0.92),
            transparent 26%
          ),
          radial-gradient(
            circle at 50% 55%,
            rgba(96, 165, 250, 0.22),
            transparent 38%
          );
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
        color: rgba(37, 99, 235, 0.18);
        font-size: clamp(18px, 1.5vw, 28px);
        font-weight: 900;
        letter-spacing: 0.14em;
        animation: dataFloat 12s ease-in-out infinite;
      }

      .d1 {
        left: 12%;
        top: 25%;
      }
      .d2 {
        left: 70%;
        top: 20%;
        animation-delay: 0.7s;
      }
      .d3 {
        left: 18%;
        bottom: 22%;
        animation-delay: 1.4s;
      }
      .d4 {
        right: 14%;
        bottom: 28%;
        animation-delay: 2.1s;
      }
      .d5 {
        left: 43%;
        top: 19%;
        animation-delay: 2.8s;
      }
      .d6 {
        right: 30%;
        top: 40%;
        animation-delay: 3.5s;
      }
      .d7 {
        left: 32%;
        bottom: 13%;
        animation-delay: 4.2s;
      }
      .d8 {
        right: 8%;
        top: 58%;
        animation-delay: 4.9s;
      }
      .d9 {
        left: 8%;
        top: 56%;
        animation-delay: 5.6s;
      }
      .d10 {
        right: 40%;
        bottom: 19%;
        animation-delay: 6.3s;
      }
      .d11 {
        left: 50%;
        top: 70%;
        animation-delay: 7s;
      }
      .d12 {
        right: 12%;
        top: 34%;
        animation-delay: 7.7s;
      }

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
        color: rgba(15, 23, 42, 0.82);
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
        color: rgba(37, 99, 235, 0.72);
        font-weight: 900;
        font-size: clamp(24px, 2.2vw, 42px);
        letter-spacing: -0.07em;
        animation: keywordPulse 2.4s ease-in-out infinite;
      }

      .k1 {
        left: 42%;
        top: 0%;
      }
      .k2 {
        left: 8%;
        top: 32%;
        animation-delay: 0.2s;
      }
      .k3 {
        right: 8%;
        top: 34%;
        animation-delay: 0.4s;
      }
      .k4 {
        left: 36%;
        top: 58%;
        animation-delay: 0.6s;
      }
      .k5 {
        left: 18%;
        top: 76%;
        animation-delay: 0.8s;
      }
      .k6 {
        right: 18%;
        top: 76%;
        animation-delay: 1s;
      }
      .k7 {
        left: 46%;
        top: 37%;
        animation-delay: 1.2s;
      }

      .thinkingText {
        margin-top: 22px;
        font-size: 26px;
        color: rgba(30, 64, 175, 0.82);
        font-weight: 900;
        letter-spacing: -0.04em;
        text-shadow: 0 0 18px rgba(96, 165, 250, 0.22);
      }

      .horizonLoadingBar {
        width: min(420px, 62vw);
        height: 5px;
        margin-top: 20px;
        border-radius: 999px;
        background: rgba(37, 99, 235, 0.12);
        overflow: hidden;
      }

      .horizonLoadingBar span {
        display: block;
        width: 42%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(
          90deg,
          rgba(96, 165, 250, 0.15),
          rgba(37, 99, 235, 0.75),
          rgba(139, 92, 246, 0.65)
        );
        box-shadow: 0 0 22px rgba(96, 165, 250, 0.55);
        animation: horizonLoading 1.45s ease-in-out infinite;
      }

      .resultPage {
        overflow-y: auto;
        background:
          radial-gradient(
            circle at 50% 0%,
            rgba(219, 234, 254, 0.9),
            transparent 34%
          ),
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
        color: rgba(79, 70, 229, 0.58);
        font-size: 14px;
        font-weight: 950;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      .resultHero h1 {
        margin: 10px 0;
        font-size: clamp(44px, 5vw, 78px);
        letter-spacing: -0.08em;
        color: rgba(15, 23, 42, 0.9);
      }

      .resultHero span {
        color: rgba(37, 99, 235, 0.68);
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
        grid-template-columns: 1.65fr 0.9fr;
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
        background: rgba(255, 255, 255, 0.46);
        border: 1px solid rgba(255, 255, 255, 0.68);
        backdrop-filter: blur(16px);
        box-shadow: 0 20px 70px rgba(37, 99, 235, 0.08);
      }

      .mainInsight {
        padding: 32px;
        min-height: 170px;
      }

      .resultCard p {
        margin: 0 0 12px;
        color: rgba(37, 99, 235, 0.72);
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
        color: rgba(51, 65, 85, 0.72);
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
        color: rgba(79, 70, 229, 0.5);
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .heroQuestion p {
        margin: 9px 0 0;
        color: rgba(15, 23, 42, 0.76);
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
        color: rgba(37, 99, 235, 0.48);
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.14em;
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
        background: linear-gradient(
          90deg,
          transparent,
          rgba(37, 99, 235, 0.22),
          transparent
        );
        animation: dataLineMove 11s linear infinite;
      }

      .resultDataAura i:nth-child(1) {
        left: 8%;
        top: 24%;
        animation-delay: 0s;
      }
      .resultDataAura i:nth-child(2) {
        left: 64%;
        top: 32%;
        animation-delay: 1.6s;
      }
      .resultDataAura i:nth-child(3) {
        left: 22%;
        top: 72%;
        animation-delay: 3.1s;
      }
      .resultDataAura i:nth-child(4) {
        left: 70%;
        top: 68%;
        animation-delay: 4.7s;
      }
      .resultDataAura i:nth-child(5) {
        left: 44%;
        top: 18%;
        animation-delay: 6.2s;
      }
      .resultDataAura i:nth-child(6) {
        left: 38%;
        top: 84%;
        animation-delay: 7.8s;
      }

      @keyframes titleBreath {
        0%,
        100% {
          opacity: 0.82;
          filter: blur(0.4px);
          transform: translateY(0) scale(0.99);
        }
        50% {
          opacity: 1;
          filter: blur(0);
          transform: translateY(-6px) scale(1.015);
        }
      }

      @keyframes scrollPulse {
        0%,
        100% {
          opacity: 0.35;
          transform: translateX(-50%) translateY(0);
        }
        50% {
          opacity: 0.9;
          transform: translateX(-50%) translateY(8px);
        }
      }

      @keyframes dataLineMove {
        0% {
          opacity: 0;
          transform: translateX(-80px) scaleX(0.4);
        }
        25% {
          opacity: 0.75;
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
        background: rgba(255, 255, 255, 0.38);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.38);
      }

      .resultCard.small {
        min-height: 112px;
      }

      @keyframes fixedBreath {
        0%,
        100% {
          opacity: 0.5;
          filter: blur(1.3px);
          transform: translateX(-50%) scale(0.96);
        }
        48% {
          opacity: 0.95;
          filter: blur(0px);
          transform: translateX(-50%) scale(1.03);
        }
      }

      @keyframes sideBreath {
        0%,
        100% {
          opacity: 0.42;
          filter: blur(1.4px);
          transform: scale(0.96);
        }
        50% {
          opacity: 0.92;
          filter: blur(0px);
          transform: scale(1.035);
        }
      }

      @keyframes keywordPulse {
        0%,
        100% {
          opacity: 0.32;
          filter: blur(1.5px);
          transform: scale(0.92);
        }
        50% {
          opacity: 0.95;
          filter: blur(0);
          transform: scale(1.05);
        }
      }

      @keyframes dataFloat {
        0%,
        100% {
          opacity: 0.1;
          transform: translateY(0);
        }
        50% {
          opacity: 0.28;
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
        0% {
          transform: translateX(-120%);
        }
        100% {
          transform: translateX(120%);
        }
      }

      @keyframes bgMove {
        from {
          transform: scale(1) translate(-1%, -1%);
        }
        to {
          transform: scale(1.08) translate(1%, 1%);
        }
      }

      @keyframes particleMove {
        from {
          background-position:
            0 0,
            0 0;
        }
        to {
          background-position:
            240px 240px,
            -210px 310px;
        }
      }

      @keyframes orbMoveA {
        0%,
        100% {
          transform: translate(0, 0) scale(1);
        }
        50% {
          transform: translate(66px, -44px) scale(1.08);
        }
      }

      @keyframes orbMoveB {
        0%,
        100% {
          transform: translate(0, 0) scale(1);
        }
        50% {
          transform: translate(-74px, 52px) scale(1.12);
        }
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
          radial-gradient(circle, rgba(96, 165, 250, 0.34), transparent 62%),
          radial-gradient(
            circle at 68% 42%,
            rgba(139, 92, 246, 0.22),
            transparent 58%
          );
        filter: blur(48px);
        opacity: 0.9;
        animation: heroGlowMove 10s ease-in-out infinite alternate;
      }

      .resultLabel {
        position: relative;
        z-index: 2;
        margin: 0 0 30px;
        color: rgba(79, 70, 229, 0.62);
        font-size: 16px;
        font-weight: 950;
        letter-spacing: 0.26em;
      }

      .horizonBigTitle {
        position: relative;
        z-index: 2;
        margin: 0;
        text-align: center;
        color: rgba(15, 23, 42, 0.92);
        font-size: clamp(72px, 9vw, 148px);
        line-height: 0.94;
        font-weight: 950;
        letter-spacing: -0.1em;
      }

      .horizonBigTitle span {
        display: block;
      }

      .horizonBigTitle span:nth-child(2) {
        color: rgba(37, 99, 235, 0.86);
      }

      .heroQuestionText {
        position: relative;
        z-index: 2;
        margin-top: 36px;
        max-width: 760px;
        color: rgba(51, 65, 85, 0.72);
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
        background: rgba(255, 255, 255, 0.42);
        border: 1px solid rgba(255, 255, 255, 0.68);
        backdrop-filter: blur(18px);
        box-shadow: 0 20px 60px rgba(37, 99, 235, 0.08);
      }

      .confidenceBadge span {
        display: block;
        color: rgba(79, 70, 229, 0.58);
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.15em;
        text-transform: uppercase;
      }

      .confidenceBadge strong {
        display: block;
        margin-top: 5px;
        color: rgba(15, 23, 42, 0.86);
        font-size: 34px;
        font-weight: 950;
      }

      @keyframes heroGlowMove {
        0% {
          transform: translate(-52%, -50%) scale(0.96);
          opacity: 0.65;
        }
        100% {
          transform: translate(-48%, -52%) scale(1.08);
          opacity: 0.95;
        }
      }
      @keyframes orbMoveC {
        0%,
        100% {
          transform: translate(0, 0) scale(1);
        }
        50% {
          transform: translate(34px, -58px) scale(1.12);
        }
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
        color: rgba(79, 70, 229, 0.62);
        font-size: 16px;
        font-weight: 950;
        letter-spacing: 0.26em;
      }

      .horizonBigTitle {
        margin: 0;
        text-align: center;
        font-size: clamp(96px, 11vw, 180px);
        line-height: 0.9;
        font-weight: 950;
        letter-spacing: -0.11em;
        color: rgba(15, 23, 42, 0.92);
      }

      .horizonBigTitle span {
        display: block;
      }

      .horizonBigTitle span:nth-child(2) {
        color: rgba(37, 99, 235, 0.86);
      }

      .heroQuestionText {
        margin-top: 38px;
        color: rgba(51, 65, 85, 0.74);
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
        background: rgba(255, 255, 255, 0.28);
        border: 1px solid rgba(255, 255, 255, 0.68);
        backdrop-filter: blur(14px) saturate(170%);
        -webkit-backdrop-filter: blur(14px) saturate(170%);
        box-shadow:
          0 22px 70px rgba(37, 99, 235, 0.08),
          inset 0 1px 1px rgba(255, 255, 255, 0.72);
      }

      .resultSearchBar input {
        flex: 1;
        height: 100%;
        border: 0;
        outline: 0;
        background: transparent;
        color: rgba(15, 23, 42, 0.88);
        font-size: 25px;
        font-weight: 650;
        letter-spacing: -0.055em;
        text-align: center;
      }

      .resultSearchBar input::placeholder {
        color: rgba(71, 85, 105, 0.35);
      }

      .horizonBigTitle {
        gap: 18px;
      }

      .horizonBigTitle span:nth-child(2) {
        color: rgba(59, 130, 246, 0.78);
      }

      .heroQuestionText {
        animation: softBreathText 5.8s ease-in-out infinite;
      }

      .heroGlow {
        animation: heroGlowMove 18s ease-in-out infinite alternate;
      }

      @keyframes softBreathText {
        0%,
        100% {
          opacity: 0.62;
          filter: blur(0.3px);
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
          radial-gradient(
            circle at 35% 42%,
            rgba(96, 165, 250, 0.2),
            transparent 34%
          ),
          radial-gradient(
            circle at 68% 48%,
            rgba(139, 92, 246, 0.18),
            transparent 36%
          ),
          radial-gradient(
            circle at 50% 72%,
            rgba(56, 189, 248, 0.12),
            transparent 34%
          );
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
        border: 1px solid rgba(96, 165, 250, 0.12);
        box-shadow:
          0 0 0 90px rgba(96, 165, 250, 0.035),
          0 0 0 180px rgba(139, 92, 246, 0.025);
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
        color: rgba(30, 41, 59, 0.92);
        text-shadow: 0 18px 60px rgba(30, 64, 175, 0.12);
      }

      .horizonBigTitle span:nth-child(2) {
        background: linear-gradient(
          90deg,
          rgba(37, 99, 235, 0.78),
          rgba(96, 165, 250, 0.92),
          rgba(124, 58, 237, 0.72)
        );
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent !important;
        text-shadow: 0 22px 80px rgba(37, 99, 235, 0.18);
      }

      .heroQuestionText {
        margin-top: 42px;
        padding: 13px 24px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.34);
        border: 1px solid rgba(255, 255, 255, 0.62);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: 0 18px 54px rgba(37, 99, 235, 0.07);
        animation: softBreathText 6s ease-in-out infinite;
      }

      .heroSubMessage {
        position: relative;
        z-index: 3;
        margin-top: 22px;
        color: rgba(71, 85, 105, 0.62);
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
        background: rgba(255, 255, 255, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.68);
        backdrop-filter: blur(16px) saturate(170%);
        -webkit-backdrop-filter: blur(16px) saturate(170%);
        box-shadow:
          0 22px 70px rgba(37, 99, 235, 0.08),
          inset 0 1px 1px rgba(255, 255, 255, 0.72);
      }

      .resultSearchBar input {
        flex: 1;
        height: 100%;
        border: 0;
        outline: 0;
        background: transparent;
        color: rgba(15, 23, 42, 0.88);
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.055em;
        text-align: center;
      }

      .resultSearchBar input::placeholder {
        color: rgba(71, 85, 105, 0.34);
      }

      .confidenceBadge {
        transform: scale(0.92);
        opacity: 0.86;
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
        0%,
        100% {
          opacity: 0.42;
          transform: translate(-50%, -50%) scale(0.94);
        }
        50% {
          opacity: 0.82;
          transform: translate(-50%, -50%) scale(1.04);
        }
      }

      @keyframes softBreathText {
        0%,
        100% {
          opacity: 0.72;
          transform: translateY(0);
        }
        50% {
          opacity: 1;
          transform: translateY(-3px);
        }
      }

      .resultStatus {
        position: relative;
        z-index: 4;
        margin-top: 16px;
        padding: 9px 14px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.36);
        border: 1px solid rgba(255, 255, 255, 0.6);
        color: rgba(71, 85, 105, 0.62);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }

      .resultStatus.fallback {
        color: rgba(180, 83, 9, 0.78);
        background: rgba(255, 247, 237, 0.72);
        border-color: rgba(251, 191, 36, 0.28);
      }

      .insightMeta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 20px;
      }

      .insightMeta b {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 12px;
        border-radius: 999px;
        background: rgba(239, 246, 255, 0.72);
        color: rgba(30, 64, 175, 0.72);
        font-size: 13px;
        font-weight: 900;
      }

      .briefSection + .briefSection {
        margin-top: 18px;
        padding-top: 18px;
        border-top: 1px solid rgba(148, 163, 184, 0.16);
      }

      .briefSection strong {
        display: block;
        margin-bottom: 7px;
        color: rgba(30, 64, 175, 0.72);
        font-size: 14px;
        font-weight: 950;
      }

      .flowRows {
        gap: 11px;
      }

      .flowRow {
        display: grid;
        grid-template-columns: minmax(90px, 0.75fr) 64px minmax(0, 2fr);
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        border-radius: 17px;
        background: rgba(255, 255, 255, 0.38);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
      }

      .flowRow strong {
        color: rgba(30, 41, 59, 0.82);
        font-size: 15px;
        font-weight: 950;
      }

      .flowRow b {
        color: rgba(37, 99, 235, 0.72);
        font-size: 15px;
        text-align: right;
      }

      .flowRow span {
        min-width: 0;
        color: rgba(71, 85, 105, 0.68);
        font-size: 14px;
        line-height: 1.55;
      }

      .actionList {
        margin: 0;
        padding-left: 19px;
      }

      .actionList li + li {
        margin-top: 8px;
      }

      .aiButton:disabled {
        cursor: wait;
        opacity: 0.6;
      }

      @media (max-width: 820px) {
        .identity {
          left: 22px;
          top: 22px;
        }

        .horizon {
          right: 22px;
          top: 30px;
          font-size: 11px;
        }

        .fixedQuestion {
          top: 14%;
          width: calc(100% - 40px);
          white-space: normal;
          text-align: center;
        }

        .fixedSideQuestion {
          display: none;
        }

        .glassWindow {
          width: calc(100% - 34px);
          top: 54%;
        }

        .userQuestion {
          width: calc(100% - 38px);
          font-size: 28px;
          text-align: center;
        }

        .horizonHero {
          min-height: 92vh;
          padding: 0 18px;
        }

        .horizonBigTitle {
          font-size: clamp(54px, 16vw, 90px);
        }

        .heroQuestionText {
          max-width: calc(100% - 24px);
          font-size: 23px;
        }

        .heroSubMessage {
          font-size: 16px;
        }

        .confidenceBadge {
          right: 18px;
          top: 94px;
        }

        .resultSearchBar {
          width: min(94vw, 720px);
        }

        .horizonLayout {
          grid-template-columns: 1fr;
          padding: 0 16px;
          margin-top: 16px;
        }

        .flowRow {
          grid-template-columns: 1fr auto;
        }

        .flowRow span {
          grid-column: 1 / -1;
        }
      }


      /* ======================================================
         Result Dashboard 2026
         /morning 결과 화면 전용
         ====================================================== */
      .resultPage.dashboardPage {
        overflow-y: auto;
        overflow-x: hidden;
        background:
          radial-gradient(circle at 12% 18%, rgba(147, 197, 253, 0.34), transparent 32%),
          radial-gradient(circle at 86% 12%, rgba(196, 181, 253, 0.34), transparent 32%),
          linear-gradient(180deg, #f8fbff 0%, #eef5ff 52%, #f7f9ff 100%);
        color: #17213a;
      }

      .dashboardBackdrop {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
      }

      .dashboardBackdrop::before {
        content: "";
        position: absolute;
        left: -8%;
        right: -8%;
        top: 120px;
        height: 440px;
        background:
          radial-gradient(ellipse at 30% 48%, rgba(125, 211, 252, 0.22), transparent 52%),
          radial-gradient(ellipse at 70% 48%, rgba(167, 139, 250, 0.18), transparent 54%);
        filter: blur(48px);
        transform: rotate(-2deg);
      }

      .dashboardBackdrop::after {
        content: "";
        position: absolute;
        inset: 0;
        opacity: 0.34;
        background-image:
          radial-gradient(circle, rgba(99, 102, 241, 0.12) 1px, transparent 1.4px),
          linear-gradient(115deg, transparent 42%, rgba(96, 165, 250, 0.08) 50%, transparent 58%);
        background-size: 78px 78px, 100% 100%;
        mask-image: linear-gradient(to bottom, transparent 4%, black 28%, black 80%, transparent 100%);
      }

      .dashboardShell {
        position: relative;
        z-index: 2;
        width: min(1320px, calc(100% - 48px));
        margin: 0 auto;
        padding: 26px 0 110px;
      }

      .dashboardTopbar {
        min-height: 58px;
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 20px;
      }

      .dashboardBrand {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .dashboardBrandOrb {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: white;
        font-size: 17px;
        background:
          radial-gradient(circle at 28% 25%, #ffffff 0%, #9ddcff 22%, transparent 40%),
          linear-gradient(145deg, #65c8ff, #8b7cff 58%, #d4a7ff);
        box-shadow:
          0 10px 28px rgba(79, 70, 229, 0.2),
          inset 0 0 18px rgba(255, 255, 255, 0.72);
      }

      .dashboardBrand strong {
        display: block;
        color: #0f1d3d;
        font-size: 21px;
        font-weight: 950;
        letter-spacing: -0.04em;
      }

      .dashboardBrand span {
        display: block;
        margin-top: 2px;
        color: rgba(49, 86, 164, 0.65);
        font-size: 12px;
        font-weight: 750;
      }

      .dashboardHorizonTitle {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 13px;
        color: rgba(57, 91, 175, 0.72);
        font-size: 14px;
        font-weight: 850;
        letter-spacing: 0.02em;
      }

      .dashboardHorizonTitle i {
        width: 74px;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5));
      }

      .dashboardHorizonTitle i:last-child {
        transform: scaleX(-1);
      }

      .dashboardConfidence {
        justify-self: end;
        min-height: 44px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 14px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.56);
        border: 1px solid rgba(164, 188, 255, 0.48);
        box-shadow:
          0 12px 30px rgba(63, 91, 180, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.88);
        backdrop-filter: blur(18px);
      }

      .confidenceShield {
        color: #4f8cff;
        font-size: 14px;
      }

      .dashboardConfidence span:not(.confidenceShield) {
        color: rgba(55, 91, 170, 0.76);
        font-size: 13px;
        font-weight: 800;
      }

      .dashboardConfidence strong {
        color: #4268bd;
        font-size: 21px;
        font-weight: 950;
      }

      .dashboardHero {
        max-width: 980px;
        margin: 0 auto;
        padding: 14px 0 14px;
        text-align: center;
      }

      .dashboardEyebrow {
        margin: 0 0 8px;
        color: rgba(69, 102, 184, 0.62);
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.08em;
      }

      .dashboardHero h1 {
        margin: 0 auto;
        max-width: 980px;
        color: #102249;
        font-size: clamp(30px, 3.15vw, 52px);
        line-height: 1.16;
        font-weight: 950;
        letter-spacing: -0.065em;
        text-wrap: balance;
      }

      .dashboardQuestionChip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        margin-top: 14px;
        padding: 0 28px;
        border-radius: 999px;
        color: #21335c;
        font-size: clamp(15px, 1.35vw, 19px);
        font-weight: 850;
        letter-spacing: -0.04em;
        background: rgba(255, 255, 255, 0.58);
        border: 1px solid rgba(170, 188, 244, 0.46);
        box-shadow:
          0 10px 28px rgba(71, 92, 170, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(18px);
      }

      .dashboardHeroSummary {
        margin: 12px auto 0;
        max-width: 850px;
        color: rgba(49, 65, 97, 0.66);
        font-size: 13px;
        line-height: 1.65;
        font-weight: 650;
      }

      .dashboardStatus {
        display: inline-flex;
        margin-top: 9px;
        padding: 6px 10px;
        border-radius: 999px;
        color: rgba(66, 86, 127, 0.6);
        font-size: 10px;
        font-weight: 800;
        background: rgba(255, 255, 255, 0.4);
        border: 1px solid rgba(186, 201, 238, 0.38);
      }

      .dashboardStatus.fallback {
        color: #a16207;
        background: rgba(255, 247, 237, 0.72);
        border-color: rgba(245, 158, 11, 0.24);
      }

      .dashboardSnapshotGrid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-top: 8px;
      }

      .dashboardSnapshotCard,
      .dashboardPanel {
        background: rgba(255, 255, 255, 0.58);
        border: 1px solid rgba(255, 255, 255, 0.86);
        box-shadow:
          0 18px 40px rgba(53, 83, 155, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(18px) saturate(140%);
        -webkit-backdrop-filter: blur(18px) saturate(140%);
      }

      .dashboardSnapshotCard {
        min-height: 76px;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 14px 18px;
        border-radius: 20px;
        box-sizing: border-box;
      }

      .dashboardSnapshotIcon {
        flex: 0 0 auto;
        width: 46px;
        height: 46px;
        display: grid;
        place-items: center;
        border-radius: 17px;
        font-size: 22px;
        font-weight: 950;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.72);
      }

      .dashboardSnapshotIcon.weather {
        color: #5d8fe8;
        background: linear-gradient(145deg, #eef8ff, #cfe6ff);
      }

      .dashboardSnapshotIcon.mood {
        color: #d69f16;
        background: linear-gradient(145deg, #fff9db, #ffe8a4);
      }

      .dashboardSnapshotIcon.direction {
        color: #4e83d9;
        background: linear-gradient(145deg, #edf7ff, #d8eaff);
      }

      .dashboardSnapshotIcon.variable {
        color: #7367dc;
        background: linear-gradient(145deg, #f5f0ff, #ded8ff);
      }

      .dashboardSnapshotCard > div:last-child {
        min-width: 0;
      }

      .dashboardSnapshotCard span {
        display: block;
        margin-bottom: 5px;
        color: rgba(54, 74, 111, 0.66);
        font-size: 11px;
        font-weight: 850;
      }

      .dashboardSnapshotCard strong {
        display: block;
        overflow: hidden;
        color: #17274e;
        font-size: clamp(18px, 1.55vw, 24px);
        font-weight: 950;
        letter-spacing: -0.04em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .dashboardSnapshotCard strong b {
        color: #263d74;
        font-weight: 950;
      }

      .dashboardContentGrid {
        display: grid;
        grid-template-columns: minmax(0, 1.58fr) minmax(340px, 0.92fr);
        gap: 14px;
        margin-top: 14px;
      }

      .dashboardMainColumn,
      .dashboardSideColumn {
        display: grid;
        align-content: start;
        gap: 12px;
      }

      .dashboardPanel {
        border-radius: 20px;
        padding: 18px 20px;
        box-sizing: border-box;
      }

      .dashboardPanelTitle {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        color: #3f6ed4;
      }

      .dashboardPanelTitle.green {
        color: #1ba87e;
      }

      .dashboardPanelTitle.red {
        color: #ef5a67;
      }

      .dashboardPanelTitle.cyan {
        color: #28a9c7;
      }

      .dashboardPanelTitle span {
        display: inline-grid;
        place-items: center;
        width: 22px;
        height: 22px;
        border-radius: 8px;
        background: currentColor;
        color: white;
        font-size: 11px;
        font-weight: 950;
      }

      .dashboardPanelTitle strong {
        font-size: 14px;
        font-weight: 950;
        letter-spacing: -0.025em;
      }

      .dashboardOneLine h2 {
        margin: 0;
        color: #17274e;
        font-size: clamp(22px, 2.1vw, 33px);
        line-height: 1.38;
        font-weight: 950;
        letter-spacing: -0.055em;
      }

      .dashboardInterpretation p,
      .dashboardOpportunity p,
      .dashboardRisk p,
      .dashboardWeatherDetail p {
        margin: 0;
        color: rgba(45, 61, 91, 0.77);
        font-size: 13px;
        line-height: 1.72;
        font-weight: 620;
      }

      .dashboardActionsGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .dashboardActionItem {
        min-width: 0;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        min-height: 72px;
        padding: 12px;
        border-radius: 15px;
        background: rgba(246, 250, 255, 0.68);
        border: 1px solid rgba(195, 210, 244, 0.46);
        box-sizing: border-box;
      }

      .dashboardActionIcon {
        flex: 0 0 auto;
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        color: #4f7fe0;
        font-size: 15px;
        background: rgba(228, 239, 255, 0.9);
      }

      .dashboardActionItem strong {
        display: block;
        margin-bottom: 4px;
        color: #26385e;
        font-size: 12px;
        font-weight: 950;
      }

      .dashboardActionItem span {
        display: -webkit-box;
        overflow: hidden;
        color: rgba(66, 82, 113, 0.72);
        font-size: 10px;
        line-height: 1.45;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .dashboardBriefGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .dashboardBriefItem {
        min-width: 0;
        padding: 0 16px;
      }

      .dashboardBriefItem:first-child {
        padding-left: 0;
      }

      .dashboardBriefItem:last-child {
        padding-right: 0;
      }

      .dashboardBriefItem + .dashboardBriefItem {
        border-left: 1px solid rgba(154, 174, 219, 0.26);
      }

      .briefDot {
        display: inline-block;
        width: 9px;
        height: 9px;
        margin-right: 7px;
        border-radius: 50%;
      }

      .briefDot.news {
        background: #5d96f4;
      }

      .briefDot.market {
        background: #48c5a4;
      }

      .briefDot.tech {
        background: #a377ec;
      }

      .dashboardBriefItem strong {
        color: #31476f;
        font-size: 11px;
        font-weight: 950;
      }

      .dashboardBriefItem p {
        display: -webkit-box;
        overflow: hidden;
        margin: 8px 0 0;
        color: rgba(61, 78, 109, 0.72);
        font-size: 10px;
        line-height: 1.55;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
      }

      .dashboardSourceGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .dashboardSourceItem {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 12px 14px;
        border-radius: 14px;
        background: rgba(246, 250, 255, 0.64);
        border: 1px solid rgba(190, 207, 242, 0.42);
      }

      .dashboardSourceItem strong,
      .dashboardSourceItem span {
        display: block;
      }

      .dashboardSourceItem strong {
        color: #334a78;
        font-size: 11px;
        font-weight: 950;
      }

      .dashboardSourceItem span {
        margin-top: 3px;
        color: rgba(77, 93, 123, 0.52);
        font-size: 9px;
      }

      .dashboardSourceItem b {
        color: #6d8bd2;
        font-size: 14px;
      }

      .dashboardOpportunity,
      .dashboardRisk,
      .dashboardWeatherDetail {
        min-height: 110px;
      }

      .dashboardFlowList {
        display: grid;
        gap: 9px;
      }

      .dashboardFlowRow {
        display: grid;
        grid-template-columns: 18px 82px minmax(0, 1fr) 34px;
        align-items: center;
        gap: 8px;
      }

      .dashboardFlowRow > b {
        color: #24375f;
        font-size: 11px;
      }

      .dashboardFlowRow > strong {
        overflow: hidden;
        color: #30456f;
        font-size: 11px;
        font-weight: 850;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .dashboardFlowTrack {
        height: 6px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(168, 184, 222, 0.24);
      }

      .dashboardFlowTrack i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #94a8ff, #a97cf0);
        box-shadow: 0 0 12px rgba(132, 109, 236, 0.28);
      }

      .dashboardFlowRow > span {
        color: #445a8d;
        font-size: 10px;
        font-weight: 850;
        text-align: right;
      }

      .dashboardEmptyText {
        margin: 0;
        color: rgba(69, 87, 122, 0.58);
        font-size: 11px;
      }

      .dashboardConnectionFlow {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 4px;
      }

      .dashboardConnectionStep {
        min-width: 0;
        flex: 1;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .dashboardConnectionNode {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: #5c7cda;
        font-size: 14px;
        font-weight: 950;
        background: linear-gradient(145deg, #f6f9ff, #e2eaff);
        border: 1px solid rgba(177, 196, 239, 0.5);
        box-shadow: 0 8px 18px rgba(79, 106, 178, 0.1);
      }

      .dashboardConnectionStep span {
        width: 100%;
        margin-top: 7px;
        overflow: hidden;
        color: #3f5a91;
        font-size: 9px;
        font-weight: 850;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .dashboardConnectionStep b {
        position: absolute;
        right: -7px;
        top: 9px;
        color: rgba(77, 110, 192, 0.52);
        font-size: 13px;
      }

      .dashboardAskBar {
        position: sticky;
        bottom: 16px;
        z-index: 20;
        width: min(860px, calc(100% - 36px));
        height: 58px;
        margin: 16px auto 0;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 9px 0 14px;
        border-radius: 999px;
        background: rgba(249, 252, 255, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.96);
        box-shadow:
          0 18px 46px rgba(58, 82, 157, 0.18),
          inset 0 1px 0 rgba(255, 255, 255, 0.94);
        backdrop-filter: blur(24px) saturate(160%);
        box-sizing: border-box;
      }

      .dashboardAskSpark {
        flex: 0 0 auto;
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: #7c83dc;
        background: linear-gradient(145deg, #f5f7ff, #e8ebff);
      }

      .dashboardAskBar input {
        min-width: 0;
        flex: 1;
        height: 100%;
        border: 0;
        outline: 0;
        background: transparent;
        color: #1d2b4b;
        font-size: 15px;
        font-weight: 650;
      }

      .dashboardAskBar input::placeholder {
        color: rgba(78, 94, 128, 0.42);
      }

      .dashboardAskButton {
        flex: 0 0 auto;
        height: 42px;
        min-width: 96px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        border: 0;
        border-radius: 999px;
        color: white;
        font-size: 17px;
        font-weight: 950;
        cursor: pointer;
        background: linear-gradient(135deg, #4fb9ff, #6374f2 54%, #be69f1);
        box-shadow:
          0 10px 24px rgba(100, 93, 226, 0.28),
          inset 0 1px 0 rgba(255, 255, 255, 0.46);
      }

      .dashboardAskButton b {
        font-size: 13px;
      }

      @media (max-width: 1080px) {
        .dashboardShell {
          width: min(940px, calc(100% - 32px));
        }

        .dashboardSnapshotGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .dashboardContentGrid {
          grid-template-columns: 1fr;
        }

        .dashboardSideColumn {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .dashboardInfluencePanel,
        .dashboardConnectionPanel {
          grid-column: span 2;
        }
      }

      @media (max-width: 720px) {
        .dashboardShell {
          width: calc(100% - 22px);
          padding-top: 16px;
        }

        .dashboardTopbar {
          grid-template-columns: 1fr auto;
        }

        .dashboardHorizonTitle {
          display: none;
        }

        .dashboardConfidence {
          padding: 0 10px;
        }

        .dashboardConfidence span:not(.confidenceShield) {
          display: none;
        }

        .dashboardHero {
          padding-top: 16px;
        }

        .dashboardHero h1 {
          font-size: 30px;
        }

        .dashboardQuestionChip {
          width: 100%;
          min-height: 46px;
          padding: 0 14px;
          box-sizing: border-box;
        }

        .dashboardSnapshotGrid {
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .dashboardSnapshotCard {
          min-height: 84px;
          gap: 10px;
          padding: 12px;
        }

        .dashboardSnapshotIcon {
          width: 38px;
          height: 38px;
          border-radius: 13px;
          font-size: 18px;
        }

        .dashboardSnapshotCard strong {
          font-size: 17px;
        }

        .dashboardPanel {
          padding: 16px;
        }

        .dashboardActionsGrid,
        .dashboardBriefGrid,
        .dashboardSourceGrid,
        .dashboardSideColumn {
          grid-template-columns: 1fr;
        }

        .dashboardBriefItem {
          padding: 12px 0;
        }

        .dashboardBriefItem + .dashboardBriefItem {
          border-left: 0;
          border-top: 1px solid rgba(154, 174, 219, 0.26);
        }

        .dashboardInfluencePanel,
        .dashboardConnectionPanel {
          grid-column: auto;
        }

        .dashboardFlowRow {
          grid-template-columns: 16px 72px minmax(0, 1fr) 28px;
        }

        .dashboardConnectionNode {
          width: 30px;
          height: 30px;
        }

        .dashboardConnectionStep b {
          right: -5px;
          top: 7px;
        }

        .dashboardAskBar {
          bottom: 8px;
          width: 100%;
          height: 54px;
          margin-top: 12px;
        }

        .dashboardAskButton {
          min-width: 76px;
        }
      }

    `}</style>
  );
}
