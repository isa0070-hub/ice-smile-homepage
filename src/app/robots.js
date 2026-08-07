export default function robots() {
  return {
    rules: [
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: "https://www.ismileagain.co.kr/sitemap.xml",
  };
}
