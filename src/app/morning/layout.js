import "./morning-isolation.css";
import MorningShell from "./components/MorningShell";

export const metadata = {
  title: "굿모닝 아침 필수노트 | 아이스마일어게인",
  description:
    "뉴스, 날씨, 환율, 증시와 오늘의 흐름을 연결해 알려주는 AI 아침 브리핑",
  alternates: {
    canonical: "/morning",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function MorningLayout({ children }) {
  return <MorningShell>{children}</MorningShell>;
}
