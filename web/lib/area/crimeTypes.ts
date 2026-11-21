import { isMainCrimeType } from "@/config/crimeTypes";
import type { AreaBrief, CrimeTypeStats, PeriodStats } from "@/lib/types";

/** All crime types for an area, sorted by rolling-year count (desc). */
export function getCrimeTypesForBrief(brief: AreaBrief): string[] {
  const types = new Set<string>();
  for (const t of Object.keys(brief.rolling_year.by_crime_type ?? {})) types.add(t);
  for (const t of Object.keys(brief.vs_national.by_crime_type)) types.add(t);
  for (const t of Object.keys(brief.patterns.by_crime_type)) types.add(t);
  for (const msg of brief.safety_messages) types.add(msg.crime_type);

  return Array.from(types)
    .filter((type) => isMainCrimeType(type))
    .sort((a, b) => {
    const countA = brief.rolling_year.by_crime_type?.[a]?.count ?? 0;
    const countB = brief.rolling_year.by_crime_type?.[b]?.count ?? 0;
    return countB - countA || a.localeCompare(b);
  });
}

export function crimeTypeToParam(type: string): string {
  return type.toLowerCase();
}

export function paramToCrimeType(param: string, available: string[]): string | null {
  if (!param) return null;
  return available.find((t) => t.toLowerCase() === param.toLowerCase()) ?? null;
}

export function buildCrimeTypePeriodStats(
  parent: PeriodStats,
  crimeType: string,
): PeriodStats | null {
  const ct = parent.by_crime_type?.[crimeType];
  if (!ct) return null;

  return {
    total: ct.count,
    rate_per_1000: ct.rate_per_1000 ?? 0,
    prior_total: ct.prior_count ?? 0,
    prior_rate_per_1000: 0,
    delta_pct: ct.delta_pct ?? 0,
    confidence: parent.confidence,
    month: parent.month,
    previous_month: parent.previous_month,
  };
}

export function sortCrimeTypesByCount(
  types: Record<string, CrimeTypeStats>,
): Array<[string, CrimeTypeStats]> {
  return Object.entries(types).sort(([, a], [, b]) => b.count - a.count);
}
