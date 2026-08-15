"use client";

import { useCallback, useMemo, useState } from "react";
import type { Map } from "maplibre-gl";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  MapCanvas,
  MapMarkers,
  MapRoute,
  MapFlight,
} from "../registry-exports";
import {
  createMarkerCollection,
  DEMO_MARKERS,
  DEMO_ROUTE,
  greatCircleLine,
  isMapStyleReady,
} from "../../registry/bases/default/lib/map-utils";

/**
 * Progress across the preview window, 0–1. The map previews are demonstrated by
 * a moving camera: a fixed basemap is a correct component and a dead tile, and
 * the still audit cannot tell the two apart.
 */
const usePreviewProgress = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const MapCanvasPreview: React.FC = () => {
  const progress = usePreviewProgress();
  const zoom = interpolate(progress, [0, 1], [3.4, 5.1]);
  const lng = interpolate(progress, [0, 1], [
    DEMO_ROUTE.from[0] - 2.4,
    DEMO_ROUTE.from[0] + 1.2,
  ]);

  return <MapCanvas center={[lng, DEMO_ROUTE.from[1]]} zoom={zoom} />;
};

export const MapRoutePreview: React.FC = () => {
  const [map, setMap] = useState<Map | null>(null);
  const route = useMemo(
    () => greatCircleLine(DEMO_ROUTE.from, DEMO_ROUTE.to),
    [],
  );
  const onMapReady = useCallback((nextMap: Map) => {
    if (isMapStyleReady(nextMap)) {
      setMap(nextMap);
    }
  }, []);

  return (
    <AbsoluteFill>
      <MapCanvas
        center={[-30, 48]}
        zoom={2.2}
        onMapReady={onMapReady}
      />
      <MapRoute map={map} route={route} />
    </AbsoluteFill>
  );
};

export const MapMarkersPreview: React.FC = () => {
  const [map, setMap] = useState<Map | null>(null);
  const markers = useMemo(() => createMarkerCollection(DEMO_MARKERS), []);
  const onMapReady = useCallback((nextMap: Map) => {
    if (isMapStyleReady(nextMap)) {
      setMap(nextMap);
    }
  }, []);

  // The primitive's own default lands every marker by frame 34, before the
  // audit's enter sample. Driving the reveal here spreads the drop-in across
  // the window, and the camera keeps drifting once the markers have landed.
  const progress = usePreviewProgress();
  const revealProgress = interpolate(progress, [0, 0.28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoom = interpolate(progress, [0, 1], [2.2, 2.75]);
  const lat = interpolate(progress, [0, 1], [47, 49.4]);

  return (
    <AbsoluteFill>
      <MapCanvas center={[-20, lat]} zoom={zoom} onMapReady={onMapReady} />
      <MapMarkers map={map} markers={markers} revealProgress={revealProgress} />
    </AbsoluteFill>
  );
};

export const MapFlightPreview: React.FC = () => (
  <MapFlight
    from={DEMO_ROUTE.from}
    to={DEMO_ROUTE.to}
    fromLabel="Zurich"
    toLabel="New York"
  />
);
