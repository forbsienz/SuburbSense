import type { Feature, FeatureCollection, Polygon, MultiPolygon, Point } from "geojson";

export type BoundaryFeature = Feature<Polygon | MultiPolygon | Point>;
export type BoundaryCollection = FeatureCollection<Polygon | MultiPolygon>;

export interface AreaBoundaryResponse {
  feature: BoundaryFeature;
  label: string;
  source: "nominatim" | "stats-nz" | "pin" | "cache";
}

export interface ResolvedAddress {
  formatted_address: string;
  meshblock?: string;
  lat: number;
  lon: number;
  slug: string;
  display_name: string;
  has_brief: boolean;
  suburb?: string;
  city?: string;
  source?: "addressfinder" | "photon";
}
