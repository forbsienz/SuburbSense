import type { AreaIndex } from "@/lib/types";
import type { AddressSearchResult, GeocodeHit } from "./types";

const SUBURB_ALIASES: Record<string, string[]> = {
  "city centre": ["auckland central"],
  "auckland cbd": ["auckland central"],
  cbd: ["auckland central"],
  "wynyard quarter": ["auckland central"],
  "victoria quarter": ["auckland central"],
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function expandLocationLabel(label: string): string[] {
  const base = normalize(label);
  const aliases = SUBURB_ALIASES[base] ?? [];
  return [base, ...aliases];
}

function locationCandidates(hit: GeocodeHit): string[] {
  const raw = [
    hit.suburb,
    hit.district,
    hit.locality,
    hit.city,
    hit.territorial_authority,
    hit.formatted_address,
  ].filter((value): value is string => Boolean(value?.trim()));

  const expanded = new Set<string>();
  for (const label of raw) {
    for (const part of label.split(/[,/]/)) {
      const trimmed = part.trim();
      if (trimmed.length < 3) continue;
      for (const candidate of expandLocationLabel(trimmed)) {
        expanded.add(candidate);
      }
    }
  }
  return [...expanded];
}

function taMatches(areaTa: string, candidate?: string): boolean {
  if (!candidate) return false;
  const a = normalize(areaTa);
  const c = normalize(candidate);
  return a === c || a.includes(c) || c.includes(a);
}

function suburbMatches(areaName: string, candidate?: string): boolean {
  if (!candidate) return false;
  const a = normalize(areaName);
  for (const c of expandLocationLabel(candidate)) {
    if (a === c) return true;
    if (a.includes(c) || c.includes(a)) return true;
    const aParts = a.split(/[-/]/).map((p) => p.trim());
    const cParts = c.split(/[-/]/).map((p) => p.trim());
    if (aParts.some((part) => cParts.includes(part) && part.length > 2)) return true;
  }
  return false;
}

function directionSuffixBonus(areaName: string, lon: number): number {
  const match = areaName.match(/^(.+)\s+(West|East|North|South)$/i);
  if (!match) return 0;
  const stem = normalize(match[1]);
  const dir = match[2].toLowerCase();

  const splitLon: Record<string, number> = {
    "auckland central": 174.764,
  };
  const pivot = splitLon[stem];
  if (pivot !== undefined) {
    if (dir === "west") return lon < pivot ? 8 : 0;
    if (dir === "east") return lon >= pivot ? 8 : 0;
  }

  if (dir === "west") return (180 - lon) * 0.02;
  if (dir === "east") return (lon - 170) * 0.02;
  return 0;
}

function scoreAreaNameMatch(query: string, area: AreaIndex): number {
  const q = normalize(query);
  const name = normalize(area.name);
  const display = normalize(area.display_name);
  const ta = normalize(area.ta_name);

  if (display === q || name === q) return 100;
  if (display.startsWith(q) || name.startsWith(q)) return 90;
  if (display.includes(q) || name.includes(q)) return 75;

  const tokens = q.split(/[,\s]+/).filter((t) => t.length > 2);
  if (tokens.length === 0) return 0;

  let matched = 0;
  for (const token of tokens) {
    if (name.includes(token) || display.includes(token) || ta.includes(token)) {
      matched += 1;
    }
  }
  return (matched / tokens.length) * 60;
}

export function searchAreasByName(
  query: string,
  areas: AreaIndex[],
  limit = 6,
): AddressSearchResult[] {
  const withBriefs = areas.filter((a) => a.has_brief);
  const scored = withBriefs
    .map((area) => ({ area, score: scoreAreaNameMatch(query, area) }))
    .filter((row) => row.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ area, score }) => ({
    slug: area.slug,
    display_name: area.display_name,
    has_brief: area.has_brief,
    matched_via: "area_name" as const,
    confidence: score >= 90 ? "high" : score >= 70 ? "medium" : "low",
  }));
}

export function matchGeocodeToArea(
  hit: GeocodeHit,
  areas: AreaIndex[],
): AddressSearchResult | null {
  const withBriefs = areas.filter((a) => a.has_brief);
  const candidates = locationCandidates(hit);

  let best: { area: AreaIndex; score: number } | null = null;

  for (const area of withBriefs) {
    let score = 0;

    for (const label of candidates) {
      if (suburbMatches(area.name, label)) score += 50;
      if (taMatches(area.ta_name, label)) score += 40;
      if (normalize(area.display_name).includes(normalize(label))) score += 20;
    }

    score += scoreAreaNameMatch(hit.formatted_address, area) * 0.35;
    score += directionSuffixBonus(area.name, hit.lon);

    if (!best || score > best.score) {
      best = { area, score };
    }
  }

  if (!best || best.score < 50) return null;

  return {
    slug: best.area.slug,
    display_name: best.area.display_name,
    has_brief: best.area.has_brief,
    matched_via: "geocode",
    formatted_address: hit.formatted_address,
    confidence: best.score >= 80 ? "high" : best.score >= 60 ? "medium" : "low",
  };
}

export function matchMeshblockToArea(
  meshblock: string,
  lookup: Record<string, { slug: string; display_name: string; has_brief: boolean }>,
  formattedAddress?: string,
): AddressSearchResult | null {
  const key = meshblock.padStart(7, "0");
  const entry = lookup[key];
  if (!entry) return null;

  return {
    slug: entry.slug,
    display_name: entry.display_name,
    has_brief: entry.has_brief,
    matched_via: "meshblock",
    formatted_address: formattedAddress,
    confidence: "high",
  };
}

export function dedupeResults(results: AddressSearchResult[]): AddressSearchResult[] {
  const seen = new Set<string>();
  const order = { high: 0, medium: 1, low: 2 };
  const viaOrder = { meshblock: 0, geocode: 1, area_name: 2 };

  return [...results]
    .sort((a, b) => {
      const conf = order[a.confidence] - order[b.confidence];
      if (conf !== 0) return conf;
      return viaOrder[a.matched_via] - viaOrder[b.matched_via];
    })
    .filter((result) => {
      if (seen.has(result.slug)) return false;
      seen.add(result.slug);
      return true;
    });
}
