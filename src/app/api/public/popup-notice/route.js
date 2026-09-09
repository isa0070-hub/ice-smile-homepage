import { getActivePublicPopupNotice } from "@/lib/publicPopupNotice";

const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, nosnippet",
};

const ERROR_CACHE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, nosnippet",
};

export async function GET() {
  try {
    const popup = await getActivePublicPopupNotice();

    return Response.json(
      { popup },
      {
        headers: PUBLIC_CACHE_HEADERS,
      },
    );
  } catch (error) {
    console.error("public popup notice error:", error);

    return Response.json(
      { popup: null },
      {
        status: 503,
        headers: ERROR_CACHE_HEADERS,
      },
    );
  }
}
