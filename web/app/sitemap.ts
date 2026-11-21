import type { MetadataRoute } from "next";

import { SAFETY_GUIDE_SLUGS } from "@/content/safety";
import { getAreas, getMeta } from "@/lib/data";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  let lastModified = new Date();

  try {
    const meta = await getMeta();
    if (meta.generated_at) lastModified = new Date(meta.generated_at);
  } catch {
    // fixtures / first run
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/methodology`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/glossary`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const crimeRoutes: MetadataRoute.Sitemap = SAFETY_GUIDE_SLUGS.map((type) => ({
    url: `${base}/crime/${type}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  let areaRoutes: MetadataRoute.Sitemap = [];
  try {
    const areas = await getAreas();
    areaRoutes = areas
      .filter((a) => a.has_brief)
      .map((a) => ({
        url: `${base}/area/${a.slug}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }));
  } catch {
    // no areas.json yet
  }

  return [...staticRoutes, ...crimeRoutes, ...areaRoutes];
}
