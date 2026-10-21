import {
  UTM_ATTRIBUTION_SCOPES,
  V2_UTM_CAMPAIGN,
  filterUtmAttributionRows,
  summarizeUtmAttribution,
} from "@/lib/utmAttribution";

function num(value = 0) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function label(value) {
  return value || "(미설정)";
}

function kstTimestamp(value) {
  if (!value) return "기록 없음";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function Metric({ title, value, note }) {
  return (
    <div
      style={{
        padding: 16,
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        background: "#f8fafc",
      }}
    >
      <div style={{ color: "#64748b", fontSize: 12 }}>
        {title}
      </div>
      <div
        style={{
          marginTop: 5,
          color: "#0f172a",
          fontSize: 22,
          fontWeight: 900,
        }}
      >
        {value}
      </div>
      {note ? (
        <div
          style={{
            marginTop: 5,
            color: "#64748b",
            fontSize: 11,
            lineHeight: 1.45,
          }}
        >
          {note}
        </div>
      ) : null}
    </div>
  );
}

export default function UtmAttributionReport({
  attribution,
  error = "",
  scope,
}) {
  if (error || !attribution?.available) {
    return (
      <section
        style={{
          marginBottom: 22,
          padding: 20,
          background: "#fff7ed",
          border: "1px solid #fdba74",
          borderRadius: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20 }}>
          홈페이지 UTM 유입·문의행동
        </h2>
        <p
          style={{
            margin: "8px 0 0",
            color: "#9a3412",
            lineHeight: 1.6,
          }}
        >
          운영 수집 데이터에 접근하지 못했습니다.
          {error ? ` ${error}` : ""}
        </p>
      </section>
    );
  }

  const rows = filterUtmAttributionRows(
    attribution.rows || [],
    scope
  );
  const summary = summarizeUtmAttribution(rows);
  const scopeNote =
    scope === UTM_ATTRIBUTION_SCOPES.V2
      ? `현재 V2는 utm_campaign=${V2_UTM_CAMPAIGN}와 정확히 일치하는 방문입니다.`
      : scope === UTM_ATTRIBUTION_SCOPES.OTHER
      ? `기타는 utm_campaign=${V2_UTM_CAMPAIGN}가 아닌 방문입니다.`
      : "전체는 캠페인 값이 없거나 다른 광고 방문도 포함합니다.";

  return (
    <section
      aria-labelledby="utm-attribution-heading"
      style={{
        marginBottom: 22,
        padding: 20,
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: 16,
      }}
    >
      <h2
        id="utm-attribution-heading"
        style={{ margin: 0, color: "#111827", fontSize: 21 }}
      >
        홈페이지 UTM 유입·문의행동
      </h2>

      <p
        style={{
          margin: "7px 0 16px",
          color: "#64748b",
          fontSize: 13,
          lineHeight: 1.65,
        }}
      >
        {scopeNote} 선택 KST 기간의 방문을 기준으로 그 visit_id에 연결된
        행동 이벤트를 집계합니다. 전화와 톡톡은 버튼 클릭이며 실제
        통화·상담 완료를 뜻하지 않습니다.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <Metric
          title="광고 방문"
          value={`${num(summary.visits)}건`}
          note="선택 KST 기간에 저장된 방문 행"
        />
        <Metric
          title="문의행동 이벤트"
          value={`${num(summary.actionEvents)}건`}
          note="클릭과 접수 저장 성공 이벤트 행의 합계"
        />
        <Metric
          title="고유 문의행동 방문"
          value={`${num(summary.uniqueActionVisits)}건`}
          note="문의행동이 1개 이상 연결된 고유 visit_id"
        />
        <Metric
          title="마지막 유입 시각"
          value={kstTimestamp(summary.lastVisitAt)}
          note="KST"
        />
      </div>

      {rows.length === 0 ? (
        <div
          style={{
            padding: 18,
            color: "#475569",
            background: "#f8fafc",
            borderRadius: 12,
          }}
        >
          선택 범위와 기간에 저장된 홈페이지 광고 유입이 없습니다.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 1_080,
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {[
                  "utm_source",
                  "utm_medium",
                  "utm_campaign",
                  "utm_content",
                  "방문",
                  "이벤트",
                  "고유 행동 방문",
                  "전화 버튼 클릭",
                  "톡톡 버튼 클릭",
                  "접수 화면 클릭",
                  "접수 저장 성공",
                  "마지막 유입(KST)",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: "11px 9px",
                      borderBottom: "1px solid #e2e8f0",
                      color: "#475569",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={JSON.stringify([
                    row.source,
                    row.medium,
                    row.campaign,
                    row.content,
                  ])}
                >
                  <td style={cellStyle}>{label(row.source)}</td>
                  <td style={cellStyle}>{label(row.medium)}</td>
                  <td style={cellStyle}>{label(row.campaign)}</td>
                  <td style={cellStyle}>{label(row.content)}</td>
                  <td style={numberCellStyle}>{num(row.visits)}</td>
                  <td style={numberCellStyle}>{num(row.actionEvents)}</td>
                  <td style={numberCellStyle}>
                    {num(row.uniqueActionVisits)}
                  </td>
                  <td style={numberCellStyle}>{num(row.phoneClicks)}</td>
                  <td style={numberCellStyle}>
                    {num(row.naverTalkClicks)}
                  </td>
                  <td style={numberCellStyle}>
                    {num(row.onlineInquiryClicks)}
                  </td>
                  <td style={numberCellStyle}>
                    {num(row.submittedLeads)}
                  </td>
                  <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                    {kstTimestamp(row.lastVisitAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {attribution.reachedLimit ? (
        <p style={{ color: "#b45309", fontSize: 12 }}>
          조회 상한에 도달했습니다. 표시 수치는 일부 데이터일 수 있습니다.
        </p>
      ) : null}
    </section>
  );
}

const cellStyle = {
  padding: "11px 9px",
  borderBottom: "1px solid #f1f5f9",
  color: "#334155",
  verticalAlign: "top",
};

const numberCellStyle = {
  ...cellStyle,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};
