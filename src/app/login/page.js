"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, adminPassword }),
      });
      const result = await res.json().catch(() => null);

      if (!res.ok) {
        setMessage(
          result?.message || "아이디 또는 비밀번호가 올바르지 않습니다.",
        );
        return;
      }

      router.push("/admin");
    } catch {
      setMessage("로그인 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={wrapStyle}>
      <form onSubmit={handleLogin} style={boxStyle}>
        <h1 style={{ marginBottom: "24px" }}>관리자 로그인</h1>

        <input
          name="username"
          value={adminId}
          onChange={(e) => setAdminId(e.target.value)}
          placeholder="아이디"
          autoComplete="username"
          maxLength={128}
          required
          style={inputStyle}
        />

        <input
          name="password"
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          placeholder="비밀번호"
          autoComplete="current-password"
          maxLength={512}
          required
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle} disabled={isSubmitting}>
          {isSubmitting ? "확인 중..." : "로그인"}
        </button>

        {message && (
          <p
            role="alert"
            aria-live="polite"
            style={{ color: "#dc2626", fontWeight: "800" }}
          >
            {message}
          </p>
        )}
      </form>
    </main>
  );
}

const wrapStyle = {
  minHeight: "70vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px",
};

const boxStyle = {
  width: "360px",
  maxWidth: "100%",
  padding: "34px",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  boxShadow: "0 15px 35px rgba(15,23,42,0.12)",
};

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: "12px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  fontSize: "16px",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  padding: "14px",
  border: "none",
  borderRadius: "999px",
  background: "#1e3a8a",
  color: "white",
  fontWeight: "900",
  cursor: "pointer",
};
