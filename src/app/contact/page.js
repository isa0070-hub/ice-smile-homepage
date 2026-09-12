"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import InquiryForm from "@/components/InquiryForm"

const BRANCH_PREFILLS = Object.freeze({
  gangbyeon: "강변점",
  seolleung: "선릉점",
  sindorim: "신도림점",
})

const DEVICE_PREFILLS = Object.freeze({
  iphone: "아이폰",
  ipad: "아이패드",
  macbook: "맥북",
  surface: "서피스",
  lenovo: "레노버",
})

function getAllowedPrefill(prefills, value) {
  if (typeof value !== "string") return ""
  return prefills[value.trim().toLowerCase()] || ""
}

function ContactFormFromQuery() {
  const searchParams = useSearchParams()
  const preferredBranch = getAllowedPrefill(
    BRANCH_PREFILLS,
    searchParams?.get("branch"),
  )
  const device = getAllowedPrefill(
    DEVICE_PREFILLS,
    searchParams?.get("device"),
  )

  return (
    <InquiryForm
      key={`${preferredBranch}:${device}`}
      formLocation="contact_page"
      idPrefix="contact"
      initialPreferredBranch={preferredBranch}
      initialDevice={device}
    />
  )
}

export default function ContactPage() {
  return (
    <main style={styles.page}>
      <section style={styles.box}>
        <Link href="/" style={styles.backButton}>
          ← 홈페이지로 돌아가기
        </Link>

        <p style={styles.eyebrow}>사진 없이도 바로 접수</p>
        <h1 style={styles.title}>30초 온라인 수리 문의</h1>
        <p style={styles.desc}>
          성함·연락처·증상만 남기면 강변점·선릉점·신도림점에서 확인 후 연락드립니다.
        </p>

        <Suspense fallback={<p style={styles.loading}>문의 양식을 불러오는 중입니다.</p>}>
          <ContactFormFromQuery />
        </Suspense>
      </section>
    </main>
  )
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f4f8fc", padding: "42px 20px 64px" },
  box: {
    maxWidth: "680px", margin: "0 auto", backgroundColor: "#fff",
    border: "1px solid #e2e8f0", borderRadius: "28px",
    padding: "clamp(22px, 5vw, 34px)", boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
  },
  eyebrow: { margin: "0 0 8px", color: "#2563eb", fontWeight: 900, fontSize: "14px" },
  title: {
    fontSize: "clamp(32px, 7vw, 42px)", lineHeight: 1.2, fontWeight: 900,
    margin: "0 0 10px", wordBreak: "keep-all",
  },
  desc: { color: "#64748b", lineHeight: 1.7, marginBottom: "22px", wordBreak: "keep-all" },
  loading: { padding: "24px 0", color: "#64748b" },
  backButton: {
    display: "inline-block", marginBottom: "18px", color: "#1d4ed8",
    fontWeight: 900, textDecoration: "none",
  },
}
