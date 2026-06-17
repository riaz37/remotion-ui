import * as turf from "@turf/turf";
import type { CSSProperties } from "react";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { Map } from "maplibre-gl";
import maplibregl from "maplibre-gl";

export type LngLat = [number, number];

/** Dark basemap aligned with RemotionUI demo palette */
export const DEFAULT_MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export const MAP_THEME = {
  background: "#080810",
  route: "#2dd4bf",
  routeGlow: "rgba(45, 212, 191, 0.42)",
  routeHead: "#f8fafc",
  marker: "#e8b86d",
  markerGlow: "rgba(232, 184, 109, 0.38)",
  label: "#f8fafc",
  labelHalo: "#080810",
  vignette: "rgba(8, 8, 16, 0.55)",
} as const;

export const DEMO_ROUTE: { from: LngLat; to: LngLat } = {
  from: [8.5417, 47.3769],
  to: [-74.006, 40.7128],
};

export const DEMO_MARKERS: Array<{ position: LngLat; name: string }> = [
  { position: DEMO_ROUTE.from, name: "Zurich" },
  { position: [-0.1276, 51.5074], name: "London" },
  { position: DEMO_ROUTE.to, name: "New York" },
];

export function clampProgress(progress: number) {
  return Math.min(1, Math.max(0, progress));
}

export function distanceAlong(totalDistance: number, progress: number) {
  return Math.max(0.001, totalDistance * clampProgress(progress));
}

export function greatCircleLine(from: LngLat, to: LngLat) {
  const route = turf.greatCircle(from, to, { npoints: 120 });

  if (route.geometry.type === "LineString") {
    return turf.lineString(route.geometry.coordinates);
  }

  const longestSegment = route.geometry.coordinates.reduce((longest, segment) =>
    segment.length > longest.length ? segment : longest,
  );

  return turf.lineString(longestSegment);
}

export function sliceRouteByProgress(
  line: Feature<LineString>,
  progress: number,
) {
  const totalDistance = turf.length(line);
  return turf.lineSliceAlong(
    line,
    0,
    distanceAlong(totalDistance, progress),
  );
}

export function pointAlongRoute(line: Feature<LineString>, progress: number) {
  const totalDistance = turf.length(line);
  return turf.along(line, distanceAlong(totalDistance, progress)).geometry
    .coordinates as LngLat;
}

export function createMarkerCollection(
  markers: Array<{ position: LngLat; name: string }>,
): FeatureCollection<Point> {
  return turf.featureCollection(
    markers.map((marker) =>
      turf.point(marker.position, { name: marker.name }),
    ),
  );
}

export function getCameraOptions(
  map: Map,
  targetRoute: Feature<LineString>,
  cameraRoute: Feature<LineString>,
  progress: number,
  cameraAltitudeMeters: number,
  cameraLatitudeOffset = 0,
) {
  const target = pointAlongRoute(targetRoute, progress);
  const camera = pointAlongRoute(cameraRoute, progress);

  return map.calculateCameraOptionsFromTo(
    new maplibregl.LngLat(camera[0], camera[1] - cameraLatitudeOffset),
    cameraAltitudeMeters,
    new maplibregl.LngLat(target[0], target[1]),
  );
}

export type MapInitOptions = {
  center: LngLat;
  zoom?: number;
  style?: string;
};

export function createMapInstance(
  container: HTMLDivElement,
  width: number,
  height: number,
  { center, zoom = 7, style = DEFAULT_MAP_STYLE }: MapInitOptions,
) {
  return new maplibregl.Map({
    container,
    style,
    center,
    zoom,
    interactive: false,
    attributionControl: false,
    fadeDuration: 0,
    canvasContextAttributes: {
      preserveDrawingBuffer: true,
    },
  });
}

/** MapLibre throws when style is torn down — guard all layer/source access. */
export function isMapStyleReady(map: Map | null | undefined): map is Map {
  if (!map) {
    return false;
  }

  try {
    return Boolean(map.getStyle());
  } catch {
    return false;
  }
}

export function hasMapLayer(map: Map, layerId: string): boolean {
  if (!isMapStyleReady(map)) {
    return false;
  }

  try {
    return Boolean(map.getLayer(layerId));
  } catch {
    return false;
  }
}

export function hasMapSource(map: Map, sourceId: string): boolean {
  if (!isMapStyleReady(map)) {
    return false;
  }

  try {
    return Boolean(map.getSource(sourceId));
  } catch {
    return false;
  }
}

export function removeMapLayer(map: Map, layerId: string) {
  if (hasMapLayer(map, layerId)) {
    map.removeLayer(layerId);
  }
}

export function removeMapSource(map: Map, sourceId: string) {
  if (hasMapSource(map, sourceId)) {
    map.removeSource(sourceId);
  }
}

export const mapVignetteStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background: [
    `radial-gradient(ellipse 88% 72% at 50% 48%, transparent 42%, ${MAP_THEME.vignette} 100%)`,
    "linear-gradient(to bottom, rgba(8,8,16,0.42) 0%, transparent 18%, transparent 78%, rgba(8,8,16,0.62) 100%)",
  ].join(", "),
};
