export const V2_CAMPAIGN_ID =
  "cmp-a001-01-000000011180345";

export const V2_SHARED_ADGROUPS = new Map([
  ["grp-a001-01-000000074574869", "아이폰 일반수리"],
  ["grp-a001-01-000000074574872", "서피스 일반수리"],
  ["grp-a001-01-000000074574879", "아이패드 일반수리"],
  ["grp-a001-01-000000074574882", "맥북 일반수리"],
  ["grp-a001-01-000000074574883", "애플워치 일반수리"],
]);

export function classifyNaverAdgroup(account, group) {
  if (account === "main") {
    if (group.campaignType === "PLACE") {
      return { branch: "gangbyeon", adType: "place" };
    }

    if (
      group.campaignId === V2_CAMPAIGN_ID &&
      V2_SHARED_ADGROUPS.has(group.id)
    ) {
      return { branch: "shared", adType: "keyword" };
    }

    if (
      group.name.includes("강변") ||
      group.campaignName.includes("강변")
    ) {
      return { branch: "gangbyeon", adType: "keyword" };
    }

    if (
      group.name.includes("선릉") ||
      group.campaignName === "파워링크#1"
    ) {
      return { branch: "seolleung", adType: "keyword" };
    }
  }

  if (account === "seolleung") {
    if (group.campaignType === "PLACE") {
      return { branch: "seolleung", adType: "place" };
    }

    return { branch: "seolleung", adType: "other" };
  }

  return { branch: "unknown", adType: "other" };
}

export function sameNaverAdStat(a, b) {
  return (
    a.impressions === b.impressions &&
    a.clicks === b.clicks &&
    a.cost === b.cost &&
    a.conversions === b.conversions
  );
}

export function combineNaverAdStats(...stats) {
  const combined = {
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversions: 0,
    avgCpc: 0,
  };

  for (const stat of stats) {
    combined.impressions += Number(stat?.impressions || 0);
    combined.clicks += Number(stat?.clicks || 0);
    combined.cost += Number(stat?.cost || 0);
    combined.conversions += Number(stat?.conversions || 0);
  }

  combined.avgCpc = combined.clicks
    ? Math.round(combined.cost / combined.clicks)
    : 0;

  return combined;
}
