import { searchPhoton } from "@/lib/geocoder/providers";

export interface AddressCompletion {
  address: string;
  pxid: string;
  lat?: number;
  lon?: number;
  suburb?: string;
  district?: string;
  locality?: string;
  city?: string;
  territorial_authority?: string;
  source: "addressfinder" | "photon";
}

async function searchAddressfinder(
  query: string,
  key: string,
): Promise<AddressCompletion[]> {
  const params = new URLSearchParams({ key, q: query, format: "json" });
  const res = await fetch(
    `https://api.addressfinder.io/api/nz/address/autocomplete?${params}`,
    { next: { revalidate: 300 } },
  );

  if (!res.ok) {
    throw new Error("Addressfinder autocomplete failed.");
  }

  const data = (await res.json()) as {
    completions?: Array<{ a: string; pxid: string }>;
    success?: boolean;
    message?: string;
  };

  if (data.success === false) {
    throw new Error(data.message ?? "Addressfinder autocomplete failed.");
  }

  return (data.completions ?? []).map((c) => ({
    address: c.a,
    pxid: c.pxid,
    source: "addressfinder" as const,
  }));
}

async function searchPhotonCompletions(query: string): Promise<AddressCompletion[]> {
  const hits = await searchPhoton(query);
  return hits.map((hit) => ({
    address: hit.formatted_address,
    pxid: `geo:${hit.lat}:${hit.lon}`,
    lat: hit.lat,
    lon: hit.lon,
    suburb: hit.suburb,
    district: hit.district,
    locality: hit.locality,
    city: hit.city,
    territorial_authority: hit.territorial_authority,
    source: "photon" as const,
  }));
}

export async function searchAddressCompletions(query: string): Promise<{
  completions: AddressCompletion[];
  source: "addressfinder" | "photon";
}> {
  const key = process.env.ADDRESSFINDER_KEY?.trim();

  if (key) {
    try {
      const completions = await searchAddressfinder(query, key);
      return { completions, source: "addressfinder" };
    } catch {
      // Fall back to Photon if Addressfinder is misconfigured or unavailable.
    }
  }

  const completions = await searchPhotonCompletions(query);
  return { completions, source: "photon" };
}
