import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ maxWidth: "900px", margin: "80px auto", padding: "24px" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "16px" }}>
        수리사례를 찾을 수 없습니다.
      </h1>

      <p style={{ fontSize: "17px", lineHeight: 1.7, color: "#475569" }}>
        요청하신 수리사례는 삭제되었거나 주소가 변경되었을 수 있습니다.
        아이폰, 아이패드, 맥북, 서피스, 레노버 수리사례는 전체 목록에서 다시 확인해 주세요.
      </p>

      <div style={{ marginTop: "28px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link
          href="/repair-cases"
          style={{
            display: "inline-block",
            padding: "14px 22px",
            background: "#0f172a",
            color: "white",
            borderRadius: "999px",
            textDecoration: "none",
            fontWeight: "800",
          }}
        >
          수리사례 전체 보기
        </Link>

        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "14px 22px",
            background: "#f1f5f9",
            color: "#0f172a",
            borderRadius: "999px",
            textDecoration: "none",
            fontWeight: "800",
          }}
        >
          홈페이지로 이동
        </Link>
      </div>
    </main>
  );
}