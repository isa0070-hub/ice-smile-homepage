"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminMorningNotesPage() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState("");

  useEffect(() => {
    fetchNotes();
  }, []);
async function handleGenerateBriefing() {
  setGenerating(true);
  setGenerateMessage("Morning AI가 브리핑을 생성하고 있습니다...");

  try {
    const response = await fetch("/api/morning-ai/generate", {
      method: "POST",
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "브리핑 생성 실패");
    }

    setGenerateMessage("브리핑 생성이 완료되었습니다.");
    await fetchNotes();
  } catch (error) {
    console.error(error);
    setGenerateMessage(error.message || "브리핑 생성 중 오류가 발생했습니다.");
  } finally {
    setGenerating(false);
  }
}
  async function fetchNotes() {
    setLoading(true);

    const { data, error } = await supabase
      .from("gm_morning_notes")
      .select("*")
      .order("note_date", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setNotes(data || []);
    setSelectedNote(data?.[0] || null);
    setLoading(false);
  }

  function formatDate(dateText) {
    if (!dateText) {
      return new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });
    }

    return new Date(dateText).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  }

  function getImpactTop5(note) {
    if (!note?.impact_top5) return [];

    if (Array.isArray(note.impact_top5)) return note.impact_top5;

    try {
      return JSON.parse(note.impact_top5);
    } catch {
      return [];
    }
  }

  const emptyPreview = {
    ai_one_line: "아직 오늘의 AI 브리핑이 등록되지 않았습니다.",
    ai_direction: "분석 대기",
    ai_confidence_score: "-",
    ai_market_mood: "대기",
  };

  const note = selectedNote || emptyPreview;
  const impactTop5 = getImpactTop5(selectedNote);

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.nav}>
          <div style={styles.brand}>
            <span style={styles.sun}>🌅</span>
            <span>Good Morning</span>
          </div>

          <Link href="/admin" style={styles.adminButton}>
            관리자 홈
          </Link>
        </div>

        <div style={styles.heroContent}>
          <p style={styles.date}>{formatDate(selectedNote?.note_date)}</p>

          <h1 style={styles.title}>
            AI Morning Brief
          </h1>

          <p style={styles.subtitle}>
            뉴스가 아니라, 오늘의 흐름을 이해하는 아침 인사이트
          </p>

          <div style={styles.oneLineCard}>
            <span style={styles.oneLineLabel}>오늘의 방향성</span>
            <h2 style={styles.oneLineText}>
              {note.ai_one_line}
            </h2>
            <p style={styles.oneLineSub}>
              여러 정보를 연결해 오늘을 어떻게 바라보면 좋을지 AI가 정리합니다.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.dashboard}>
      <div style={styles.controlCenter}>
  <div>
    <p style={styles.controlLabel}>Morning AI Control Center</p>
    <h2 style={styles.controlTitle}>AI 브리핑 엔진</h2>
    <p style={styles.controlDesc}>
      버튼을 누르면 collect → analyze → generate → publish 순서로 브리핑을 생성합니다.
    </p>
    {generateMessage && (
      <p style={styles.controlMessage}>{generateMessage}</p>
    )}
  </div>

  <button
    type="button"
    onClick={handleGenerateBriefing}
    disabled={generating}
    style={{
      ...styles.generateButton,
      opacity: generating ? 0.6 : 1,
      cursor: generating ? "not-allowed" : "pointer",
    }}
  >
    {generating ? "생성 중..." : "🌅 AI 브리핑 생성"}
  </button>
</div>
        {loading ? (
          <div style={styles.emptyCard}>불러오는 중...</div>
        ) : notes.length === 0 ? (
          <>
            <div style={styles.emptyCard}>
              <h2 style={styles.emptyTitle}>아직 등록된 브리핑이 없습니다.</h2>
              <p style={styles.emptyText}>
                DB 연결은 완료되었습니다. 다음 단계에서 AI 생성 버튼을 연결하면
                매일 아침 이 화면에 브리핑이 표시됩니다.
              </p>
            </div>

            <PreviewDashboard />
          </>
        ) : (
          <>
            <div style={styles.topGrid}>
              <InfoCard
                title="AI 신뢰도"
                value={
                  note.ai_confidence_score
                    ? `${note.ai_confidence_score}점`
                    : "대기"
                }
                desc="결론의 확실성"
              />

              <InfoCard
                title="시장 분위기"
                value={note.ai_market_mood || "대기"}
                desc="오늘의 큰 흐름"
              />

              <InfoCard
                title="오늘 방향"
                value={note.ai_direction || "분석 대기"}
                desc="AI 최종 판단"
              />
            </div>

            <div style={styles.contentGrid}>
              <section style={styles.panel}>
                <h3 style={styles.panelTitle}>🔥 오늘 영향력 TOP 5</h3>

                {impactTop5.length > 0 ? (
                  <div style={styles.impactList}>
                    {impactTop5.map((item, index) => {
                      const title =
                        item.title || item.name || item.label || `이슈 ${index + 1}`;
                      const score = item.score || item.importance || 70;

                      return (
                        <div key={index} style={styles.impactItem}>
                          <div style={styles.impactHead}>
                            <strong>{index + 1}. {title}</strong>
                            <span>{score}</span>
                          </div>
                          <div style={styles.barBg}>
                            <div
                              style={{
                                ...styles.barFill,
                                width: `${Math.min(score, 100)}%`,
                              }}
                            />
                          </div>
                          {item.reason && (
                            <p style={styles.reason}>{item.reason}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={styles.muted}>
                    영향도 데이터가 아직 없습니다.
                  </p>
                )}
              </section>

              <section style={styles.panel}>
                <h3 style={styles.panelTitle}>🔗 AI 연결 분석</h3>
                <p style={styles.textBlock}>
                  {note.ai_connection_flow ||
                    note.ai_reasoning_summary ||
                    "환율, 증시, 금리, 뉴스 흐름을 연결한 분석이 아직 등록되지 않았습니다."}
                </p>
              </section>
            </div>

            <div style={styles.contentGrid}>
              <DetailBox
                title="💵 환율·국내증시"
                content={
                  note.exchange_market_analysis ||
                  note.market_summary ||
                  "분석 대기"
                }
              />

              <DetailBox
                title="☀ 날씨"
                content={note.weather_summary || "분석 대기"}
              />

              <DetailBox
                title="📰 핵심 뉴스"
                content={note.news_summary || "분석 대기"}
              />

              <DetailBox
                title="⚠️ 불확실성"
                content={
                  note.uncertainty_note ||
                  "아직 표시된 불확실성은 없습니다."
                }
              />
            </div>
          </>
        )}

        {notes.length > 0 && (
          <section style={styles.history}>
            <h3 style={styles.panelTitle}>지난 브리핑</h3>

            <div style={styles.historyList}>
              {notes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedNote(item)}
                  style={{
                    ...styles.historyButton,
                    ...(selectedNote?.id === item.id
                      ? styles.historyButtonActive
                      : {}),
                  }}
                >
                  <strong>{formatDate(item.note_date)}</strong>
                  <span>{item.ai_one_line || item.summary || item.title}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function InfoCard({ title, value, desc }) {
  return (
    <div style={styles.infoCard}>
      <span style={styles.infoTitle}>{title}</span>
      <strong style={styles.infoValue}>{value}</strong>
      <p style={styles.infoDesc}>{desc}</p>
    </div>
  );
}

function DetailBox({ title, content }) {
  return (
    <section style={styles.panel}>
      <h3 style={styles.panelTitle}>{title}</h3>
      <p style={styles.textBlock}>{content}</p>
    </section>
  );
}

function PreviewDashboard() {
  return (
    <div style={styles.previewGrid}>
      <InfoCard title="AI 신뢰도" value="대기" desc="AI 분석 연결 전" />
      <InfoCard title="시장 분위기" value="대기" desc="데이터 수집 전" />
      <InfoCard title="오늘 방향" value="분석 대기" desc="첫 브리핑 생성 필요" />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #0f172a 0%, #172554 42%, #f8fafc 42%, #f8fafc 100%)",
    color: "#0f172a",
  },
  hero: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "30px 24px 64px",
    color: "#fff",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "56px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "18px",
    fontWeight: 900,
    letterSpacing: "-0.02em",
  },
  sun: {
    fontSize: "28px",
  },
  adminButton: {
    textDecoration: "none",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.22)",
    padding: "10px 16px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: 800,
  },
  heroContent: {
    maxWidth: "860px",
  },
  date: {
    margin: "0 0 14px",
    color: "#bfdbfe",
    fontSize: "15px",
    fontWeight: 800,
  },
  title: {
    margin: 0,
    fontSize: "58px",
    lineHeight: 1.05,
    letterSpacing: "-0.06em",
    fontWeight: 950,
  },
  subtitle: {
    margin: "18px 0 28px",
    fontSize: "19px",
    color: "#dbeafe",
    lineHeight: 1.6,
  },
  oneLineCard: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "28px",
    padding: "28px",
    backdropFilter: "blur(10px)",
  },
  oneLineLabel: {
    color: "#fde68a",
    fontWeight: 900,
    fontSize: "14px",
  },
  oneLineText: {
    margin: "12px 0 10px",
    fontSize: "30px",
    lineHeight: 1.35,
    letterSpacing: "-0.04em",
  },
  oneLineSub: {
    margin: 0,
    color: "#dbeafe",
    lineHeight: 1.7,
  },
  dashboard: {
    maxWidth: "1180px",
    margin: "-42px auto 0",
    padding: "0 24px 60px",
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "16px",
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginTop: "16px",
  },
  infoCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
  },
  infoTitle: {
    display: "block",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: 900,
    marginBottom: "12px",
  },
  infoValue: {
    display: "block",
    fontSize: "30px",
    letterSpacing: "-0.04em",
    lineHeight: 1.2,
  },
  infoDesc: {
    margin: "10px 0 0",
    color: "#94a3b8",
    fontSize: "14px",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    marginBottom: "16px",
  },
  panel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 18px 45px rgba(15,23,42,0.06)",
  },
  panelTitle: {
    margin: "0 0 18px",
    fontSize: "20px",
    letterSpacing: "-0.03em",
  },
  impactList: {
    display: "grid",
    gap: "18px",
  },
  impactItem: {
    display: "grid",
    gap: "8px",
  },
  impactHead: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "15px",
  },
  barBg: {
    height: "13px",
    background: "#e5e7eb",
    borderRadius: "999px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "linear-gradient(90deg, #2563eb, #60a5fa)",
    borderRadius: "999px",
  },
  reason: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  textBlock: {
    margin: 0,
    color: "#334155",
    fontSize: "15px",
    lineHeight: 1.85,
    whiteSpace: "pre-line",
  },
  muted: {
    color: "#94a3b8",
    margin: 0,
  },
  emptyCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "28px",
    padding: "42px",
    textAlign: "center",
    boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
  },
  emptyTitle: {
    margin: "0 0 12px",
    fontSize: "28px",
    letterSpacing: "-0.04em",
  },
  emptyText: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.7,
  },
  history: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 18px 45px rgba(15,23,42,0.06)",
  },
  historyList: {
    display: "grid",
    gap: "10px",
  },
  historyButton: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: "16px",
    padding: "16px",
    cursor: "pointer",
    display: "grid",
    gap: "6px",
  },
  historyButtonActive: {
    borderColor: "#2563eb",
    background: "#eff6ff",
  },
  controlCenter: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "28px",
    padding: "26px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
  },
  controlLabel: {
    margin: "0 0 8px",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: 900,
  },
  controlTitle: {
    margin: "0 0 8px",
    fontSize: "24px",
    letterSpacing: "-0.04em",
  },
  controlDesc: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  controlMessage: {
    margin: "12px 0 0",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 800,
  },
  generateButton: {
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
    padding: "15px 22px",
    borderRadius: "999px",
    fontSize: "15px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
};