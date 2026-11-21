import {
  CRIME_TYPE_COLORS,
  isMainCrimeType,
  MAIN_CRIME_TYPES,
  subtypeColor,
} from "@/config/crimeTypes";
import { CrimeMixDonut, type DonutSlice } from "@/components/charts/CrimeMixDonut";
import type { AreaBrief } from "@/lib/types";
import { sortCrimeTypesByCount } from "@/lib/area/crimeTypes";

function buildTypeSlices(brief: AreaBrief): DonutSlice[] {
  const byType = brief.rolling_year.by_crime_type ?? {};
  return sortCrimeTypesByCount(byType)
    .filter(([type]) => isMainCrimeType(type))
    .map(([type, stats]) => ({
      label: type,
      value: stats.count,
      color: isMainCrimeType(type) ? CRIME_TYPE_COLORS[type] : "#5a6578",
    }));
}

function buildSubtypeSlices(brief: AreaBrief, crimeType: string): DonutSlice[] {
  const subtypes = brief.rolling_year.by_crime_type?.[crimeType]?.by_subtype ?? {};
  return Object.entries(subtypes)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([label, stats], index) => ({
      label,
      value: stats.count,
      color: subtypeColor(index),
    }));
}

export function SafetyBrief({
  brief,
  crimeType,
}: {
  brief: AreaBrief;
  crimeType?: string;
}) {
  const slices = crimeType ? buildSubtypeSlices(brief, crimeType) : buildTypeSlices(brief);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  const intro = crimeType
    ? `Breakdown of reported ${crimeType.toLowerCase()} in ${brief.display_name} over the last 12 months.`
    : `Reported crime types in ${brief.display_name} over the last 12 months. Use the filter above to focus on one type.`;

  return (
    <div>
      <p className="mb-4 text-sm text-[var(--text-muted)]">{intro}</p>
      <CrimeMixDonut
        slices={slices}
        centerValue={total.toLocaleString()}
        centerLabel={crimeType ? "reported" : "total"}
      />
      {!crimeType && (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Showing {MAIN_CRIME_TYPES.join(", ")}. Harm/abduction is excluded from this view.
        </p>
      )}
    </div>
  );
}
