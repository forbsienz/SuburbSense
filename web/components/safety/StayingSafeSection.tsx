import Link from "next/link";

import { ReportCrimeCTA } from "@/components/safety/ReportCrimeCTA";
import { SafetyCard } from "@/components/ui/Card";
import { MAIN_CRIME_TYPES } from "@/config/crimeTypes";
import { getCrimeTypesForBrief } from "@/lib/area/crimeTypes";
import { COMMUNITY_ORGANISATIONS, SAFETY_GUIDES } from "@/content/safety";
import type { AreaBrief } from "@/lib/types";

interface StayingSafeSectionProps {
  brief: AreaBrief;
  crimeType?: string;
}

const FEATURED_ORGS = COMMUNITY_ORGANISATIONS.filter((org) =>
  [
    "https://www.neighbourhoodsupport.co.nz",
    "https://cpnz.org.nz",
    "https://communitycam.co.nz/index.cfm",
  ].includes(org.href),
);

export function StayingSafeSection({ brief, crimeType }: StayingSafeSectionProps) {
  const areaTypes = getCrimeTypesForBrief(brief);
  const typesToShow = crimeType
    ? [crimeType]
    : areaTypes.length > 0
      ? areaTypes
      : [...MAIN_CRIME_TYPES];

  const guides = typesToShow
    .map((type) => {
      const guide = SAFETY_GUIDES[type.toLowerCase()];
      if (!guide) return null;
      return { crimeType: type, guide };
    })
    .filter((entry): entry is { crimeType: string; guide: (typeof SAFETY_GUIDES)[string] } =>
      Boolean(entry),
    );

  if (guides.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        General safety guidance is available from{" "}
        <a
          href="https://www.police.govt.nz/advice/personal-community/keeping-safe"
          target="_blank"
          rel="noopener noreferrer"
        >
          NZ Police
        </a>
        .
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        Practical guidance and trusted New Zealand resources.
      </p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {guides.map(({ guide }) => (
          <li key={guide.slug}>
            <SafetyCard className="flex h-full flex-col">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">{guide.label}</h3>
              <p className="mt-2 flex-1 text-sm text-[var(--text-muted)]">{guide.summary}</p>
              <Link
                href={`/crime/${guide.slug}?area=${brief.slug}`}
                className="mt-3 inline-block text-sm font-medium"
              >
                Guidance and NZ resources →
              </Link>
            </SafetyCard>
          </li>
        ))}
      </ul>

      <SafetyCard className="space-y-3">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Get involved locally</h3>
        <p className="text-sm text-[var(--text-muted)]">
          Connected neighbourhoods are safer. These organisations work with Police across New
          Zealand.
        </p>
        <ul className="space-y-3">
          {FEATURED_ORGS.map((org) => (
            <li key={org.href} className="text-sm">
              <a href={org.href} target="_blank" rel="noopener noreferrer" className="font-medium">
                {org.label}
              </a>
              {org.note && (
                <span className="mt-0.5 block text-[var(--text-muted)]">{org.note}</span>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--text-muted)]">
          More tip sheets:{" "}
          <a
            href="https://www.neighbourhoodsupport.co.nz/tips-advice"
            target="_blank"
            rel="noopener noreferrer"
          >
            Neighbourhood Support tips and advice
          </a>
          .
        </p>
      </SafetyCard>

      <ReportCrimeCTA />
    </div>
  );
}
