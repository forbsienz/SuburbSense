/** Convert ratio (e.g. 0.04) to % of baseline average (4). */
export function ratioToPercentOfBaseline(ratio: number): number {
  return Math.round(ratio * 100);
}

export type ComparisonPosition = "above" | "below" | "close";

export function comparisonPosition(ratio: number): ComparisonPosition {
  const pctOf = ratio * 100;
  if (pctOf > 105) return "above";
  if (pctOf < 95) return "below";
  return "close";
}

export function positionDescription(
  position: ComparisonPosition,
  baselineLabel: string,
): string {
  if (position === "above") return `Above the ${baselineLabel} average over the last 12 months.`;
  if (position === "below") return `Below the ${baselineLabel} average over the last 12 months.`;
  return `Close to the ${baselineLabel} average over the last 12 months.`;
}

export interface VsBaseline {
  total_ratio: number;
  by_crime_type: Record<string, number>;
}

export function getComparisonRatio(
  vs: VsBaseline,
  crimeType?: string,
): number | undefined {
  if (crimeType) return vs.by_crime_type[crimeType];
  return vs.total_ratio;
}

// Legacy aliases used by national-specific call sites
export const ratioToPercentOfNational = ratioToPercentOfBaseline;
export const nationalPosition = comparisonPosition;
