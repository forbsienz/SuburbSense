"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { LngLatBoundsLike } from "mapbox-gl";

import type { BoundaryCollection } from "@/lib/map/types";
import type { GeoJsonProperties } from "geojson";
import type { AreaMapViewProps, MapPickEvent } from "@/components/map/mapTypes";

function propsRecord(properties: GeoJsonProperties | undefined): Record<string, unknown> {
  if (!properties || typeof properties !== "object") return {};
  return properties as Record<string, unknown>;
}

const USE_MAPBOX = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

const MapView = dynamic<AreaMapViewProps>(
  () =>
    USE_MAPBOX
      ? import("@/components/map/engines/MapboxView").then((m) => m.MapboxView)
      : import("@/components/map/engines/MaplibreView").then((m) => m.MaplibreView),
  {
    ssr: false,
    loading: () => (
      <p className="area-map__status text-sm text-[var(--text-muted)]">Loading map…</p>
    ),
  },
);

interface AreaMapProps {
  slug: string;
  pinLat?: number;
  pinLon?: number;
  onSuburbSelect?: (slug: string, hasBrief: boolean) => void;
}

function boundsFromCollection(collection: BoundaryCollection | null): LngLatBoundsLike | null {
  if (!collection || collection.features.length === 0) return null;

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  const visit = (positions: number[][]) => {
    for (const [lon, lat] of positions) {
      minLon = Math.min(minLon, lon);
      minLat = Math.min(minLat, lat);
      maxLon = Math.max(maxLon, lon);
      maxLat = Math.max(maxLat, lat);
    }
  };

  for (const feature of collection.features) {
    const geom = feature.geometry;
    if (geom.type === "Polygon") {
      for (const ring of geom.coordinates) visit(ring as number[][]);
    } else if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates) {
        for (const ring of poly) visit(ring as number[][]);
      }
    }
  }

  if (!Number.isFinite(minLon)) return null;
  return [
    [minLon, minLat],
    [maxLon, maxLat],
  ];
}

function boundsForSlug(collection: BoundaryCollection | null, slug: string): LngLatBoundsLike | null {
  if (!collection) return null;
  const feature = collection.features.find((f) => f.properties?.slug === slug);
  if (!feature) return boundsFromCollection(collection);
  return boundsFromCollection({ type: "FeatureCollection", features: [feature] });
}

export function AreaMap({ slug, pinLat, pinLon, onSuburbSelect }: AreaMapProps) {
  const fitRef = useRef<((bounds: LngLatBoundsLike) => void) | null>(null);
  const [suburbs, setSuburbs] = useState<BoundaryCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const fittedSlug = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fittedSlug.current = null;

    async function load() {
      setLoading(true);
      setError(null);
      setSuburbs(null);

      try {
        const selfRes = await fetch(`/api/boundary/suburbs?slug=${encodeURIComponent(slug)}&scope=self`);
        const selfData = (await selfRes.json()) as BoundaryCollection & { error?: string };
        if (!selfRes.ok) throw new Error(selfData.error ?? "Suburb boundary failed");
        if (cancelled) return;
        setSuburbs(selfData);
        setLoading(false);

        const nearRes = await fetch(`/api/boundary/suburbs?slug=${encodeURIComponent(slug)}&scope=nearby`);
        const nearData = (await nearRes.json()) as BoundaryCollection & { error?: string };
        if (!nearRes.ok) return;
        if (!cancelled) setSuburbs(nearData);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Map failed to load");
          setSuburbs(null);
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const focusBounds = useMemo(() => boundsForSlug(suburbs, slug), [suburbs, slug]);

  useEffect(() => {
    if (!focusBounds || !fitRef.current) return;
    if (fittedSlug.current === slug) return;
    fittedSlug.current = slug;
    fitRef.current(focusBounds);
  }, [focusBounds, slug]);

  const initialView = useMemo(() => {
    if (pinLat !== undefined && pinLon !== undefined) {
      return { longitude: pinLon, latitude: pinLat, zoom: 12 };
    }
    return { longitude: 174.7633, latitude: -41.2865, zoom: 5 };
  }, [pinLat, pinLon]);

  const handleClick = useCallback(
    (event: MapPickEvent) => {
      const feature = event.features?.[0];
      if (!feature?.properties || !onSuburbSelect) return;
      const props = propsRecord(feature.properties);
      const targetSlug = String(props.slug ?? "");
      const hasBrief = Boolean(props.has_brief);
      if (targetSlug) onSuburbSelect(targetSlug, hasBrief);
    },
    [onSuburbSelect],
  );

  const handleMouseMove = useCallback((event: MapPickEvent) => {
    const map = event.target;
    const feature = event.features?.[0];
    const id = String(propsRecord(feature?.properties).slug ?? "");
    setHovered(id || null);
    map.getCanvas().style.cursor = feature ? "pointer" : "";
  }, []);

  const handleMouseLeave = useCallback((event: MapPickEvent) => {
    event.target.getCanvas().style.cursor = "";
    setHovered(null);
  }, []);

  const onFitReady = useCallback((fit: (bounds: LngLatBoundsLike) => void) => {
    fitRef.current = fit;
    if (focusBounds && fittedSlug.current !== slug) {
      fittedSlug.current = slug;
      fit(focusBounds);
    }
  }, [focusBounds, slug]);

  return (
    <div className="area-map">
      {loading && !suburbs && (
        <p className="area-map__status text-sm text-[var(--text-muted)]">Loading map…</p>
      )}
      {error && <p className="area-map__status text-sm text-[var(--trend-up)]">{error}</p>}
      <MapView
        suburbs={suburbs}
        slug={slug}
        hovered={hovered}
        pinLat={pinLat}
        pinLon={pinLon}
        initialView={initialView}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onFitReady={onFitReady}
      />
      <p className="area-map__caption text-[0.6875rem] text-[var(--text-muted)]">
        Use + / − to zoom, drag to pan, then click a nearby suburb with data to switch briefs.
      </p>
    </div>
  );
}
