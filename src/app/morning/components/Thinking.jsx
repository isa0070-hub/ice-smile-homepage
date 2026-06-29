export default function Thinking({ question, step, keywords, dataWords }) {
    const thinkingTexts = [
      "최고의 질문에 답을 찾고 있습니다.",
      "질문을 확장 분석하고 있습니다.",
      "오늘에 영감을 주는 데이터를 연결하고 있습니다.",
      "당신만의 Horizon을 만드는 중입니다.",
    ];
  
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
  
          <p className="thinkingText">{thinkingTexts[step]}</p>
  
          <div className="horizonLoadingBar">
            <span />
          </div>
        </section>
      </main>
    );
  }