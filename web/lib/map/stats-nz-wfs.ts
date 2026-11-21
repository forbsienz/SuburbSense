import type { BoundaryFeature } from "@/lib/map/types";

const WFS_BASE = "https://datafinder.stats.govt.nz/services";

const LAYERS = {
  areaUnit: "layer-27771",
} as const;

function wfsUrl(apiKey: string, params: URLSearchParams): string {
  return `${WFS_BASE};key=${apiKey}/wfs?${params}`;
}

async function fetchWfsFeatures(
  apiKey: string,
  typeName: string,
  cqlFilter: string,
  count = 1,
): Promise<BoundaryFeature[]> {
  const params = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeNames: typeName,
    outputFormat: "application/json",
    srsName: "EPSG:4326",
    cql_filter: cqlFilter,
    count: String(count),
  });

  const res = await fetch(wfsUrl(apiKey, params), { next: { revalidate: 604800 } });
  if (!res.ok) return [];

  const geo = (await res.json()) as {
    features?: BoundaryFeature[];
  };
  return geo.features ?? [];
}

export async function fetchAreaUnitBoundary(
  apiKey: string,
  areaUnitName: string,
): Promise<BoundaryFeature | null> {
  const escaped = areaUnitName.replace(/'/g, "''");
  const features = await fetchWfsFeatures(
    apiKey,
    LAYERS.areaUnit,
    `AU2017_NAME='${escaped}'`,
    1,
  );
  return features[0] ?? null;
}

export async function fetchAllAreaUnits(apiKey: string): Promise<BoundaryFeature[]> {
  const params = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeNames: LAYERS.areaUnit,
    outputFormat: "application/json",
    srsName: "EPSG:4326",
    count: "2500",
  });

  const res = await fetch(wfsUrl(apiKey, params), { next: { revalidate: 604800 } });
  if (!res.ok) return [];

  const geo = (await res.json()) as { features?: BoundaryFeature[] };
  return geo.features ?? [];
}
