export const metadata = {
  title: {
    absolute: "아이폰·아이패드·노트북 수리 온라인 문의 | 아이스마일어게인",
  },
  description:
    "강변·선릉·신도림 아이스마일어게인에 기기 모델명과 고장 증상을 남겨 주세요. 방문 또는 택배 접수 가능 여부와 부품 재고를 확인해 안내합니다.",
  alternates: {
    canonical: "https://www.ismileagain.co.kr/contact",
  },
  openGraph: {
    title: "스마트기기 수리 온라인 문의 | 아이스마일어게인",
    description:
      "기기 모델명과 증상을 남기면 강변·선릉·신도림 지점의 수리 가능 여부와 접수 방법을 안내합니다.",
    url: "https://www.ismileagain.co.kr/contact",
    siteName: "아이스마일어게인",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://www.ismileagain.co.kr/opengraph-image.jpg",
        alt: "아이스마일어게인 온라인 수리 문의",
      },
    ],
  },
};

export default function ContactLayout({ children }) {
  return children;
}
