"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();

  const [contacts, setContacts] = useState([]);
  const [cases, setCases] = useState([]);
  const [notices, setNotices] = useState([]);
  const [popups, setPopups] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: contactData } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: caseData } = await supabase
      .from("repair_cases")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: noticeData } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: popupData } = await supabase
      .from("popup_notices")
      .select("*")
      .order("created_at", { ascending: false });

    setContacts(contactData || []);
    setCases(caseData || []);
    setNotices(noticeData || []);
    setPopups(popupData || []);
  }

  function go(path) {
    router.push(path);
  }

  async function logout() {
    await fetch("/api/admin-logout", {
      method: "POST",
    });

    router.replace("/login");
    router.refresh();
  }

  return (
    <main style={mainStyle}>
      <div style={topStyle}>
        <div>
          <h1 style={mainTitleStyle}>관리자 대시보드</h1>

          <p style={mainDescriptionStyle}>
            온라인 접수, 수리사례, 공지사항, 팝업과 검색 유입 통계를
            관리하는 공간입니다.
          </p>
        </div>

        <div style={topButtonWrapStyle}>
          <a href="/" style={homeButtonStyle}>
            홈페이지 보기
          </a>

          <button
            type="button"
            onClick={logout}
            style={logoutButtonStyle}
          >
            로그아웃
          </button>
        </div>
      </div>

      <div style={summaryGridStyle}>
        <div style={summaryCardStyle}>
          <strong>온라인 접수</strong>
          <p>{contacts.length}건</p>
        </div>

        <div style={summaryCardStyle}>
          <strong>등록된 수리사례</strong>
          <p>{cases.length}건</p>
        </div>

        <div style={summaryCardStyle}>
          <strong>공지사항</strong>
          <p>{notices.length}건</p>
        </div>

        <div style={summaryCardStyle}>
          <strong>팝업</strong>
          <p>{popups.length}건</p>
        </div>
      </div>

      <section style={{ marginTop: "34px" }}>
        <h2 style={sectionTitleStyle}>검색 유입 통계</h2>

        <div style={menuGridStyle}>
          <button
            type="button"
            onClick={() => go("/admin/analytics")}
            style={analyticsMenuCardStyle}
          >
            <span style={menuIconStyle}>📊</span>

            <strong>검색 유입 통계 보기</strong>

            <p style={menuDescriptionStyle}>
              전일·7일·30일 기준으로 자연검색과 유료광고 유입,
              처음 방문한 수리사례를 확인합니다.
            </p>
          </button>
        </div>
      </section>

      <section style={{ marginTop: "46px" }}>
        <h2 style={sectionTitleStyle}>수리사례 관리</h2>

        <div style={menuGridStyle}>
          <button
            type="button"
            onClick={() => go("/admin/repair-cases")}
            style={menuCardStyle}
          >
            <span style={menuIconStyle}>➕</span>
            <strong>수리사례 등록</strong>

            <p style={menuDescriptionStyle}>
              새로운 수리사례와 대표사진, 상세사진을 등록합니다.
            </p>
          </button>

          <button
            type="button"
            onClick={() => go("/admin/repair-cases/list")}
            style={menuCardStyle}
          >
            <span style={menuIconStyle}>🛠️</span>
            <strong>수리사례 수정 · 삭제</strong>

            <p style={menuDescriptionStyle}>
              등록된 수리사례를 수정하거나 삭제합니다.
            </p>
          </button>

          <button
            type="button"
            onClick={() => go("/repair-cases")}
            style={menuCardStyle}
          >
            <span style={menuIconStyle}>👀</span>
            <strong>수리사례 화면 보기</strong>

            <p style={menuDescriptionStyle}>
              고객에게 노출되는 수리사례 목록을 확인합니다.
            </p>
          </button>
        </div>
      </section>

      <section style={{ marginTop: "46px" }}>
        <h2 style={sectionTitleStyle}>공지사항 관리</h2>

        <div style={menuGridStyle}>
          <button
            type="button"
            onClick={() => go("/admin/notices")}
            style={menuCardStyle}
          >
            <span style={menuIconStyle}>📢</span>
            <strong>공지사항 등록</strong>

            <p style={menuDescriptionStyle}>
              영업시간, 휴무, 택배접수 안내 등 공지를 등록합니다.
            </p>
          </button>

          <button
            type="button"
            onClick={() => go("/admin/notices/list")}
            style={menuCardStyle}
          >
            <span style={menuIconStyle}>✏️</span>
            <strong>공지사항 수정 · 삭제</strong>

            <p style={menuDescriptionStyle}>
              등록된 공지사항을 수정하거나 삭제합니다.
            </p>
          </button>

          <button
            type="button"
            onClick={() => go("/notices")}
            style={menuCardStyle}
          >
            <span style={menuIconStyle}>👀</span>
            <strong>공지사항 화면 보기</strong>

            <p style={menuDescriptionStyle}>
              고객에게 노출되는 공지사항 목록을 확인합니다.
            </p>
          </button>
        </div>
      </section>

      <section style={{ marginTop: "46px" }}>
        <h2 style={sectionTitleStyle}>팝업 관리</h2>

        <div style={menuGridStyle}>
          <button
            type="button"
            onClick={() => go("/admin/popups")}
            style={menuCardStyle}
          >
            <span style={menuIconStyle}>🖼️</span>
            <strong>팝업 등록</strong>

            <p style={menuDescriptionStyle}>
              이벤트, 휴무, 택배수리 안내 팝업을 등록합니다.
            </p>
          </button>

          <button
            type="button"
            onClick={() => go("/admin/popups/list")}
            style={menuCardStyle}
          >
            <span style={menuIconStyle}>✏️</span>
            <strong>팝업 수정 · 삭제</strong>

            <p style={menuDescriptionStyle}>
              등록된 팝업을 수정하거나 삭제합니다.
            </p>
          </button>

          <button
            type="button"
            onClick={() => go("/")}
            style={menuCardStyle}
          >
            <span style={menuIconStyle}>👀</span>
            <strong>팝업 화면 확인</strong>

            <p style={menuDescriptionStyle}>
              홈페이지에서 팝업 노출 상태를 확인합니다.
            </p>
          </button>
        </div>
      </section>

      <section style={{ marginTop: "46px" }}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>최근 수리사례</h2>

          <a
            href="/admin/repair-cases/list"
            style={smallLinkButtonStyle}
          >
            전체 관리
          </a>
        </div>

        <div style={listStyle}>
          {cases.length > 0 ? (
            cases.slice(0, 8).map((item) => (
              <div key={item.id} style={caseRowStyle}>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={
                      item.alt_text ||
                      item.title ||
                      "수리사례 이미지"
                    }
                    style={thumbStyle}
                  />
                ) : (
                  <div style={noImageStyle}>이미지 없음</div>
                )}

                <div style={{ flex: 1 }}>
                  <strong>{item.title || "제목 없음"}</strong>

                  <p style={caseMetaStyle}>
                    {item.branch || "지점 없음"} ·{" "}
                    {item.category || "카테고리 없음"}
                  </p>

                  <p style={caseKeywordStyle}>
                    {item.seo_keyword || "SEO 키워드 없음"}
                  </p>
                </div>

                <div style={rowButtonWrapStyle}>
                  <a
                    href={`/admin/repair-cases/edit/${item.id}`}
                    style={editButtonStyle}
                  >
                    수정
                  </a>

                  <a
                    href={`/admin/repair-cases/delete/${item.id}`}
                    style={deleteButtonStyle}
                  >
                    삭제
                  </a>
                </div>
              </div>
            ))
          ) : (
            <p style={emptyStyle}>
              등록된 수리사례가 없습니다.
            </p>
          )}
        </div>
      </section>

      <section style={{ marginTop: "46px" }}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>최근 공지사항</h2>

          <a
            href="/admin/notices/list"
            style={smallLinkButtonStyle}
          >
            전체 관리
          </a>
        </div>

        <div style={listStyle}>
          {notices.length > 0 ? (
            notices.slice(0, 5).map((item) => (
              <div key={item.id} style={noticeRowStyle}>
                <div style={{ flex: 1 }}>
                  <p style={noticeLabelStyle}>
                    {item.is_pinned
                      ? "📌 중요공지"
                      : "공지사항"}
                  </p>

                  <strong>{item.title || "제목 없음"}</strong>

                  <p style={noticeDateStyle}>
                    {item.created_at
                      ? new Date(
                          item.created_at
                        ).toLocaleDateString("ko-KR")
                      : ""}
                  </p>
                </div>

                <div style={rowButtonWrapStyle}>
                  <a
                    href={`/admin/notices/edit/${item.id}`}
                    style={editButtonStyle}
                  >
                    수정
                  </a>

                  <a
                    href={`/admin/notices/delete/${item.id}`}
                    style={deleteButtonStyle}
                  >
                    삭제
                  </a>
                </div>
              </div>
            ))
          ) : (
            <p style={emptyStyle}>
              등록된 공지사항이 없습니다.
            </p>
          )}
        </div>
      </section>

      <section style={{ marginTop: "46px" }}>
        <h2 style={sectionTitleStyle}>최근 온라인 접수</h2>

        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeadRowStyle}>
                <th style={thStyle}>이름</th>
                <th style={thStyle}>연락처</th>
                <th style={thStyle}>지점</th>
                <th style={thStyle}>기기</th>
                <th style={thStyle}>모델명</th>
                <th style={thStyle}>증상</th>
                <th style={thStyle}>접수방식</th>
              </tr>
            </thead>

            <tbody>
              {contacts.slice(0, 10).map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>{item.name}</td>
                  <td style={tdStyle}>{item.phone}</td>
                  <td style={tdStyle}>{item.branch}</td>
                  <td style={tdStyle}>{item.device}</td>
                  <td style={tdStyle}>{item.model}</td>
                  <td style={tdStyle}>{item.symptom}</td>
                  <td style={tdStyle}>{item.visit_type}</td>
                </tr>
              ))}

              {contacts.length === 0 && (
                <tr>
                  <td style={tdStyle} colSpan={7}>
                    접수 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const mainStyle = {
  maxWidth: "1200px",
  margin: "60px auto",
  padding: "24px",
};

const topStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "28px",
};

const mainTitleStyle = {
  fontSize: "40px",
  margin: "0 0 8px",
};

const mainDescriptionStyle = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.7,
};

const topButtonWrapStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const homeButtonStyle = {
  display: "inline-block",
  padding: "12px 18px",
  borderRadius: "999px",
  background: "#1e3a8a",
  color: "white",
  textDecoration: "none",
  fontWeight: "900",
};

const logoutButtonStyle = {
  border: "none",
  padding: "12px 18px",
  borderRadius: "999px",
  background: "#dc2626",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: "900",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
};

const summaryCardStyle = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "24px",
  boxShadow:
    "0 8px 20px rgba(15, 23, 42, 0.06)",
};

const sectionTitleStyle = {
  fontSize: "28px",
  margin: "0 0 18px",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const smallLinkButtonStyle = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "999px",
  background: "#e5e7eb",
  color: "#111827",
  textDecoration: "none",
  fontWeight: "900",
};

const menuGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "20px",
};

const menuCardStyle = {
  textAlign: "left",
  background: "#ffffff",
  border: "1px solid #dbeafe",
  borderRadius: "20px",
  padding: "28px",
  color: "#111827",
  cursor: "pointer",
  boxShadow:
    "0 10px 25px rgba(15, 23, 42, 0.08)",
};

const analyticsMenuCardStyle = {
  ...menuCardStyle,
  width: "100%",
  maxWidth: "560px",
  background:
    "linear-gradient(135deg, #eff6ff, #ffffff)",
  border: "1px solid #93c5fd",
};

const menuIconStyle = {
  display: "block",
  fontSize: "34px",
  marginBottom: "14px",
};

const menuDescriptionStyle = {
  margin: "10px 0 0",
  color: "#475569",
  lineHeight: 1.7,
};

const listStyle = {
  display: "grid",
  gap: "14px",
};

const caseRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "18px",
};

const noticeRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "18px",
};

const thumbStyle = {
  width: "120px",
  height: "82px",
  objectFit: "cover",
  borderRadius: "12px",
};

const noImageStyle = {
  width: "120px",
  height: "82px",
  borderRadius: "12px",
  background: "#f1f5f9",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  fontSize: "13px",
};

const caseMetaStyle = {
  margin: "6px 0",
  color: "#475569",
};

const caseKeywordStyle = {
  margin: 0,
  color: "#64748b",
};

const noticeLabelStyle = {
  margin: "0 0 6px",
  color: "#1e3a8a",
  fontWeight: "900",
};

const noticeDateStyle = {
  margin: "6px 0 0",
  color: "#64748b",
};

const rowButtonWrapStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const editButtonStyle = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "999px",
  background: "#1e3a8a",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "900",
};

const deleteButtonStyle = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "999px",
  background: "#dc2626",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "900",
};

const emptyStyle = {
  padding: "20px",
  borderRadius: "14px",
  background: "#f8fafc",
  color: "#64748b",
  fontWeight: "800",
};

const tableWrapStyle = {
  overflowX: "auto",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const tableHeadRowStyle = {
  background: "#0f172a",
  color: "#ffffff",
};

const thStyle = {
  padding: "12px",
  border: "1px solid #1f2937",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};