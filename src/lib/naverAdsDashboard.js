import {
  V2_CAMPAIGN_ID,
  combineNaverAdStats,
} from "./naverAdsReport.js";

export const NAVER_AD_SCOPES = Object.freeze({
  V2: "v2",
  OTHER: "other",
  ALL: "all",
});

const BRANCH_KEYS = [
  "seolleung",
  "gangbyeon",
  "shared",
];

function emptyStat() {
  return combineNaverAdStats();
}

export function filterNaverAdRows(
  rows = [],
  scope = NAVER_AD_SCOPES.V2
) {
  if (scope === NAVER_AD_SCOPES.ALL) {
    return [...rows];
  }

  if (scope === NAVER_AD_SCOPES.OTHER) {
    return rows.filter(
      (row) =>
        row.campaignId !== V2_CAMPAIGN_ID
    );
  }

  return rows.filter(
    (row) =>
      row.campaignId === V2_CAMPAIGN_ID
  );
}

export function summarizeNaverAdRows(rows = []) {
  return combineNaverAdStats(...rows);
}

export function buildNaverAdScopeSummary(
  rows = [],
  scope = NAVER_AD_SCOPES.V2
) {
  const details = filterNaverAdRows(
    rows,
    scope
  );

  const trackedRows = details.filter(
    (row) =>
      row.adType === "keyword" ||
      row.adType === "place"
  );

  const unclassifiedRows = details.filter(
    (row) =>
      row.adType !== "keyword" &&
      row.adType !== "place"
  );

  const branches = Object.fromEntries(
    BRANCH_KEYS.map((branch) => {
      const branchRows = trackedRows.filter(
        (row) => row.branch === branch
      );

      return [
        branch,
        {
          total: summarizeNaverAdRows(branchRows),
          keyword: summarizeNaverAdRows(
            branchRows.filter(
              (row) => row.adType === "keyword"
            )
          ),
          place: summarizeNaverAdRows(
            branchRows.filter(
              (row) => row.adType === "place"
            )
          ),
        },
      ];
    })
  );

  return {
    details,
    total: summarizeNaverAdRows(details),
    trackedTotal: summarizeNaverAdRows(
      trackedRows
    ),
    unclassified:
      unclassifiedRows.length > 0
        ? summarizeNaverAdRows(
            unclassifiedRows
          )
        : emptyStat(),
    branches,
  };
}
