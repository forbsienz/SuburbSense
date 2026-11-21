export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface CrimeMixDonutProps {
  slices: DonutSlice[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}

export function CrimeMixDonut({
  slices,
  centerLabel,
  centerValue,
  size = 168,
}: CrimeMixDonutProps) {
  const active = slices.filter((slice) => slice.value > 0);
  const total = active.reduce((sum, slice) => sum + slice.value, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">No reported crime in this period.</p>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.32;
  const strokeWidth = size * 0.14;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="crime-mix-donut">
      <div className="crime-mix-donut__chart">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          {active.map((slice) => {
            const dash = (slice.value / total) * circumference;
            const element = (
              <circle
                key={slice.label}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
            offset += dash;
            return element;
          })}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="crime-mix-donut__center">
            {centerValue && <p className="crime-mix-donut__value stat-value">{centerValue}</p>}
            {centerLabel && <p className="crime-mix-donut__label">{centerLabel}</p>}
          </div>
        )}
      </div>
      <ul className="crime-mix-donut__legend">
        {active.map((slice) => {
          const pct = Math.round((slice.value / total) * 100);
          return (
            <li key={slice.label} className="crime-mix-donut__legend-item">
              <span
                className="crime-mix-donut__swatch"
                style={{ backgroundColor: slice.color }}
              />
              <span className="crime-mix-donut__legend-label">{slice.label}</span>
              <span className="crime-mix-donut__legend-meta stat-value">
                {slice.value.toLocaleString()} · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
