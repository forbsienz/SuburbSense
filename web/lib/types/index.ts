export type Confidence = "high" | "medium" | "low";

export interface Meta {
  generated_at: string;
  pipeline_version: string;
  data_through: string;
  current_period: { start: string; end: string };
  prior_period: { start: string; end: string };
  latest_month: string;
  previous_month: string;
  population_source: string;
  population_caveat: string;
}

export interface AreaIndex {
  slug: string;
  name: string;
  display_name: string;
  ta_slug: string;
  ta_name: string;
  region_slug: string;
  region_name: string;
  population: number;
  has_brief: boolean;
}

export interface CrimeTypeStats {
  count: number;
  prior_count?: number;
  rate_per_1000?: number;
  delta_pct?: number;
  by_subtype?: Record<string, { count: number; prior_count?: number }>;
}

export interface PatternBlock {
  peak_day: string;
  peak_hour_band: string;
  unknown_time_pct: number;
  day_distribution: Record<string, number>;
  hour_distribution: Record<string, number>;
}

export interface PeriodStats {
  total: number;
  rate_per_1000: number;
  prior_total: number;
  prior_rate_per_1000: number;
  delta_pct: number;
  confidence: Confidence;
  by_crime_type?: Record<string, CrimeTypeStats>;
  month?: string;
  previous_month?: string;
}

export interface VsBaseline {
  total_ratio: number;
  by_crime_type: Record<string, number>;
}

/** One month endpoint of a rolling 12-month rate series (per 1,000 residents). */
export interface TrendPoint {
  month: string;
  all: number;
  [crimeType: string]: string | number;
}

export interface TrendSeries {
  metric: "rolling_12m_rate_per_1000";
  points: TrendPoint[];
}

export interface AreaBrief {
  slug: string;
  display_name: string;
  geography: {
    ta_slug: string;
    ta_name: string;
    region_slug: string;
    region_name: string;
    population: number;
  };
  rate_comparison_reliable: boolean;
  rolling_year: PeriodStats;
  latest_month?: PeriodStats;
  vs_national: VsBaseline;
  vs_ta: VsBaseline;
  vs_region: VsBaseline;
  vs_suburb?: VsBaseline;
  patterns: {
    by_crime_type: Record<string, PatternBlock>;
    by_crime_subtype?: Record<string, Record<string, PatternBlock>>;
  };
  /** Multi-year rolling rate series for the trend chart (optional if history is thin). */
  trend?: TrendSeries;
  safety_messages: Array<{
    crime_type: string;
    message: string | null;
    content_key: string;
    confidence: Confidence;
  }>;
  comparison_narrative: {
    rolling_year: string;
    latest_month?: string;
    national?: Record<string, string>;
  };
}

export interface NationalBaseline {
  rolling_year: {
    total_rate_per_1000: number;
    by_crime_type: Record<string, number>;
  };
}

export interface GeographyBaselines {
  territorial_authorities: Record<
    string,
    {
      slug: string;
      name: string;
      region_slug?: string;
      rolling_year: NationalBaseline["rolling_year"];
    }
  >;
  regions: Record<
    string,
    {
      slug: string;
      name: string;
      rolling_year: NationalBaseline["rolling_year"];
    }
  >;
}
