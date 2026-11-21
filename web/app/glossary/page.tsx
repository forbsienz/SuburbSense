import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Glossary",
  description:
    "Plain-language definitions for victimisations, Area Units, rates per 1,000, rolling years, and other terms used on Suburb Sense.",
  alternates: { canonical: "/glossary" },
  openGraph: {
    title: "Glossary | Suburb Sense",
    description:
      "Plain-language definitions for victimisations, Area Units, rates per 1,000, and other Suburb Sense terms.",
    url: "/glossary",
  },
};

const TERMS = [
  {
    term: "Victimisation",
    definition:
      "A report to Police of a crime with an identified victim. Different from official offence counts — one incident may count once per victim per crime type.",
  },
  {
    term: "Area Unit",
    definition:
      "Stats NZ suburb-sized geography (~2,000 nationwide). Suburb Sense shows all statistics at this level.",
  },
  {
    term: "Rate per 1,000",
    definition:
      "Reported victimisations divided by population, multiplied by 1,000. Allows fairer comparison between areas of different sizes.",
  },
  {
    term: "Rolling year",
    definition:
      "The most recent 12 months of data in the Police upload, compared to the 12 months before that.",
  },
  {
    term: "National average comparison",
    definition:
      "How an area's rate compares to the national rate, shown as a percentage of the national average (e.g. 125% = above average, 60% = below average, 100% = national average).",
  },
  {
    term: "Confidence",
    definition:
      "High/medium/low label based on population and count. Low-confidence areas may hide monthly comparisons and rate figures.",
  },
];

export default function GlossaryPage() {
  return (
    <article className="space-y-6">
      <h1 className="text-2xl font-bold">Glossary</h1>
      <dl className="space-y-4">
        {TERMS.map(({ term, definition }) => (
          <div key={term}>
            <dt className="font-semibold">{term}</dt>
            <dd className="text-sm text-[var(--muted)]">{definition}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm">
        <Link href="/methodology">Methodology</Link>
      </p>
    </article>
  );
}
