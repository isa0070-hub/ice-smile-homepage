export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export const metadata = {
  title: "관리자 로그인 | 아이스마일어게인",
  description: "아이스마일어게인 관리자 전용 로그인 페이지입니다.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function LoginLayout({ children }) {
  return children;
}
