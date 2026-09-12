"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  trackGoogleInquiryEvent,
  trackGoogleLead,
} from "@/components/GoogleAnalyticsTracker";
import { trackNaverLead } from "@/components/NaverConversionTracker";
import {
  createInquirySubmissionToken,
  submitOnlineInquiry,
} from "@/lib/inquiryClient";

const INITIAL_FORM = {
  customer_name: "",
  phone: "",
  device: "",
  model: "",
  symptom: "",
  preferred_branch: "강변점",
  contact_time: "",
  memo: "",
  website: "",
  privacy_consent: false,
  telegram_consent: false,
};

export default function InquiryForm({
  formLocation = "contact_page",
  idPrefix = "contact",
  autoFocus = false,
  initialPreferredBranch = "",
  initialDevice = "",
  onSubmitted,
}) {
  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    preferred_branch:
      initialPreferredBranch || INITIAL_FORM.preferred_branch,
    device: initialDevice || INITIAL_FORM.device,
  }));
  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef(null);
  const submissionTokenRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    trackGoogleInquiryEvent("inquiry_form_view", {
      formLocation,
    });

    if (autoFocus) {
      nameInputRef.current?.focus();
    }
  }, [autoFocus, formLocation]);

  const markStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;

    trackGoogleInquiryEvent("inquiry_form_start", {
      formLocation,
      preferredBranch: form.preferred_branch,
    });
  };

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    markStarted();

    if (!form.customer_name.trim()) return alert("성함을 입력해 주세요.");
    if (!form.phone.trim()) return alert("연락처를 입력해 주세요.");
    if (!form.symptom.trim()) return alert("증상을 입력해 주세요.");
    if (!form.privacy_consent) return alert("개인정보 수집·이용에 동의해 주세요.");
    if (!form.telegram_consent) {
      return alert("수리 상담 및 접수 알림을 위한 개인정보 처리에 동의해 주세요.");
    }

    setLoading(true);

    if (!submissionTokenRef.current) {
      submissionTokenRef.current = createInquirySubmissionToken();
    }

    try {
      const result = await submitOnlineInquiry(
        form,
        submissionTokenRef.current
      );

      if (result?.inserted === true) {
        await Promise.all([
          trackNaverLead(),
          trackGoogleLead({
            formLocation,
            preferredBranch: form.preferred_branch,
          }),
        ]);
      }

      alert("온라인 접수가 완료되었습니다. 확인 후 연락드리겠습니다.");

      if (onSubmitted) {
        onSubmitted();
      } else {
        window.location.assign("/");
      }
    } catch (error) {
      alert(error?.message || "온라인 접수 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fieldId = (name) => `${idPrefix}-${name}`;

  return (
    <form
      method="post"
      onSubmit={handleSubmit}
      onFocusCapture={markStarted}
      style={styles.form}
    >
      <p style={styles.quickNote}>
        입력 항목은 성함·연락처·증상 세 가지입니다. 사진 없이도 접수할 수 있어요.
      </p>

      <label htmlFor={fieldId("name")} style={styles.label}>
        성함 <span aria-hidden="true">*</span>
      </label>
      <input
        ref={nameInputRef}
        id={fieldId("name")}
        name="customer_name"
        value={form.customer_name}
        onChange={handleChange}
        placeholder="성함"
        autoComplete="name"
        required
        maxLength={40}
        style={styles.input}
      />

      <label htmlFor={fieldId("phone")} style={styles.label}>
        연락처 <span aria-hidden="true">*</span>
      </label>
      <input
        id={fieldId("phone")}
        type="tel"
        inputMode="tel"
        name="phone"
        value={form.phone}
        onChange={handleChange}
        placeholder="010-0000-0000"
        autoComplete="tel"
        required
        maxLength={30}
        style={styles.input}
      />

      <label htmlFor={fieldId("branch")} style={styles.label}>
        희망 지점
      </label>
      <select
        id={fieldId("branch")}
        name="preferred_branch"
        value={form.preferred_branch}
        onChange={handleChange}
        style={styles.input}
      >
        <option>강변점</option>
        <option>선릉점</option>
        <option>신도림점</option>
      </select>

      <label htmlFor={fieldId("symptom")} style={styles.label}>
        고장 증상 또는 문의 내용 <span aria-hidden="true">*</span>
      </label>
      <textarea
        id={fieldId("symptom")}
        name="symptom"
        value={form.symptom}
        onChange={handleChange}
        placeholder="예: 아이폰 카메라 초점이 흔들려요."
        required
        maxLength={2000}
        style={styles.textarea}
      />

      <details style={styles.optionalDetails}>
        <summary style={styles.optionalSummary}>
          기종·모델명·연락 시간 더 적기 (선택)
        </summary>
        <div style={styles.optionalFields}>
          <label htmlFor={fieldId("device")} style={styles.label}>기기 종류</label>
          <input
            id={fieldId("device")}
            name="device"
            value={form.device}
            onChange={handleChange}
            placeholder="예: 아이폰, 아이패드, 맥북, 서피스"
            maxLength={80}
            style={styles.input}
          />

          <label htmlFor={fieldId("model")} style={styles.label}>모델명</label>
          <input
            id={fieldId("model")}
            name="model"
            value={form.model}
            onChange={handleChange}
            placeholder="예: 아이폰 15 프로"
            maxLength={100}
            style={styles.input}
          />

          <label htmlFor={fieldId("time")} style={styles.label}>연락 가능 시간</label>
          <input
            id={fieldId("time")}
            name="contact_time"
            value={form.contact_time}
            onChange={handleChange}
            placeholder="예: 오후 2시 이후"
            maxLength={80}
            style={styles.input}
          />

          <label htmlFor={fieldId("memo")} style={styles.label}>추가 메모</label>
          <textarea
            id={fieldId("memo")}
            name="memo"
            value={form.memo}
            onChange={handleChange}
            placeholder="추가로 전달할 내용"
            maxLength={1000}
            style={styles.textareaSmall}
          />
        </div>
      </details>

      <div aria-hidden="true" style={styles.honeypot}>
        <label htmlFor={fieldId("website")}>웹사이트</label>
        <input
          id={fieldId("website")}
          name="website"
          value={form.website}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <label style={styles.consentLabel}>
        <input
          type="checkbox"
          name="privacy_consent"
          checked={form.privacy_consent}
          onChange={handleChange}
          required
        />
        <span>
          <Link href="/privacy" target="_blank" rel="noreferrer">개인정보처리방침</Link>의
          수집·이용 내용에 동의합니다. <span aria-hidden="true">*</span>
        </span>
      </label>

      <label style={styles.consentLabel}>
        <input
          type="checkbox"
          name="telegram_consent"
          checked={form.telegram_consent}
          onChange={handleChange}
          required
        />
        <span>
          접수 정보가 상담 담당자의 Telegram 업무 알림으로 전달되어 수리 상담·접수에만
          사용되는 것에 동의합니다. {" "}
          <Link href="/privacy#telegram-transfer" target="_blank" rel="noreferrer">자세히 보기</Link>
          {" "}<span aria-hidden="true">*</span>
        </span>
      </label>

      <p style={styles.consentHelp}>
        접수 정보는 수리 상담 및 접수 처리 외에는 사용하지 않습니다.
      </p>

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        style={styles.button}
      >
        {loading ? "접수 중..." : "30초 온라인 접수하기"}
      </button>
    </form>
  );
}

const styles = {
  form: { display: "grid", gap: "10px" },
  quickNote: {
    margin: "0 0 4px", padding: "12px 14px", borderRadius: "12px",
    background: "#eff6ff", color: "#1e3a8a", fontSize: "14px",
    fontWeight: 800, lineHeight: 1.55,
  },
  label: { color: "#334155", fontSize: "14px", fontWeight: 800, marginTop: "4px" },
  input: {
    width: "100%", padding: "13px", border: "1px solid #cbd5e1",
    borderRadius: "13px", fontSize: "16px", background: "#fff", color: "#111827",
  },
  textarea: {
    width: "100%", minHeight: "112px", padding: "13px", border: "1px solid #cbd5e1",
    borderRadius: "13px", fontSize: "16px", background: "#fff", color: "#111827",
  },
  textareaSmall: {
    width: "100%", minHeight: "78px", padding: "13px", border: "1px solid #cbd5e1",
    borderRadius: "13px", fontSize: "16px",
  },
  optionalDetails: {
    marginTop: "4px", padding: "12px 14px", border: "1px solid #dbeafe",
    borderRadius: "13px", background: "#f8fafc",
  },
  optionalSummary: { color: "#1d4ed8", fontSize: "14px", fontWeight: 900, cursor: "pointer" },
  optionalFields: { display: "grid", gap: "10px", paddingTop: "12px" },
  honeypot: {
    position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden",
  },
  consentLabel: {
    display: "flex", alignItems: "flex-start", gap: "10px", color: "#334155",
    fontSize: "14px", lineHeight: 1.6,
  },
  consentHelp: { margin: "-4px 0 2px 30px", color: "#64748b", fontSize: "12px", lineHeight: 1.5 },
  button: {
    padding: "15px", border: "none", borderRadius: "14px", background: "#1d4ed8",
    color: "#fff", fontWeight: 900, fontSize: "16px", cursor: "pointer",
  },
};
