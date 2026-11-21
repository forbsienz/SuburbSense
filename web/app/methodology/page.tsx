import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How Suburb Sense builds suburb crime briefs from NZ Police victimisation data and Stats NZ geography — comparison windows, rates, and limitations.",
  alternates: { canonical: "/methodology" },
  openGraph: {
    title: "Methodology | Suburb Sense",
    description:
      "How Suburb Sense builds suburb crime briefs from NZ Police victimisation data and Stats NZ geography.",
    url: "/methodology",
  },
};

export default function MethodologyPage() {
  return (
    <article className="space-y-6 text-sm">
      <h1 className="text-2xl font-bold">Methodology</h1>

      <section>
        <h2 className="text-lg font-semibold">Data source</h2>
        <p>
          Suburb Sense uses NZ Police Recorded Crime Victim Statistics (RCVS) from{" "}
          <a
            href="https://www.police.govt.nz/about-us/publications-statistics/data-and-statistics/policedatanz"
            target="_blank"
            rel="noopener noreferrer"
          >
            policedata.nz
          </a>
          . Briefs are built from the Victimisations report with{" "}
          <strong>location and time</strong> detail (Area Unit, meshblock, day, and hour) — not
          demographics-only extracts. Population and area hierarchies come from Stats NZ
          geographic tables and 2018 census meshblock population.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">How numbers are produced</h2>
        <p>
          A batch data pipeline ingests the Police extract, cleans and validates fields, joins
          geography and population, then aggregates to Area Unit (suburb-scale) statistics. Results
          are published as static JSON for this site. Rates use population as a stable baseline;
          confidence rules reduce emphasis on rates when counts or population are small.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Comparison windows</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Rolling 12 months</strong> — latest data month back 12 months vs the prior
            12 months (primary comparison).
          </li>
          <li>
            <strong>Latest month</strong> — most recent month vs the month before (shown only when
            confidence is sufficient).
          </li>
          <li>
            <strong>Longer-term trend</strong> — rolling 12-month rate per 1,000 over time. The
            first chart point appears only after a full year of history is available in the source
            extract.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Rates per 1,000</h2>
        <p>
          Rates divide reported victimisation counts by population. We use 2018 census
          population rolled to 2017 Area Units as a stable baseline — they show relative
          patterns, not exact current risk.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Geography</h2>
        <p>
          Statistics are shown at Area Unit (~suburb) level. Boundaries may not match colloquial
          suburb names or individual streets.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Limitations</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Not all crime is reported to Police.</li>
          <li>Dwelling-based victimisations may be excluded from some Police public views.</li>
          <li>Time of day is often unknown for property crime.</li>
          <li>Calendar week trends are not available — Police data uses month, day-of-week, and hour.</li>
        </ul>
      </section>

      <p>
        <Link href="/glossary">Glossary</Link>
      </p>
    </article>
  );
}
