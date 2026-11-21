/** NZ bounding box (approx) for validating map pins and geocode hits. */
export const NZ_BBOX = {
  minLon: 166,
  minLat: -47,
  maxLon: 179,
  maxLat: -34,
};

export function isInNzBbox(lat: number, lon: number): boolean {
  return (
    lon >= NZ_BBOX.minLon &&
    lon <= NZ_BBOX.maxLon &&
    lat >= NZ_BBOX.minLat &&
    lat <= NZ_BBOX.maxLat
  );
}

/** Parse `geo:lat:lon` references from Photon autocomplete. */
export function parseGeoPxid(pxid: string): { lat: number; lon: number } | null {
  if (!pxid.startsWith("geo:")) return null;
  const parts = pxid.split(":");
  if (parts.length !== 3) return null;
  const lat = parseFloat(parts[1]);
  const lon = parseFloat(parts[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

/** Addressfinder opaque IDs — reject obvious injection / garbage. */
export function isAddressfinderPxid(pxid: string): boolean {
  return pxid.length > 0 && pxid.length <= 200 && /^[A-Za-z0-9._-]+$/.test(pxid);
}

export function clipDisplayText(value: string, max = 120): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}
