import { readFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { getAreaBrief } from "@/lib/data";
import { isSafeSlug } from "@/lib/safeSlug";
import { fetchAreaUnitBoundary } from "@/lib/map/stats-nz-wfs";
import type { BoundaryFeature } from "@/lib/map/types";

const USER_AGENT = "SuburbSense/0.1 (community safety; opendata)";
const DATA_DIR = path.join(process.cwd(), "public", "data");

async function loadCachedBoundary(slug: string): Promise<BoundaryFeature | null> {
  try {
    const raw = await readFile(path.join(DATA_DIR, "boundaries", `${slug}.json`), "utf-8");
    return JSON.parse(raw) as BoundaryFeature;
  } catch {
    return null;
  }
}

async function fetchNominatimBoundary(
  areaName: string,
  taName: string,
): Promise<BoundaryFeature | null> {
  const query = `${areaName}, ${taName}, New Zealand`;
  const params = new URLSearchParams({
    q: query,
    format: "json",
    polygon_geojson: "1",
    countrycodes: "nz",
    limit: "10",
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 604800 },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    geojson?: GeoJSON.Geometry;
    display_name?: string;
  }>;

  for (const hit of data) {
    const geom = hit.geojson;
    if (geom?.type === "Polygon" || geom?.type === "MultiPolygon") {
      return {
        type: "Feature",
        properties: { label: query },
        geometry: geom as BoundaryFeature["geometry"],
      };
    }
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug is required." }, { status: 400 });
  }
  if (!isSafeSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  const brief = await getAreaBrief(slug);
  if (!brief) {
    return NextResponse.json({ error: "Area not found." }, { status: 404 });
  }

  const [areaName] = brief.display_name.split(",").map((s) => s.trim());

  const cached = await loadCachedBoundary(slug);
  if (cached) {
    return NextResponse.json({
      feature: cached,
      label: brief.display_name,
      source: "cache",
    });
  }

  const apiKey = process.env.DATAFINDER_API_KEY?.trim();
  if (apiKey) {
    try {
      const statsFeature = await fetchAreaUnitBoundary(apiKey, areaName);
      if (statsFeature) {
        return NextResponse.json({
          feature: statsFeature,
          label: brief.display_name,
          source: "stats-nz",
        });
      }
    } catch {
      // fall through
    }
  }

  const nominatimFeature = await fetchNominatimBoundary(areaName, brief.geography.ta_name);
  if (nominatimFeature) {
    return NextResponse.json({
      feature: nominatimFeature,
      label: brief.display_name,
      source: "nominatim",
    });
  }

  const centroidParams = new URLSearchParams({
    q: `${areaName}, ${brief.geography.ta_name}, New Zealand`,
    format: "json",
    limit: "1",
    countrycodes: "nz",
  });
  const centroidRes = await fetch(
    `https://nominatim.openstreetmap.org/search?${centroidParams}`,
    {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 604800 },
    },
  );
  const centroidData = centroidRes.ok
    ? ((await centroidRes.json()) as Array<{ lat: string; lon: string }>)
    : [];
  const centroid = centroidData[0];

  return NextResponse.json({
    feature: {
      type: "Feature",
      properties: { label: brief.display_name },
      geometry: {
        type: "Point",
        coordinates: [
          parseFloat(centroid?.lon ?? "174.7633"),
          parseFloat(centroid?.lat ?? "-41.2865"),
        ],
      },
    },
    label: brief.display_name,
    source: "pin",
  });
}
