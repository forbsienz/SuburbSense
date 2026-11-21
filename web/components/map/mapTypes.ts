import type { LngLatBoundsLike, FillPaint, LinePaint } from "mapbox-gl";
import type { GeoJsonProperties } from "geojson";

import type { BoundaryCollection } from "@/lib/map/types";

export interface MapPickEvent {
  features?: Array<{ properties?: GeoJsonProperties }>;
  target: { getCanvas: () => { style: { cursor: string } } };
}

export interface AreaMapViewProps {
  suburbs: BoundaryCollection | null;
  slug: string;
  hovered: string | null;
  pinLat?: number;
  pinLon?: number;
  initialView: { longitude: number; latitude: number; zoom: number };
  onClick: (event: MapPickEvent) => void;
  onMouseMove: (event: MapPickEvent) => void;
  onMouseLeave: (event: MapPickEvent) => void;
  onFitReady: (fit: (bounds: LngLatBoundsLike) => void) => void;
}

export function suburbFillPaint(slug: string, hovered: string | null): FillPaint {
  return {
    "fill-color": [
      "case",
      ["==", ["get", "slug"], slug],
      "#4a6b52",
      ["==", ["get", "slug"], hovered || ""],
      "#6b8f71",
      "#b8c4aa",
    ],
    "fill-opacity": [
      "case",
      ["==", ["get", "slug"], slug],
      0.38,
      ["==", ["get", "slug"], hovered || ""],
      0.22,
      0.07,
    ],
  };
}

export function suburbLinePaint(slug: string): LinePaint {
  return {
    "line-color": [
      "case",
      ["==", ["get", "slug"], slug],
      "#3d5244",
      "#7a8574",
    ],
    "line-width": [
      "case",
      ["==", ["get", "slug"], slug],
      3,
      0.35,
    ],
  };
}
