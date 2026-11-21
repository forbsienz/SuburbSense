import { getSafetyGuide, SAFETY_GUIDE_SLUGS, COMMUNITY_ORGANISATIONS } from "@/content/safety";
import { ReportCrimeCTA } from "@/components/safety/ReportCrimeCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { isSafeSlug } from "@/lib/safeSlug";
import { absoluteUrl } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ area?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params;
  const guide = getSafetyGuide(type.toLowerCase());
  if (!guide) {
    return { title: "Safety guide not found" };
  }

  const title = `${guide.label} safety guide`;
  const description = guide.summary;
  const path = `/crime/${guide.slug}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | Suburb Sense`,
      description,
      url: path,
      type: "article",
      locale: "en_NZ",
    },
    twitter: {
      card: "summary",
      title: `${title} | Suburb Sense`,
      description,
    },
  };
}

export default async function CrimeGuidePage({ params, searchParams }: PageProps) {
  const { type } = await params;
  const { area: areaRaw } = await searchParams;
  const key = type.toLowerCase();
  const area = areaRaw && isSafeSlug(areaRaw) ? areaRaw : undefined;

  if (!SAFETY_GUIDE_SLUGS.includes(key)) {
    notFound();
  }

  const guide = getSafetyGuide(key);
  if (!guide) {
    notFound();
  }

  const tipSections =
    guide.tipSections && guide.tipSections.length > 0
      ? guide.tipSections
      : [{ title: "Practical tips", tips: guide.tips }];

  const resourceHrefs = new Set(guide.resources.map((r) => r.href));
  const extraCommunity = COMMUNITY_ORGANISATIONS.filter((org) => !resourceHrefs.has(org.href));

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Staying safe: ${guide.label}`,
    description: guide.summary,
    url: absoluteUrl(`/crime/${guide.slug}`),
    inLanguage: "en-NZ",
    author: { "@type": "Organization", name: "Suburb Sense" },
    isAccessibleForFree: true,
  };

  return (
    <div className="space-y-8">
      <JsonLd data={articleJsonLd} />
      <div>
        <Link href={area ? `/area/${area}` : "/"} className="text-sm text-[var(--text-muted)]">
          ← Back
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Staying safe: {guide.label.toLowerCase()}
        </h1>
        {area && (
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            General guidance below. Area-specific crime patterns are on your{" "}
            <Link href={`/area/${area}`} className="font-medium">
              suburb brief
            </Link>
            .
          </p>
        )}
        <p className="mt-4 max-w-2xl text-base leading-relaxed">{guide.summary}</p>
      </div>

      {tipSections.map((section) => (
        <section key={section.title} className="card-section space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {section.title}
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
            {section.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      ))}

      <section className="card-section space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          New Zealand resources
        </h2>
        <ul className="space-y-3">
          {guide.resources.map((resource) => (
            <li key={resource.href}>
              <a
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--accent)]"
              >
                {resource.label}
              </a>
              {resource.note && (
                <span className="mt-0.5 block text-sm text-[var(--text-muted)]">{resource.note}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {extraCommunity.length > 0 && (
        <section className="card-section space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Community organisations
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Local groups that work with Police to build safer, more connected neighbourhoods.
          </p>
          <ul className="space-y-3">
            {extraCommunity.map((resource) => (
              <li key={resource.href}>
                <a
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--accent)]"
                >
                  {resource.label}
                </a>
                {resource.note && (
                  <span className="mt-0.5 block text-sm text-[var(--text-muted)]">{resource.note}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-[var(--text-muted)]">
        Suburb Sense is not affiliated with NZ Police or these organisations. Advice is general —
        always follow official guidance for your situation.
      </p>

      <ReportCrimeCTA />
    </div>
  );
}
