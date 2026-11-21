import type { Feature, Polygon, MultiPolygon } from "geojson";
import { readFile } from "fs/promises";
import path from "path";

import type { BoundaryCollection } from "@/lib/map/types";
import { isSafeSlug } from "@/lib/safeSlug";

const PUBLIC_BOUNDARIES_DIR = path.join(process.cwd(), "public", "data", "boundaries");
/** Server-only — not under public/; used for nearby-suburb map queries. */
const SERVER_BOUNDARIES_DIR = path.join(process.cwd(), "server-data", "boundaries");

/** Degrees of padding around the focus suburb (~8–9 km). */
export const NEARBY_PAD_DEG = 0.08;

type SuburbFeature = Feature<Polygon | MultiPolygon>;
type BBox = [number, number, number, number]; // minLon, minLat, maxLon, maxLat

let allSuburbsPromise: Promise<BoundaryCollection | null> | null = null;
let bySlugCache: Map<string, SuburbFeature> | null = null;

function visitPositions(
  positions: number[][],
  visit: (lon: number, lat: number) => void,
): void {
  for (const pos of positions) {
    const lon = pos[0];
    const lat = pos[1];
    if (typeof lon === "number" && typeof lat === "number") visit(lon, lat);
  }
}

export function featureBBox(feature: SuburbFeature): BBox | null {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  const visit = (lon: number, lat: number) => {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  };

  const geom = feature.geometry;
  if (geom.type === "Polygon") {
    for (const ring of geom.coordinates) visitPositions(ring as number[][], visit);
  } else if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      for (const ring of poly) visitPositions(ring as number[][], visit);
    }
  } else {
    return null;
  }

  if (!Number.isFinite(minLon)) return null;
  return [minLon, minLat, maxLon, maxLat];
}

function expandBBox(box: BBox, pad: number): BBox {
  return [box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad];
}

function bboxesIntersect(a: BBox, b: BBox): boolean {
  return !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);
}

function isSuburbPolygon(feature: Feature): feature is SuburbFeature {
  return feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon";
}

async function loadAllSuburbs(): Promise<BoundaryCollection | null> {
  if (!allSuburbsPromise) {
    allSuburbsPromise = (async () => {
      try {
        const raw = await readFile(
          path.join(SERVER_BOUNDARIES_DIR, "all_suburbs.geojson"),
          "utf-8",
        );
        return JSON.parse(raw) as BoundaryCollection;
      } catch {
        return null;
      }
    })();
  }
  return allSuburbsPromise;
}

async function slugIndex(): Promise<Map<string, SuburbFeature>> {
  if (bySlugCache) return bySlugCache;
  const all = await loadAllSuburbs();
  bySlugCache = new Map();
  if (all) {
    for (const feature of all.features) {
      const slug = feature.properties?.slug;
      if (typeof slug === "string" && slug && isSuburbPolygon(feature)) {
        bySlugCache.set(slug, feature);
      }
    }
  }
  return bySlugCache;
}

export async function loadSuburbFeature(slug: string): Promise<SuburbFeature | null> {
  if (!isSafeSlug(slug)) return null;
  try {
    const raw = await readFile(path.join(PUBLIC_BOUNDARIES_DIR, `${slug}.json`), "utf-8");
    const parsed = JSON.parse(raw) as Feature;
    if (isSuburbPolygon(parsed)) return parsed;
  } catch {
    // fall through to index
  }
  const index = await slugIndex();
  return index.get(slug) ?? null;
}

export async function getSuburbSelfCollection(slug: string): Promise<BoundaryCollection | null> {
  const feature = await loadSuburbFeature(slug);
  if (!feature) return null;
  return { type: "FeatureCollection", features: [feature] };
}

export async function getSuburbNearbyCollection(
  slug: string,
  padDeg = NEARBY_PAD_DEG,
): Promise<BoundaryCollection | null> {
  const focus = await loadSuburbFeature(slug);
  if (!focus) return null;

  const focusBox = featureBBox(focus);
  if (!focusBox) {
    return { type: "FeatureCollection", features: [focus] };
  }

  const searchBox = expandBBox(focusBox, padDeg);
  const all = await loadAllSuburbs();
  if (!all) {
    return { type: "FeatureCollection", features: [focus] };
  }

  const features: SuburbFeature[] = [];
  let includedFocus = false;

  for (const feature of all.features) {
    if (!isSuburbPolygon(feature)) continue;
    const box = featureBBox(feature);
    if (!box || !bboxesIntersect(box, searchBox)) continue;
    features.push(feature);
    if (feature.properties?.slug === slug) includedFocus = true;
  }

  if (!includedFocus) features.unshift(focus);

  return { type: "FeatureCollection", features };
}
