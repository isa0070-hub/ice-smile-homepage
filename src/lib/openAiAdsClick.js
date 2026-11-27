export function isSeolleungSurfaceInquiry(branch, device) {
  return branch === "선릉점" &&
    typeof device === "string" &&
    /서피스|\bsurface\b/i.test(device);
}

export function getOpenAiAdsClickReference(value) {
  if (
    typeof value !== "string" ||
    value === "preview_mock" ||
    !/^[A-Za-z0-9._~-]{1,510}={0,2}$/.test(value)
  ) {
    return "";
  }

  return value;
}
