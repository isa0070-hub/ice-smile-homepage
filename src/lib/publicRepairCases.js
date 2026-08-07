const UNSAFE_PATH_CHARACTERS = /[\/\\%?#\u0000-\u001f\u007f]/;

export function isPublicRepairCaseSlug(value) {
  if (typeof value !== "string") {
    return false;
  }

  const slug = value.trim();

  return (
    slug.length > 0 &&
    slug.length <= 160 &&
    slug === value &&
    slug !== "." &&
    slug !== ".." &&
    !UNSAFE_PATH_CHARACTERS.test(slug)
  );
}

export function decodePublicRepairCaseSlug(value) {
  try {
    const slug = decodeURIComponent(String(value || ""));
    return isPublicRepairCaseSlug(slug) ? slug : "";
  } catch {
    return "";
  }
}

export function getPublicRepairCasePath(slug) {
  if (!isPublicRepairCaseSlug(slug)) {
    return "";
  }

  return `/repair-cases/${encodeURIComponent(slug)}`;
}
