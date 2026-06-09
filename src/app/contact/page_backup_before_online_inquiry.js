"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    branch: "강변점",
    device: "",
    model: "",
    symptom: "",
    visit_type: "방문수리",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("contacts").insert([form]);

    if (error) {
      setMessage("접수 중 오류가 발생했습니다. 다시 확인해주세요.");
      console.error(error);
    } else {
      setMessage("접수가 완료되었습니다. 빠르게 확인 후 연락드리겠습니다.");
      setForm({
        name: "",
        phone: "",
        branch: "강변점",
        device: "",
        model: "",
        symptom: "",
        visit_type: "방문수리",
      });
    }

    setLoading(false);
  };

  return (
    <main style={{ padding: "80px 24px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "42px", marginBottom: "16px" }}>온라인 접수</h1>

      <p style={{ fontSize: "18px", lineHeight: 1.8, marginBottom: "34px" }}>
        수리받으실 기기와 증상을 남겨주시면 담당자가 확인 후 빠르게
        안내드립니다. 방문수리와 택배수리 모두 접수 가능합니다.
      </p>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>이름</label>
        <input
          style={inputStyle}
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <label style={labelStyle}>연락처</label>
        <input
          style={inputStyle}
          name="phone"
          value={form.phone}
          onChange={handleChange}
          required
        />

        <label style={labelStyle}>희망 지점</label>
        <select
          style={inputStyle}
          name="branch"
          value={form.branch}
          onChange={handleChange}
        >
          <option>강변점</option>
          <option>선릉점</option>
          <option>신도림점</option>
        </select>

        <label style={labelStyle}>기기 종류</label>
        <select
          style={inputStyle}
          name="device"
          value={form.device}
          onChange={handleChange}
          required
        >
          <option value="">선택해주세요</option>
          <option>아이폰</option>
          <option>아이패드</option>
          <option>맥북</option>
          <option>애플워치</option>
          <option>마이크로소프트 서피스</option>
          <option>레노버 노트북</option>
          <option>LG그램</option>
          <option>삼성 노트북</option>
          <option>기타</option>
        </select>

        <label style={labelStyle}>모델명</label>
        <input
          style={inputStyle}
          name="model"
          value={form.model}
          onChange={handleChange}
          placeholder="예: 아이폰14프로, 서피스프로7, LG그램 15Z..."
        />

        <label style={labelStyle}>고장 증상</label>
        <textarea
          style={{ ...inputStyle, minHeight: "130px" }}
          name="symptom"
          value={form.symptom}
          onChange={handleChange}
          placeholder="액정파손, 배터리 빨리 소모, 전원불량 등"
          required
        />

        <label style={labelStyle}>접수 방식</label>
        <select
          style={inputStyle}
          name="visit_type"
          value={form.visit_type}
          onChange={handleChange}
        >
          <option>방문수리</option>
          <option>택배수리</option>
        </select>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "접수 중..." : "접수하기"}
        </button>

        {message && <p style={{ marginTop: "20px", fontWeight: "700" }}>{message}</p>}
      </form>
    </main>
  );
}

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  background: "#f8fafc",
  padding: "30px",
  borderRadius: "18px",
  border: "1px solid #e5e7eb",
};

const labelStyle = {
  fontWeight: "800",
  marginTop: "10px",
};

const inputStyle = {
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "16px",
};

const buttonStyle = {
  marginTop: "22px",
  padding: "16px",
  border: "none",
  borderRadius: "999px",
  background: "#1e3a8a",
  color: "white",
  fontSize: "17px",
  fontWeight: "900",
  cursor: "pointer",
};