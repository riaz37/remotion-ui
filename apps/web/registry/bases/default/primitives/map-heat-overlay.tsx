import type { FeatureCollection, Point } from "geojson";
import { useEffect } from "react";
import type { GeoJSONSource, Map } from "maplibre-gl";
import { interpolate, useCurrentFrame, useDelayRender } from "remotion";
import {
  clampProgress,
  hasMapLayer,
  hasMapSource,
  isMapStyleReady,
  removeMapLayer,
  removeMapSource,
} from "@/remotion/lib/map-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type MapHeatOverlayProps = {
  /** The map to paint on. Comes from `MapCanvas`'s `onMapReady`. */
  map: Map | null;
  /** Points to weigh. A numeric `weight` property is read when present. */
  points: FeatureCollection<Point>;
  /** Property on each feature holding its weight. */
  weightProperty?: string;
  /**
   * Kernel radius in pixels at `radiusZoom`, before the zoom ramp. Too large
   * and every point merges into one saturated blob with no density left to
   * read; the useful range is roughly 12–24 for a few hundred points.
   */
  radius?: number;
  /**
   * The zoom the radius is authored at. A heatmap radius is in screen pixels,
   * so without a ramp the density changes meaning as the camera moves.
   */
  radiusZoom?: number;
  /** Peak opacity once the overlay has faded up. */
  intensity?: number;
  /** Cool-to-hot ramp, low density first. Four or five stops reads best. */
  colors?: string[];
  /** Layer this sits under, so labels stay legible through the heat. */
  beforeLayerId?: string;
  sourceId?: string;
  /** Drive the fade yourself, 0–1. Omit for the built-in frame ramp. */
  revealProgress?: number;
};

const DEFAULT_COLORS = [
  "rgba(12,18,40,0)",
  "rgba(70,130,190,0.55)",
  "rgba(125,211,232,0.72)",
  "rgba(232,184,109,0.85)",
  "rgba(232,120,90,0.95)",
];

/**
 * Paints the reveal. Kept out of the component so the effect that owns the
 * `delayRender` reads as one statement: hold the frame, paint, wait for idle.
 */
const applyHeatReveal = ({
  map,
  layerId,
  intensity,
  revealProgress,
}: {
  map: Map;
  layerId: string;
  intensity: number;
  revealProgress: number;
}) => {
  if (!hasMapLayer(map, layerId)) {
    return;
  }

  map.setPaintProperty(layerId, "heatmap-opacity", intensity * revealProgress);
  // Intensity climbs with the fade rather than sitting at its final value, so
  // the hot cores arrive last instead of being there from the first frame at
  // low alpha — density reads as accumulating.
  map.setPaintProperty(layerId, "heatmap-intensity", 0.22 + revealProgress * 0.5);
  map.triggerRepaint();
};

/**
 * A density overlay fading in over the basemap.
 *
 * Like every other MapLibre primitive here, the paint holds the frame open with
 * its own `delayRender`: layers are added a commit after the map reports ready,
 * and without the hold the overlay drops out of whichever frame the browser
 * captures first — reliably the first sample of a still run, which then shows a
 * bare basemap and looks like a broken component.
 */
export const MapHeatOverlay: React.FC<MapHeatOverlayProps> = ({
  map,
  points,
  weightProperty = "weight",
  radius = 18,
  radiusZoom = 3,
  intensity = 0.85,
  colors = DEFAULT_COLORS,
  beforeLayerId,
  sourceId = "heat-points",
  revealProgress: revealProgressProp,
}) => {
  const frame = useCurrentFrame();
  const { delayRender, continueRender } = useDelayRender();
  const layerId = `${sourceId}-heat`;

  const revealProgress =
    revealProgressProp ??
    clampProgress(
      interpolate(frame, [4, 46], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASING.enter,
      }),
    );

  useEffect(() => {
    if (!isMapStyleReady(map)) {
      return;
    }

    if (!hasMapSource(map, sourceId)) {
      map.addSource(sourceId, { type: "geojson", data: points });

      map.addLayer(
        {
          id: layerId,
          type: "heatmap",
          source: sourceId,
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["coalesce", ["get", weightProperty], 1],
              0,
              0,
              1,
              1,
            ],
            "heatmap-intensity": 0.22,
            // The first stop must be transparent: a heatmap colour ramp is
            // painted across the whole layer, so an opaque density-zero colour
            // floods the entire viewport rather than showing the hot spots.
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              ...colors.flatMap((color, index) => [
                index / Math.max(1, colors.length - 1),
                color,
              ]),
            ],
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              radiusZoom,
              radius,
              radiusZoom + 4,
              radius * 3,
            ],
            "heatmap-opacity": 0,
          },
        },
        beforeLayerId && hasMapLayer(map, beforeLayerId) ? beforeLayerId : undefined,
      );
    } else {
      const source = map.getSource(sourceId) as GeoJSONSource | undefined;
      source?.setData(points);
    }

    return () => {
      if (!isMapStyleReady(map)) {
        return;
      }
      removeMapLayer(map, layerId);
      removeMapSource(map, sourceId);
    };
  }, [
    beforeLayerId,
    colors,
    layerId,
    map,
    points,
    radius,
    radiusZoom,
    sourceId,
    weightProperty,
  ]);

  useEffect(() => {
    if (!isMapStyleReady(map)) {
      return;
    }

    const handle = delayRender("Painting map heat overlay");
    applyHeatReveal({ map, layerId, intensity, revealProgress });
    map.once("idle", () => continueRender(handle));
  }, [continueRender, delayRender, intensity, layerId, map, revealProgress]);

  return null;
};
