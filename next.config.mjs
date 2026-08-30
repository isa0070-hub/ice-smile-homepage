/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/m/home.html",
        destination: "/branches/gangbyeon",
        statusCode: 301,
      },
      {
        source: "/store/store_gb.asp",
        destination: "/branches/gangbyeon",
        statusCode: 301,
      },
      {
        source: "/store/store_agj.asp",
        destination: "/branches",
        statusCode: 301,
      },
      {
        source: "/main.asp",
        destination: "/",
        statusCode: 301,
      },
      {
        source:
          "/repair-cases/%EA%B1%B4%EA%B5%AD%EB%8C%80%ED%95%99%EA%B5%90-%EC%95%84%EC%9D%B4%ED%8C%A8%EB%93%9C%EC%88%98%EB%A6%AC-%EA%B3%84%EB%8B%A8-%EA%B9%A8%EC%A7%84-%EC%95%84%EC%9D%B4%ED%8C%A8%EB%93%9C-%ED%94%84%EB%A1%9C-%EC%95%A1%EC%A0%95%EA%B5%90%EC%B2%B4-%EB%8B%B9%EC%9D%BC%EC%88%98%EB%A6%AC",
        destination:
          "/repair-cases/아이패드프로-129-액정수리-3세대",
        statusCode: 301,
      },
      {
        source:
          "/repair-cases/iphone-battery-replacement-battery-replacement",
        destination: "/repair-services/iphone",
        statusCode: 301,
      },
      {
        source:
          "/repair-cases/%EC%84%A0%EB%A6%89%EC%97%AD-%EB%85%B8%ED%8A%B8%EB%B6%81%EC%88%98%EB%A6%AC-%EB%A0%88%EB%85%B8%EB%B2%84%EB%85%B8%ED%8A%B8%EB%B6%81-%EC%95%A1%EC%A0%95-%ED%8C%8C%EC%86%90-%EB%8B%B9%EC%9D%BC-%EA%B5%90%EC%B2%B4-%EC%88%98%EB%A6%AC-%EC%99%84%EB%B2%BD-%EB%B3%B5%EC%9B%90-%ED%83%9D%EB%B0%B0-%EC%88%98%EB%A6%AC-%EA%B0%80%EB%8A%A5",
        destination:
          "/repair-cases/레노버노트북-액정파손교체수리",
        statusCode: 301,
      },
      {
        source:
          "/repair-cases/%EC%84%A0%EB%A6%89%EC%97%AD-%EC%95%84%EC%9D%B4%ED%8C%A8%EB%93%9C%EC%88%98%EB%A6%AC-%EC%95%84%EC%9D%B4%ED%8C%A8%EB%93%9C-%ED%94%84%EB%A1%9C-129%EC%9D%B8%EC%B9%98-5%EC%84%B8%EB%8C%80-%EC%95%A1%EC%A0%95-%EC%9C%A0%EB%A6%AC-%ED%8C%8C%EC%86%90-%EB%8B%B9%EC%9D%BC-%EA%B5%90%EC%B2%B4-%ED%83%9D%EB%B0%B0-%EA%B0%80%EB%8A%A5",
        destination:
          "/repair-cases/아이패드프로-129-5세대-유리파손-액정교체",
        statusCode: 301,
      },
    ];
  },

  images: {
    formats: ["image/webp"],
    qualities: [75],
    minimumCacheTTL: 2678400,
    // Repair photos are served directly by SiteImage. Keeping remotePatterns
    // empty prevents old or hand-crafted URLs from consuming Vercel transforms.
  },
};

export default nextConfig;
