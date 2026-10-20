const PAID_CHANNELS = new Set([
  "Paid Search",
  "Cross-network",
  "Display",
  "Paid Social",
  "Paid Video",
  "Paid Shopping",
  "Other Advertising",
]);

const PAID_MEDIUMS = new Set([
  "cpc",
  "ppc",
  "paid",
  "paidsearch",
  "paid_search",
  "display",
  "cpm",
  "cpv",
  "cpa",
]);

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

export function isOrganicTraffic(channel, medium) {
  return channel === "Organic Search" || normalize(medium) === "organic";
}

export function isPaidTraffic(channel, medium) {
  return PAID_CHANNELS.has(channel) || PAID_MEDIUMS.has(normalize(medium));
}

export function classifyPortal(source = "") {
  const normalizedSource = normalize(source);

  if (normalizedSource.includes("naver")) return "naver";
  if (normalizedSource.includes("google")) return "google";
  return "other";
}

export function classifyPaidPortal({
  source = "",
  channel = "",
  medium = "",
}) {
  const normalizedSource = normalize(source);

  if (
    normalizedSource.includes("naver") &&
    isPaidTraffic(channel, medium)
  ) {
    return "naver";
  }

  if (
    normalizedSource.includes("google") &&
    channel === "Paid Search"
  ) {
    return "google";
  }

  return "other";
}
