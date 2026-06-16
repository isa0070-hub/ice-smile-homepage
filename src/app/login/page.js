"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId, adminPassword }),
    });

    if (!res.ok) {
      setMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    router.push("/admin");
  }

  return (
    <main style={wrapStyle}>
      <form onSubmit={handleLogin} style={boxStyle}>
        <h1 style={{ marginBottom: "24px" }}>관리자 로그인</h1>

        <input
          value={adminId}
          onChange={(e) => setAdminId(e.target.value)}
          placeholder="아이디"
          style={inputStyle}
        />

        <input
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          placeholder="비밀번호"
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle}>
          로그인
        </button>

        {message && <p style={{ color: "#dc2626", fontWeight: "800" }}>{message}</p>}
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