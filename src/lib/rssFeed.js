import { getLegacyRepairCasePresentation } from "./legacyRepairCasePresentation.js";

// Keep enough headroom below Naver Search Advisor's 10 MB RSS limit for
// response headers and any small channel-level additions made in the future.
export const RSS_MAX_BYTES = 9_500_000;

export function cleanRssText(value) {
  return String(value || "")
    // XML 1.0 does not allow these control characters. Removing them before
    // escaping keeps administrator-entered repair notes from breaking the feed.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeRssXml(value) {
  return cleanRssText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function getRepairCaseContentSectionTexts(value) {
  let sections = value;

  // Support jsonb, JSON strings and the older double-encoded/object-wrapped
  // shapes already accepted by the public repair-case page.
  for (let parseCount = 0; parseCount < 3; parseCount += 1) {
    if (typeof sections !== "string") break;

    try {
      sections = JSON.parse(sections);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(sections) && sections && typeof sections === "object") {
    if (Array.isArray(sections.sections)) {
      sections = sections.sections;
    } else if (Array.isArray(sections.content_sections)) {
      sections = sections.content_sections;
    } else {
      const values = Object.values(sections);
      sections = values.every(
        (section) => section && typeof section === "object",
      )
        ? values
        : [];
    }
  }

  if (!Array.isArray(sections)) return [];

  return sections
    .flatMap((section) => [section?.title, section?.content])
    .map(cleanRssText)
    .filter(Boolean);
}

export function makeRepairCaseRssDescription(item) {
  // Keep the feed body identical to the public repair-case presentation. The
  // detail page applies this cleanup to legacy marketing claims, known typos
  // and structured sections before visitors or crawlers see them.
  const presentation = getLegacyRepairCasePresentation(item || {});
  const identity = [item?.branch, item?.device, item?.model]
    .map(cleanRssText)
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);
  const symptom = cleanRssText(item?.symptom);
  const repairContent = cleanRssText(presentation.repairContent);
  const sectionTexts = getRepairCaseContentSectionTexts(
    presentation.contentSections,
  );
  const fallbackTitle = cleanRssText(item?.title);

  const lead = identity.length > 0
    ? `${identity.join(" · ")} 수리사례입니다.`
    : "";
  const symptomText = symptom && !repairContent.includes(symptom)
    ? `접수 증상: ${symptom}.`
    : "";

  // Naver recommends publishing the complete item body in RSS. The actual
  // repair record therefore remains untruncated; the title is only a fallback
  // for an older record whose body is empty.
  return [
    lead,
    symptomText,
    repairContent || fallbackTitle,
    ...sectionTexts,
  ]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(" ");
}

export function getLatestRepairCaseRssDate(items, fallback = new Date()) {
  const latestTimestamp = (items || []).reduce((latest, item) => {
    const timestamps = [item?.updated_at, item?.created_at]
      .map((value) => new Date(value || "").getTime())
      .filter(Number.isFinite);

    return Math.max(latest, ...timestamps);
  }, 0);

  return latestTimestamp > 0 ? new Date(latestTimestamp) : fallback;
}

export function getUtf8ByteLength(value) {
  return new TextEncoder().encode(String(value || "")).byteLength;
}

export function joinRssItemsWithinBudget(renderedItems, byteBudget) {
  const accepted = [];
  let usedBytes = 0;

  for (const item of renderedItems) {
    const itemBytes = getUtf8ByteLength(item);

    // Keep every included item complete. When the feed ever approaches its
    // size limit, older items are dropped instead of truncating their bodies.
    if (usedBytes + itemBytes > byteBudget) {
      break;
    }

    accepted.push(item);
    usedBytes += itemBytes;
  }

  return accepted.join("");
}
