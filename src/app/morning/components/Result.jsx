export default function Result({ question }) {
    return (
      <main className="resultPage">
        <header className="identity">
          <div className="logoIcon">✦</div>
          <div>
            <strong> Morning Brain </strong>
            <span>AI Hologram</span>
          </div>
        </header>
  
        <section className="resultHero">
          <p>Today’s Horizon</p>
          <h1>오늘의 관점을 구성했습니다.</h1>
          <span>“{question}”</span>
        </section>
  
        <section className="horizonLayout">
          <div className="horizonMain">
            <div className="resultCard mainInsight">
              <p>오늘의 한 줄</p>
              <h2>오늘은 답 하나보다 흐름을 먼저 보는 것이 좋습니다.</h2>
              <span>
                사용자님의 질문을 기준으로 오늘의 뉴스, 날씨, 경제 흐름을 하나의 관점으로 다시 구성합니다.
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
              <p>오늘의 기회</p>
              <span>움직임이 생기는 쪽을 먼저 보고, 급한 결정보다는 흐름을 확인합니다.</span>
            </div>
  
            <div className="resultCard small">
              <p>주의할 점</p>
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
      </main>
    );
  }