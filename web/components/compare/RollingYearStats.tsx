import type { PeriodStats } from "@/lib/types";
import { RateStat } from "./RateStat";
import { ConfidenceBadge } from "@/components/transparency/ConfidenceBadge";

export function RollingYearStats({
  stats,
  crimeType,
}: {
  stats: PeriodStats;
  crimeType?: string;
}) {
  const label = crimeType
    ? `Reported ${crimeType.toLowerCase()} (rolling 12 months)`
    : "Total reported victimisations";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Rolling 12 months
        </h3>
        <ConfidenceBadge level={stats.confidence} />
      </div>
      <RateStat
        label={label}
        count={stats.total}
        ratePer1000={stats.rate_per_1000}
        priorCount={stats.prior_total}
        priorRate={crimeType ? undefined : stats.prior_rate_per_1000}
        deltaPct={stats.delta_pct}
      />
    </div>
  );
}
