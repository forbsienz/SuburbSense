import { readFile } from "fs/promises";
import path from "path";

import { getAreas } from "@/lib/data";
import {
  dedupeResults,
  matchGeocodeToArea,
  matchMeshblockToArea,
  searchAreasByName,
} from "@/lib/geocoder/match-area";
import { searchNominatim, searchPhoton } from "@/lib/geocoder/providers";
import type { AddressSearchResult } from "@/lib/geocoder/types";

const DATA_DIR = path.join(process.cwd(), "public", "data");

type MeshblockEntry = { slug: string; display_name: string; has_brief: boolean };

let meshblockCache: Record<string, MeshblockEntry> | null = null;

async function getMeshblockLookup(): Promise<Record<string, MeshblockEntry>> {
  if (meshblockCache) return meshblockCache;
  try {
    const raw = await readFile(path.join(DATA_DIR, "meshblock_to_area.json"), "utf-8");
    meshblockCache = JSON.parse(raw) as Record<string, MeshblockEntry>;
    return meshblockCache;
  } catch {
    meshblockCache = {};
    return meshblockCache;
  }
}

async function searchAddressfinder(
  query: string,
): Promise<AddressSearchResult[]> {
  const key = process.env.ADDRESSFINDER_KEY;
  if (!key) return [];

  const params = new URLSearchParams({ key, q: query, format: "json" });
  const autoRes = await fetch(
    `https://api.addressfinder.io/api/nz/address/autocomplete?${params}`,
    { next: { revalidate: 3600 } },
  );
  if (!autoRes.ok) return [];

  const auto = (await autoRes.json()) as {
    completions?: Array<{ pxid: string; a: string }>;
  };
  const completion = auto.completions?.[0];
  if (!completion) return [];

  const metaParams = new URLSearchParams({
    key,
    pxid: completion.pxid,
    format: "json",
    census: "2023",
  });
  const metaRes = await fetch(
    `https://api.addressfinder.io/api/nz/address/metadata?${metaParams}`,
    { next: { revalidate: 3600 } },
  );
  if (!metaRes.ok) return [];

  const meta = (await metaRes.json()) as { meshblock?: string; success?: boolean };
  if (!meta.success || !meta.meshblock) return [];

  const lookup = await getMeshblockLookup();
  const matched = matchMeshblockToArea(meta.meshblock, lookup, completion.a);
  return matched ? [matched] : [];
}

export async function resolveAddressSearch(query: string): Promise<AddressSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const areas = await getAreas();
  const results: AddressSearchResult[] = [];

  // Official address API when configured (returns meshblock).
  results.push(...(await searchAddressfinder(trimmed)));

  // Direct suburb / area name match.
  results.push(...searchAreasByName(trimmed, areas));

  // Geocode via Photon, then Nominatim fallback.
  const photonHits = await searchPhoton(trimmed);
  for (const hit of photonHits) {
    const matched = matchGeocodeToArea(hit, areas);
    if (matched) results.push(matched);
  }

  if (results.length === 0) {
    const nominatimHits = await searchNominatim(trimmed);
    for (const hit of nominatimHits) {
      const matched = matchGeocodeToArea(hit, areas);
      if (matched) results.push(matched);
    }
  }

  return dedupeResults(results).slice(0, 5);
}
