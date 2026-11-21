"use client";

import { useId, useMemo, useState } from "react";

import { CRIME_TYPE_COLORS, isMainCrimeType } from "@/config/crimeTypes";
import type { TrendSeries } from "@/lib/types";

interface CrimeTrendChartProps {
  trend: TrendSeries;
  crimeType?: string | null;
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-NZ", { month: "short", year: "2-digit" });
}

function formatFullMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-NZ", { month: "long", year: "numeric" });
}

export function CrimeTrendChart({ trend, crimeType }: CrimeTrendChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const seriesKey = crimeType && isMainCrimeType(crimeType) ? crimeType : "all";
  const label =
    seriesKey === "all" ? "All reported crime" : crimeType ?? "All reported crime";

  const values = useMemo(() => {
    return trend.points.map((p) => {
      const raw = p[seriesKey];
      const n = typeof raw === "number" ? raw : Number(raw);
      return Number.isFinite(n) ? n : 0;
    });
  }, [trend.points, seriesKey]);

  const hasSignal = values.some((v) => v > 0);

  const stroke =
    seriesKey !== "all" && isMainCrimeType(seriesKey)
      ? CRIME_TYPE_COLORS[seriesKey]
      : "var(--accent)";

  // Wide viewBox so the series stretches across the card on desktop
  const width = 960;
  const height = 280;
  const pad = { top: 20, right: 16, bottom: 40, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxY = Math.max(...values, 0.1);
  const yMax = maxY * 1.1;

  const points = values.map((v, i) => {
    const x =
      values.length === 1
        ? pad.left + innerW / 2
        : pad.left + (i / (values.length - 1)) * innerW;
    const y = pad.top + innerH - (v / yMax) * innerH;
    return { x, y, v, month: trend.points[i]?.month ?? "" };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(pad.top + innerH).toFixed(2)} L ${points[0].x.toFixed(2)} ${(pad.top + innerH).toFixed(2)} Z`
      : "";

  const tickCount = Math.min(6, values.length);
  const xTicks = Array.from({ length: tickCount }, (_, i) => {
    const idx =
      tickCount === 1 ? 0 : Math.round((i / (tickCount - 1)) * (values.length - 1));
    return { idx, ...points[idx] };
  });

  const yTicks = [0, 0.5, 1].map((t) => ({
    value: yMax * t,
    y: pad.top + innerH - t * innerH,
  }));

  const focus = activeIndex !== null ? points[activeIndex] : points[points.length - 1];

  if (!hasSignal) {
    return (
      <div className="what-changed-block space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Longer-term trend
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          Not enough reported {label.toLowerCase()} over time to draw a trend for this area.
        </p>
      </div>
    );
  }

  return (
    <div className="what-changed-block space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Longer-term trend
        </h3>
        {focus && (
          <p className="stat-value text-sm text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-primary)]">
              {focus.v.toFixed(1)}
            </span>{" "}
            per 1,000 · {formatFullMonth(focus.month)}
          </p>
        )}
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        Rolling 12-month rate for {label.toLowerCase()}. Use the crime type filter above to
        switch series.
      </p>

      <div className="crime-trend">
        <svg
          className="crime-trend__svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Rolling 12-month rate trend for ${label}`}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id={`trend-fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={pad.left}
                x2={pad.left + innerW}
                y1={tick.y}
                y2={tick.y}
                className="crime-trend__grid"
              />
              <text x={pad.left - 8} y={tick.y + 3} textAnchor="end" className="crime-trend__tick">
                {tick.value.toFixed(tick.value >= 10 ? 0 : 1)}
              </text>
            </g>
          ))}

          {areaPath && (
            <path d={areaPath} fill={`url(#trend-fill-${gradientId})`} />
          )}
          <path d={linePath} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          {focus && (
            <circle cx={focus.x} cy={focus.y} r="4.5" fill={stroke} className="crime-trend__dot" />
          )}

          {xTicks.map((tick) => (
            <text
              key={`${tick.month}-${tick.idx}`}
              x={tick.x}
              y={height - 10}
              textAnchor="middle"
              className="crime-trend__tick"
            >
              {formatMonthLabel(tick.month)}
            </text>
          ))}

          {/* Invisible hit targets for touch/hover */}
          {points.map((p, i) => (
            <rect
              key={p.month}
              x={p.x - Math.max(innerW / values.length / 2, 6)}
              y={pad.top}
              width={Math.max(innerW / values.length, 12)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setActiveIndex(i)}
              onFocus={() => setActiveIndex(i)}
              tabIndex={0}
              role="listitem"
              aria-label={`${formatFullMonth(p.month)}: ${p.v.toFixed(1)} per 1,000`}
            />
          ))}
        </svg>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Rates use 2018 census population. Rolling 12 months smooths month-to-month noise.
      </p>
    </div>
  );
}
