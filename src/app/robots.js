export default function robots() {
    return {
      rules: [
        {
          userAgent: "*",
          allow: "/",
        },
      ],
  
      sitemap: "https://www.ismileagain.co.kr/sitemap.xml",
    };
  }