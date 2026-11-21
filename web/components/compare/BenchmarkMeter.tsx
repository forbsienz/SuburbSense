import { ratioToPercentOfBaseline } from "@/lib/format/national";

/** Fixed display scale: 0% → 100% (avg, centre) → 200%. */
export const BENCHMARK_SCALE_MAX = 200;

interface BenchmarkMeterProps {
  ratio: number;
  baselineShort?: string;
}

export function BenchmarkMeter({ ratio, baselineShort = "avg" }: BenchmarkMeterProps) {
  const pctOf = ratioToPercentOfBaseline(ratio);
  const fillWidth = (Math.min(pctOf, BENCHMARK_SCALE_MAX) / BENCHMARK_SCALE_MAX) * 100;
  const capped = pctOf > BENCHMARK_SCALE_MAX;
  const aboveAverage = pctOf > 100;

  return (
    <div className="benchmark-meter">
      <div className="benchmark-meter__track" role="img" aria-label={`${pctOf}% of ${baselineShort} average`}>
        <div className="benchmark-meter__tick" style={{ left: "50%" }} />
        <div
          className={`benchmark-meter__fill${aboveAverage ? " benchmark-meter__fill--warm" : ""}`}
          style={{ width: `${fillWidth}%` }}
        />
      </div>
      <div className="benchmark-meter__labels">
        <span>0%</span>
        <span className="benchmark-meter__avg">100% ({baselineShort})</span>
        <span>
          200%
          {capped ? "+" : ""}
        </span>
      </div>
      {capped && (
        <p className="benchmark-meter__capped-note">
          Scale tops out at 200% — true value is {pctOf}%.
        </p>
      )}
    </div>
  );
}
