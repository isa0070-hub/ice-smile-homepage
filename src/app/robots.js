export default function robots() {
    return {
      rules: [
        {
          userAgent: "*",
          allow: "/",
        },
      ],
  
      sitemap: "https://www.icesmileagain.com/sitemap.xml",
    };
  }