"use client";

import { useEffect, useMemo, useRef } from "react";
import Map, { Layer, Source, Marker, NavigationControl } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import type { LngLatBoundsLike } from "mapbox-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  suburbFillPaint,
  suburbLinePaint,
  type AreaMapViewProps,
} from "@/components/map/mapTypes";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export function MaplibreView({
  suburbs,
  slug,
  hovered,
  pinLat,
  pinLon,
  initialView,
  onClick,
  onMouseMove,
  onMouseLeave,
  onFitReady,
}: AreaMapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const fillPaint = useMemo(() => suburbFillPaint(slug, hovered), [slug, hovered]);
  const linePaint = useMemo(() => suburbLinePaint(slug), [slug]);

  useEffect(() => {
    onFitReady((bounds: LngLatBoundsLike) => {
      mapRef.current?.fitBounds(bounds as [[number, number], [number, number]], {
        padding: 48,
        maxZoom: 14,
        duration: 600,
      });
    });
  }, [onFitReady]);

  return (
    <Map
      ref={mapRef}
      mapStyle={MAP_STYLE}
      initialViewState={initialView}
      style={{ width: "100%", height: "100%" }}
      attributionControl
      interactiveLayerIds={["suburbs-fill"]}
      dragPan
      scrollZoom
      doubleClickZoom
      touchZoomRotate
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <NavigationControl position="top-right" showCompass={false} visualizePitch={false} />
      {suburbs && (
        <Source id="suburbs" type="geojson" data={suburbs}>
          {/* Paint helpers are typed against mapbox-gl; cast for maplibre compatibility */}
          <Layer id="suburbs-fill" type="fill" paint={fillPaint as never} />
          <Layer id="suburbs-line" type="line" paint={linePaint as never} />
        </Source>
      )}
      {pinLat !== undefined && pinLon !== undefined && (
        <Marker longitude={pinLon} latitude={pinLat} anchor="bottom" color="#5c6b4f" />
      )}
    </Map>
  );
}
