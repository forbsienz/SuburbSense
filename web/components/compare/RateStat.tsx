import { DeltaChip } from "@/components/ui/DeltaChip";

interface RateStatProps {
  label: string;
  count: number;
  ratePer1000: number;
  priorCount?: number;
  priorRate?: number;
  deltaPct?: number;
  compact?: boolean;
}

export function RateStat({
  label,
  count,
  ratePer1000,
  priorCount,
  priorRate,
  deltaPct,
  compact = false,
}: RateStatProps) {
  if (compact) {
    return (
      <div>
        <p className="text-sm text-[var(--text-muted)]">{label}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="stat-value text-2xl font-semibold">{count.toLocaleString()}</span>
          {deltaPct !== undefined && <DeltaChip deltaPct={deltaPct} />}
        </div>
        <p className="stat-value mt-1 text-sm text-[var(--text-muted)]">
          {ratePer1000.toFixed(1)} per 1,000 residents
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <p className="stat-value text-5xl font-semibold leading-none tracking-tight">
          {count.toLocaleString()}
        </p>
        {deltaPct !== undefined && <DeltaChip deltaPct={deltaPct} />}
      </div>
      <p className="stat-value mt-2 text-lg text-[var(--text-muted)]">
        {ratePer1000.toFixed(1)}{" "}
        <span className="text-base">per 1,000 residents</span>
      </p>
      {priorCount !== undefined && priorRate !== undefined && (
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Previously {priorCount.toLocaleString()} reported ({priorRate.toFixed(1)} per 1,000)
        </p>
      )}
    </div>
  );
}
