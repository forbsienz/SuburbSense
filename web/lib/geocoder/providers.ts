import type { GeocodeHit } from "./types";

const NZ_BBOX = "166,-47,179,-34";
const USER_AGENT = "SuburbSense/0.1 (community safety; opendata)";

interface PhotonFeature {
  properties?: {
    name?: string;
    housenumber?: string;
    street?: string;
    locality?: string;
    district?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    countrycode?: string;
  };
  geometry?: { coordinates?: [number, number] };
}

function formatPhotonAddress(props: NonNullable<PhotonFeature["properties"]>): string {
  const line = [props.housenumber, props.street].filter(Boolean).join(" ");
  const locality = props.locality || props.district || props.suburb;
  const parts = [line, locality, props.city, props.postcode, props.country].filter(Boolean);
  return parts.join(", ");
}

function toHit(feature: PhotonFeature): GeocodeHit | null {
  const coords = feature.geometry?.coordinates;
  const props = feature.properties;
  if (!coords || !props || props.countrycode !== "NZ") return null;

  const district = props.district;
  const suburb = props.suburb;
  const locality = props.locality;
  const city = props.city;
  const territorialAuthority = props.county || city || props.state;

  return {
    lat: coords[1],
    lon: coords[0],
    formatted_address: formatPhotonAddress(props),
    suburb: district || suburb || locality,
    district,
    locality,
    city,
    territorial_authority: territorialAuthority,
  };
}

export async function searchPhoton(query: string): Promise<GeocodeHit[]> {
  const params = new URLSearchParams({
    q: query.includes("New Zealand") ? query : `${query}, New Zealand`,
    bbox: NZ_BBOX,
    limit: "6",
    lang: "en",
  });

  const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as { features?: PhotonFeature[] };
  const hits: GeocodeHit[] = [];
  for (const feature of data.features ?? []) {
    const hit = toHit(feature);
    if (hit) hits.push(hit);
  }
  return hits;
}

export async function searchNominatim(query: string): Promise<GeocodeHit[]> {
  const params = new URLSearchParams({
    q: query.includes("New Zealand") ? query : `${query}, New Zealand`,
    format: "json",
    addressdetails: "1",
    countrycodes: "nz",
    limit: "5",
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name?: string;
    address?: Record<string, string>;
  }>;

  return data.map((item) => {
    const addr = item.address ?? {};
    const suburb =
      addr.suburb || addr.neighbourhood || addr.quarter || addr.hamlet || addr.town;
    const ta = addr.county || addr.city_district || addr.municipality;

    return {
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      formatted_address: item.display_name ?? query,
      suburb,
      territorial_authority: ta,
    };
  });
}
