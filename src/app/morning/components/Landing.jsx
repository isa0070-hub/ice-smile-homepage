export default function Landing({
    question,
    setQuestion,
    items,
    fixedSideQuestions,
    submit,
  }) {
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
      </main>
    );
  }