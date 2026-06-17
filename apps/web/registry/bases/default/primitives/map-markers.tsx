import type { FeatureCollection, Point } from "geojson";
import { useEffect } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { GeoJSONSource, Map } from "maplibre-gl";
import {
  clampProgress,
  hasMapLayer,
  hasMapSource,
  isMapStyleReady,
  MAP_THEME,
  removeMapLayer,
  removeMapSource,
} from "@/remotion/lib/map-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type MapMarkersProps = {
  map: Map | null;
  markers: FeatureCollection<Point>;
  dotColor?: string;
  glowColor?: string;
  dotRadius?: number;
  labelSize?: number;
  sourceId?: string;
  /** Staggered entrance 0–1; defaults to frame-driven reveal */
  revealProgress?: number;
};

const applyMarkerReveal = ({
  map,
  sourceId,
  dotRadius,
  revealProgress,
}: {
  map: Map;
  sourceId: string;
  dotRadius: number;
  revealProgress: number;
}) => {
  if (!isMapStyleReady(map)) {
    return;
  }

  const labelOpacity = revealProgress;
  const dotScale = 0.72 + revealProgress * 0.28;
  const labelsId = `${sourceId}-labels`;
  const dotsId = `${sourceId}-dots`;
  const glowId = `${sourceId}-glow`;

  if (hasMapLayer(map, labelsId)) {
    map.setPaintProperty(labelsId, "text-opacity", labelOpacity);
  }
  if (hasMapLayer(map, dotsId)) {
    map.setPaintProperty(dotsId, "circle-radius", dotRadius * dotScale);
    map.setPaintProperty(dotsId, "circle-opacity", labelOpacity);
  }
  if (hasMapLayer(map, glowId)) {
    map.setPaintProperty(glowId, "circle-radius", dotRadius * 2.4 * dotScale);
    map.setPaintProperty(glowId, "circle-opacity", 0.55 * labelOpacity);
  }

  map.triggerRepaint();
};

export const MapMarkers: React.FC<MapMarkersProps> = ({
  map,
  markers,
  dotColor = MAP_THEME.marker,
  glowColor = MAP_THEME.markerGlow,
  dotRadius = 11,
  labelSize = 28,
  sourceId = "city-markers",
  revealProgress: revealProgressProp,
}) => {
  const frame = useCurrentFrame();
  const revealProgress =
    revealProgressProp ??
    clampProgress(
      interpolate(frame, [6, 34], [0, 1], {
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
      map.addSource(sourceId, {
        type: "geojson",
        data: markers,
      });

      map.addLayer({
        id: `${sourceId}-glow`,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-color": glowColor,
          "circle-radius": dotRadius * 2.4,
          "circle-opacity": 0.55,
          "circle-blur": 0.35,
        },
      });

      map.addLayer({
        id: `${sourceId}-dots`,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-color": dotColor,
          "circle-radius": dotRadius,
          "circle-stroke-color": MAP_THEME.label,
          "circle-stroke-width": 3,
        },
      });

      map.addLayer({
        id: `${sourceId}-labels`,
        type: "symbol",
        source: sourceId,
        layout: {
          "text-allow-overlap": true,
          "text-anchor": "top",
          "text-field": ["get", "name"],
          "text-offset": [0, 1],
          "text-size": labelSize,
        },
        paint: {
          "text-color": MAP_THEME.label,
          "text-halo-color": MAP_THEME.labelHalo,
          "text-halo-width": 2.5,
        },
      });
    } else {
      const source = map.getSource(sourceId) as GeoJSONSource | undefined;
      source?.setData(markers);

      if (hasMapLayer(map, `${sourceId}-dots`)) {
        map.setPaintProperty(`${sourceId}-dots`, "circle-color", dotColor);
        map.setPaintProperty(`${sourceId}-dots`, "circle-radius", dotRadius);
      }
      if (hasMapLayer(map, `${sourceId}-glow`)) {
        map.setPaintProperty(`${sourceId}-glow`, "circle-color", glowColor);
        map.setPaintProperty(
          `${sourceId}-glow`,
          "circle-radius",
          dotRadius * 2.4,
        );
      }
      if (hasMapLayer(map, `${sourceId}-labels`)) {
        map.setLayoutProperty(`${sourceId}-labels`, "text-size", labelSize);
      }
    }

    return () => {
      if (!isMapStyleReady(map)) {
        return;
      }

      removeMapLayer(map, `${sourceId}-labels`);
      removeMapLayer(map, `${sourceId}-dots`);
      removeMapLayer(map, `${sourceId}-glow`);
      removeMapSource(map, sourceId);
    };
  }, [dotColor, dotRadius, glowColor, labelSize, map, markers, sourceId]);

  useEffect(() => {
    if (!isMapStyleReady(map)) {
      return;
    }

    applyMarkerReveal({ map, sourceId, dotRadius, revealProgress });
  }, [dotRadius, map, revealProgress, sourceId]);

  return null;
};
