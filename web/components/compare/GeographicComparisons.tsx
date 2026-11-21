import { BenchmarkMeter } from "@/components/compare/BenchmarkMeter";
import {
  comparisonPosition,
  positionDescription,
  ratioToPercentOfBaseline,
  type VsBaseline,
} from "@/lib/format/national";

interface ComparisonRowProps {
  baselineLabel: string;
  baselineShort: string;
  ratio: number;
  showMeter?: boolean;
  subdued?: boolean;
}

function ComparisonRow({
  baselineLabel,
  baselineShort,
  ratio,
  showMeter = true,
  subdued = false,
}: ComparisonRowProps) {
  const position = comparisonPosition(ratio);
  const pctOf = ratioToPercentOfBaseline(ratio);

  return (
    <div className={subdued ? "card-sub" : "border-t border-[var(--border)] pt-4 first:border-0 first:pt-0"}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {baselineLabel}
      </p>
      <p className={`stat-value mt-1 font-semibold tracking-tight ${subdued ? "text-xl" : "text-2xl"}`}>
        {pctOf}%{" "}
        <span className={`font-medium text-[var(--text-primary)] ${subdued ? "text-sm" : "text-base"}`}>
          of {baselineShort} average
        </span>
      </p>
      <p
        className={`mt-0.5 text-sm font-medium ${
          position === "above"
            ? "text-[var(--trend-up)]"
            : position === "below"
              ? "text-[var(--trend-down)]"
              : "text-[var(--text-muted)]"
        }`}
      >
        {positionDescription(position, baselineShort)}
      </p>
      {showMeter && (
        <div className="mt-3">
          <BenchmarkMeter ratio={ratio} baselineShort={baselineShort} />
        </div>
      )}
    </div>
  );
}

interface GeographicComparisonsProps {
  vsTa: VsBaseline;
  vsRegion: VsBaseline;
  vsNational: VsBaseline;
  taName: string;
  localBaselineLabel?: string;
  regionName: string;
  crimeType?: string;
  rateComparisonReliable: boolean;
  reportCount: number;
  population: number;
}

export function GeographicComparisons({
  vsTa,
  vsRegion,
  vsNational,
  taName,
  localBaselineLabel,
  regionName,
  crimeType,
  rateComparisonReliable,
  reportCount,
  population,
}: GeographicComparisonsProps) {
  const taRatio = crimeType ? vsTa.by_crime_type[crimeType] : vsTa.total_ratio;
  const regionRatio = crimeType ? vsRegion.by_crime_type[crimeType] : vsRegion.total_ratio;
  const nationalRatio = crimeType
    ? vsNational.by_crime_type[crimeType]
    : vsNational.total_ratio;

  const subject = crimeType ? crimeType.toLowerCase() : "all reported crime";

  if (taRatio === undefined && regionRatio === undefined && nationalRatio === undefined) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        No comparison data available for {crimeType ?? "this selection"} in this area.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        Reported {subject} — rolling 12 months. Bar scale is fixed at 0–200%; average is the
        centre mark.
      </p>

      {!rateComparisonReliable && (
        <div className="card-inset text-sm">
          <p className="font-medium">Small population area ({population.toLocaleString()} residents)</p>
          <p className="mt-1 text-[var(--text-muted)]">
            This boundary has few residents but may include commercial, CBD, or institutional
            land. Crime is often recorded here without people living in the area — rates per 1,000
            can be misleading.
          </p>
          <p className="mt-2 font-medium">
            {reportCount.toLocaleString()} victimisations reported in the last 12 months.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {taRatio !== undefined && (
          <ComparisonRow
            baselineLabel={localBaselineLabel ?? `City / district — ${taName}`}
            baselineShort={taName}
            ratio={taRatio}
            showMeter={rateComparisonReliable}
            subdued={!rateComparisonReliable}
          />
        )}
        {regionRatio !== undefined && (
          <ComparisonRow
            baselineLabel={`Region — ${regionName}`}
            baselineShort={regionName}
            ratio={regionRatio}
            showMeter={rateComparisonReliable}
            subdued={!rateComparisonReliable}
          />
        )}
        {nationalRatio !== undefined && (
          <ComparisonRow
            baselineLabel="New Zealand"
            baselineShort="national"
            ratio={nationalRatio}
            showMeter={rateComparisonReliable}
            subdued={!rateComparisonReliable}
          />
        )}
      </div>
    </div>
  );
}
