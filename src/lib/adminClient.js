export async function adminFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    cache: "no-store",
    ...options,
    credentials: "same-origin",
    headers,
  });
  const result = await response.json().catch(() => null);

  if (response.status === 401 && typeof window !== "undefined") {
    window.location.assign("/login");
  }

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message || `요청을 처리하지 못했습니다. (${response.status})`,
    );
  }

  return result;
}
