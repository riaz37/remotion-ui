"use client";

import { useCallback, useMemo, useState } from "react";
import type { FeatureCollection, Point } from "geojson";
import type { Map } from "maplibre-gl";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { MapCanvas, MapHeatOverlay } from "../registry-exports";
import { isMapStyleReady } from "../../registry/bases/default/lib/map-utils";

/**
 * A deterministic scatter around three European hubs. Frames render out of
 * order, so the cloud has to be a function of its index rather than a random.
 */
const HEAT_POINTS: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: Array.from({ length: 140 }, (_, index) => {
    const hub = [
      [-0.1, 51.5],
      [2.35, 48.85],
      [8.5, 47.4],
    ][index % 3];
    const spread = 1 + (index % 7) * 0.42;
    const angle = index * 2.399;
    return {
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [
          hub[0] + Math.cos(angle) * spread,
          hub[1] + Math.sin(angle) * spread * 0.6,
        ],
      },
      properties: { weight: 0.35 + ((index * 37) % 100) / 154 },
    };
  }),
};

/**
 * The overlay fades up over frames 4–46 while the camera keeps drifting, so
 * frame 18 catches it part way in, frame 60 fully lit at a different camera,
 * and frame 108 further round again. A fixed basemap is a correct component and
 * a dead tile. See docs-internal/preview-audit-rubric.md.
 */
export const MapHeatOverlayPreview: React.FC = () => {
  const [map, setMap] = useState<Map | null>(null);
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const onMapReady = useCallback((nextMap: Map) => {
    if (isMapStyleReady(nextMap)) {
      setMap(nextMap);
    }
  }, []);

  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoom = interpolate(progress, [0, 1], [3.9, 4.5]);
  const lng = interpolate(progress, [0, 1], [2.2, 4.4]);
  const points = useMemo(() => HEAT_POINTS, []);

  return (
    <AbsoluteFill>
      <MapCanvas center={[lng, 49.6]} zoom={zoom} onMapReady={onMapReady} />
      <MapHeatOverlay map={map} points={points} />
    </AbsoluteFill>
  );
};
