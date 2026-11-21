interface DeltaChipProps {
  deltaPct: number;
}

export function DeltaChip({ deltaPct }: DeltaChipProps) {
  const up = deltaPct > 5;
  const down = deltaPct < -5;
  const cls = up
    ? "delta-chip delta-chip--up"
    : down
      ? "delta-chip delta-chip--down"
      : "delta-chip delta-chip--flat";
  const label = up ? `+${deltaPct.toFixed(0)}%` : down ? `${deltaPct.toFixed(0)}%` : "Flat";

  return <span className={cls}>{label}</span>;
}
