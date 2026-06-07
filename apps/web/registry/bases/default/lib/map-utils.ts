import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { Map } from "maplibre-gl";
import maplibregl from "maplibre-gl";

export type LngLat = [number, number];

export const DEFAULT_MAP_STYLE = "https://demotiles.maplibre.org/style.json";

export const DEMO_ROUTE: { from: LngLat; to: LngLat } = {
  from: [8.5417, 47.3769],
  to: [-74.006, 40.7128],
};

export function clampProgress(progress: number) {
  return Math.min(1, Math.max(0, progress));
}

export function distanceAlong(totalDistance: number, progress: number) {
  return Math.max(0.001, totalDistance * clampProgress(progress));
}

export function greatCircleLine(from: LngLat, to: LngLat) {
  const route = turf.greatCircle(from, to, { npoints: 100 });

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

