export type { AddressSearchResult, GeocodeHit, Geocoder } from "./types";
export { resolveAddressSearch } from "./resolve";

/** @deprecated Use resolveAddressSearch via /api/address-search */
export const geocoder = {
  async search(query: string) {
    const { resolveAddressSearch } = await import("./resolve");
    const results = await resolveAddressSearch(query);
    const first = results[0];
    if (!first) return null;
    return {
      lat: 0,
      lon: 0,
      areaUnitSlug: first.slug,
    };
  },
};
