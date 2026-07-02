import "./morning-isolation.css";
import MorningShell from "./components/MorningShell";

export const metadata = {
  title: "굿모닝 아침 필수노트",
  description:
    "뉴스, 날씨, 환율, 증시와 오늘의 흐름을 연결해 알려주는 AI 아침 브리핑",
};

export default function MorningLayout({ children }) {
  return <MorningShell>{children}</MorningShell>;
}