const DEFAULT_BASE_URL = "https://www.ismileagain.co.kr";

export function toAbsoluteRepairCaseImageUrl(
  value = "",
  baseUrl = DEFAULT_BASE_URL,
) {
  const url = String(value || "").trim();

  if (!url) return "";
  if (/^https?:\/\//iu.test(url)) return url;

  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function getUniqueRepairCaseImageUrls(
  representativeUrl = "",
  detailImages = [],
  baseUrl = DEFAULT_BASE_URL,
) {
  return Array.from(
    new Set(
      [
        representativeUrl,
        ...detailImages.map((image) => image?.image_url),
      ]
        .map((url) => toAbsoluteRepairCaseImageUrl(url, baseUrl))
        .filter(Boolean),
    ),
  );
}

export function findRepresentativeDetailImage(
  representativeUrl = "",
  detailImages = [],
  baseUrl = DEFAULT_BASE_URL,
) {
  const normalizedRepresentative = toAbsoluteRepairCaseImageUrl(
    representativeUrl,
    baseUrl,
  );

  if (!normalizedRepresentative) return null;

  return (
    detailImages.find(
      (image) =>
        toAbsoluteRepairCaseImageUrl(image?.image_url, baseUrl) ===
        normalizedRepresentative,
    ) || null
  );
}
