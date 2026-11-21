import { AreaBriefContent } from "@/components/area/AreaBriefContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllCrimeTypes } from "@/config/crimeTypes";
import { getAreaBrief, getMeta, getNational } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const brief = await getAreaBrief(slug);
  if (!brief) {
    return { title: "Suburb not found" };
  }

  const title = `${brief.display_name} crime trends`;
  const description = `Reported crime trends, rates per 1,000 residents, and safety guidance for ${brief.display_name}. Rolling comparisons from NZ Police victimisation data.`;
  const path = `/area/${brief.slug}`;

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
      card: "summary_large_image",
      title: `${title} | Suburb Sense`,
      description,
    },
  };
}

export default async function AreaPage({ params }: PageProps) {
  const { slug } = await params;
  const [meta, brief, national] = await Promise.all([
    getMeta(),
    getAreaBrief(slug),
    getNational(),
  ]);

  if (!brief) {
    notFound();
  }

  const allCrimeTypes = getAllCrimeTypes(national);
  const path = `/area/${brief.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Reported crime brief — ${brief.display_name}`,
    description: `Aggregated NZ Police victimisation statistics and rates for ${brief.display_name}.`,
    url: absoluteUrl(path),
    inLanguage: "en-NZ",
    creator: {
      "@type": "Organization",
      name: "Suburb Sense",
    },
    spatialCoverage: {
      "@type": "Place",
      name: brief.display_name,
      address: {
        "@type": "PostalAddress",
        addressLocality: brief.geography.ta_name,
        addressRegion: brief.geography.region_name,
        addressCountry: "NZ",
      },
    },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Suspense fallback={<div className="text-sm text-[var(--text-muted)]">Loading…</div>}>
        <AreaBriefContent brief={brief} meta={meta} allCrimeTypes={allCrimeTypes} />
      </Suspense>
    </>
  );
}
