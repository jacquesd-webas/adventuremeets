const regionCurrencyMap: Record<string, string> = {
  ZA: "ZAR",
  US: "USD",
  GB: "GBP",
  DE: "EUR",
  FR: "EUR",
  NG: "NGN",
  KE: "KES",
  IN: "INR",
  AU: "AUD"
};

export function getLocaleDefaults() {
  if (typeof navigator === "undefined") {
    return { countryCode: "ZA", currencyCode: "ZAR" };
  }
  const timeZoneToRegion: Record<string, string> = {
    "Africa/Johannesburg": "ZA"
  };
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZoneRegion = timeZoneToRegion[timeZone];

  const locales = navigator.languages?.length ? navigator.languages : [navigator.language || "en-ZA"];
  const languageRegion = locales
    .map((locale) => locale.replace("_", "-").split("-")[1])
    .find((region) => region && region.length === 2);
  const region = (timeZoneRegion || languageRegion || "ZA").toUpperCase();
  return {
    countryCode: region,
    currencyCode: regionCurrencyMap[region] || "ZAR"
  };
}
