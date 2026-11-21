"use client";

import { MonthStats } from "@/components/compare/MonthStats";
import { GeographicComparisons } from "@/components/compare/GeographicComparisons";
import { RollingYearStats } from "@/components/compare/RollingYearStats";
import { CrimeTrendChart } from "@/components/compare/CrimeTrendChart";
import { CrimeTypeSelector, useSelectedCrimeType } from "@/components/area/CrimeTypeSelector";
import { AreaViewTracker } from "@/components/analytics/AreaViewTracker";
import { TimeDayPatterns } from "@/components/patterns/TimeDayPatterns";
import { SafetyBrief } from "@/components/safety/SafetyBrief";
import { StayingSafeSection } from "@/components/safety/StayingSafeSection";
import { AreaHero } from "@/components/area/AreaHero";
import { AreaLocationSection } from "@/components/area/AreaLocationSection";
import { SectionCard } from "@/components/ui/Card";
import { TransparencyPanel } from "@/components/transparency/TransparencyPanel";
import { buildCrimeTypePeriodStats } from "@/lib/area/crimeTypes";
import { showLatestMonth } from "@/lib/area/confidence";
import type { AreaBrief, Meta } from "@/lib/types";

interface AreaBriefContentProps {
  brief: AreaBrief;
  meta: Meta;
  allCrimeTypes: string[];
}

export function AreaBriefContent({ brief, meta, allCrimeTypes }: AreaBriefContentProps) {
  const crimeType = useSelectedCrimeType(allCrimeTypes);
  const showMonth = brief.latest_month && showLatestMonth(brief.rolling_year.confidence);

  const rollingStats = crimeType
    ? buildCrimeTypePeriodStats(brief.rolling_year, crimeType)
    : brief.rolling_year;

  const monthStats =
    crimeType && brief.latest_month
      ? buildCrimeTypePeriodStats(brief.latest_month, crimeType)
      : crimeType
        ? null
        : brief.latest_month;

  const reportCount = crimeType
    ? brief.rolling_year.by_crime_type?.[crimeType]?.count ?? 0
    : brief.rolling_year.total;

  const showComparisons = Boolean(brief.vs_ta || brief.vs_region || brief.vs_national);

  return (
    <div className="space-y-6">
      <AreaViewTracker slug={brief.slug} />
      <AreaHero
        brief={brief}
        meta={meta}
        narrative={brief.comparison_narrative.rolling_year}
      />

      <AreaLocationSection brief={brief} />

      <CrimeTypeSelector allCrimeTypes={allCrimeTypes} />

      <SectionCard title="What is the trend?" accent="compare">
        {crimeType && !rollingStats ? (
          <p className="text-sm text-[var(--text-muted)]">
            No reported {crimeType.toLowerCase()} in this area for the rolling 12-month period.
          </p>
        ) : rollingStats ? (
          <div className="space-y-4">
            <div className="what-changed-block">
              <RollingYearStats stats={rollingStats} crimeType={crimeType ?? undefined} />
            </div>

            {showMonth && !crimeType && brief.latest_month && (
              <div className="what-changed-block">
                <MonthStats stats={brief.latest_month} />
              </div>
            )}
            {showMonth && crimeType && monthStats && (
              <div className="what-changed-block">
                <MonthStats stats={monthStats} crimeType={crimeType} />
              </div>
            )}
            {showMonth && crimeType && !monthStats && (
              <p className="text-sm text-[var(--text-muted)]">
                No latest-month data for {crimeType} in this area.
              </p>
            )}

            {brief.trend && brief.trend.points.length > 0 && (
              <CrimeTrendChart trend={brief.trend} crimeType={crimeType} />
            )}
          </div>
        ) : null}
      </SectionCard>

      {showComparisons && (
        <SectionCard title="How this compares" accent="compare">
          <GeographicComparisons
            vsTa={brief.vs_suburb ?? brief.vs_ta}
            vsRegion={brief.vs_region}
            vsNational={brief.vs_national}
            taName={brief.geography.ta_name}
            localBaselineLabel={`City / district — ${brief.geography.ta_name}`}
            regionName={brief.geography.region_name}
            crimeType={crimeType ?? undefined}
            rateComparisonReliable={brief.rate_comparison_reliable}
            reportCount={reportCount}
            population={brief.geography.population}
          />
        </SectionCard>
      )}

      <SectionCard title="Reported crime mix" accent="neutral">
        <SafetyBrief brief={brief} crimeType={crimeType ?? undefined} />
      </SectionCard>

      <SectionCard title="When it happens" accent="patterns">
        <TimeDayPatterns brief={brief} crimeType={crimeType ?? undefined} />
      </SectionCard>

      <SectionCard title="Staying safe" accent="safety">
        <StayingSafeSection brief={brief} crimeType={crimeType ?? undefined} />
      </SectionCard>

      <SectionCard title="Data transparency" accent="transparency">
        <TransparencyPanel
          meta={meta}
          confidence={brief.rolling_year.confidence}
          areaDisplayName={brief.display_name}
        />
      </SectionCard>
    </div>
  );
}
