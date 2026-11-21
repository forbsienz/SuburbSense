import type { AreaIndex } from "@/lib/types";

export interface AddressSearchResult {
  slug: string;
  display_name: string;
  has_brief: boolean;
  matched_via: "area_name" | "geocode" | "meshblock";
  formatted_address?: string;
  confidence: "high" | "medium" | "low";
}

export interface GeocodeHit {
  lat: number;
  lon: number;
  formatted_address: string;
  suburb?: string;
  district?: string;
  locality?: string;
  city?: string;
  territorial_authority?: string;
  meshblock?: string;
}

export interface Geocoder {
  search(query: string): Promise<GeocodeHit[]>;
}

export type { AddressSearchResult as GeocodeResult };
