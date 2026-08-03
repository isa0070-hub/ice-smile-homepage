/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
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
