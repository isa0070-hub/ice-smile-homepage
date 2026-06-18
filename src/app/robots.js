export default function robots() {
    return {
      rules: [
        {
          userAgent: "*",
          allow: "/",
        },
      ],
  
      sitemap: "https://ismileagain.co.kr/sitemap.xml",
    };
  }