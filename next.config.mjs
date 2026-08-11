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
    ];
  },

  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 604800,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.ismileagain.co.kr",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
