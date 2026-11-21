import { MAIN_CRIME_TYPES } from "@/config/crimeTypes";
import type { AreaBrief, PatternBlock } from "@/lib/types";

function MiniBars({
  data,
  variant = "default",
}: {
  data: Record<string, number>;
  variant?: "default" | "safety";
}) {
  const max = Math.max(...Object.values(data), 1);

  return (
    <div>
      {Object.entries(data).map(([label, value]) => (
        <div key={label} className="bar-row">
          <span className="truncate text-xs text-[var(--text-muted)]">{label}</span>
          <div className="bar-track">
            <div
              className={`bar-fill${variant === "safety" ? " bar-fill--safety" : ""}`}
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
          <span className="stat-value text-right text-xs">{value}</span>
        </div>
      ))}
    </div>
  );
}

function PatternBlock({
  type,
  pattern,
}: {
  type: string;
  pattern: PatternBlock;
}) {
  return (
    <div className="card-sub">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">{type}</h3>
        <span className="text-sm text-[var(--text-muted)]">
          Peak: {pattern.peak_day}s · {pattern.peak_hour_band}
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Unknown time: {pattern.unknown_time_pct.toFixed(0)}% of reports
      </p>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            By day
          </p>
          <MiniBars data={pattern.day_distribution} variant="safety" />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            By time
          </p>
          <MiniBars data={pattern.hour_distribution} />
        </div>
      </div>
    </div>
  );
}

function orderedMainPatterns(brief: AreaBrief): Array<[string, PatternBlock]> {
  return MAIN_CRIME_TYPES.map((type) => {
    const pattern = brief.patterns.by_crime_type[type];
    return pattern ? ([type, pattern] as [string, PatternBlock]) : null;
  }).filter((entry): entry is [string, PatternBlock] => entry !== null);
}

function orderedSubtypePatterns(
  brief: AreaBrief,
  crimeType: string,
): Array<[string, PatternBlock]> {
  const subtypeMap = brief.patterns.by_crime_subtype?.[crimeType] ?? {};
  const counts = brief.rolling_year.by_crime_type?.[crimeType]?.by_subtype ?? {};

  return Object.keys(subtypeMap)
    .sort((a, b) => (counts[b]?.count ?? 0) - (counts[a]?.count ?? 0))
    .map((subtype) => [subtype, subtypeMap[subtype]] as [string, PatternBlock]);
}

export function TimeDayPatterns({
  brief,
  crimeType,
}: {
  brief: AreaBrief;
  crimeType?: string;
}) {
  if (crimeType) {
    const subtypePatterns = orderedSubtypePatterns(brief, crimeType);
    if (subtypePatterns.length > 0) {
      return (
        <div className="space-y-5">
          <p className="text-sm text-[var(--text-muted)]">
            Day and time patterns for reported {crimeType.toLowerCase()} subtypes over the last
            12 months.
          </p>
          {subtypePatterns.map(([subtype, pattern]) => (
            <PatternBlock key={subtype} type={subtype} pattern={pattern} />
          ))}
        </div>
      );
    }

    const pattern = brief.patterns.by_crime_type[crimeType];
    if (!pattern) {
      return (
        <p className="text-sm text-[var(--text-muted)]">
          No time or day pattern data for {crimeType} in this area.
        </p>
      );
    }
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-muted)]">
          Day and time patterns for reported {crimeType.toLowerCase()} over the last 12 months.
        </p>
        <PatternBlock type={crimeType} pattern={pattern} />
      </div>
    );
  }

  const patterns = orderedMainPatterns(brief);
  if (patterns.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--text-muted)]">
        Day and time patterns for the five main crime types over the current 12-month period.
        Unknown times are common for property crime. Use the filter above to focus on one type.
      </p>
      {patterns.map(([type, pattern]) => (
        <PatternBlock key={type} type={type} pattern={pattern} />
      ))}
    </div>
  );
}
