"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    const { data } = await supabase
      .from("admins")
      .select("*")
      .eq("userid", userid)
      .eq("password", password)
      .single();

    if (!data) {
      alert("로그인 실패");
      return;
    }

    localStorage.setItem("admin", "true");
    router.push("/admin");
  }

  return (
    <main style={{ maxWidth: "420px", margin: "120px auto", padding: "20px" }}>
      <h1 style={{ marginBottom: "24px" }}>관리자 로그인</h1>

      <input
        placeholder="아이디"
        value={userid}
        onChange={(e) => setUserid(e.target.value)}
        style={inputStyle}
      />

      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />

      <button onClick={login} style={buttonStyle}>
        로그인
      </button>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: "12px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  fontSize: "16px",
};

const buttonStyle = {
  width: "100%",
  padding: "15px",
  background: "#1e3a8a",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "16px",
  fontWeight: "800",
  cursor: "pointer",
};