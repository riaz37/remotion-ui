import type { Feature, LineString } from "geojson";
import { useEffect } from "react";
import {
  Easing,
  interpolate,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import type { GeoJSONSource, Map } from "maplibre-gl";
import * as turf from "@turf/turf";
import {
  clampProgress,
  hasMapLayer,
  hasMapSource,
  isMapStyleReady,
  MAP_THEME,
  pointAlongRoute,
  removeMapLayer,
  removeMapSource,
  sliceRouteByProgress,
} from "@/remotion/lib/map-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type MapRouteProps = {
  map: Map | null;
  route: Feature<LineString>;
  progress?: number;
  lineColor?: string;
  glowColor?: string;
  lineWidth?: number;
  sourceId?: string;
  layerId?: string;
  showHead?: boolean;
};

export const MapRoute: React.FC<MapRouteProps> = ({
  map,
  route,
  progress: progressProp,
  lineColor = MAP_THEME.route,
  glowColor = MAP_THEME.routeGlow,
  lineWidth = 5,
  sourceId = "trace",
  layerId = "trace-line",
  showHead = true,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { delayRender, continueRender } = useDelayRender();

  const progress =
    progressProp ??
    clampProgress(
      interpolate(frame, [8, durationInFrames - 12], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASING.enter,
      }),
    );

  useEffect(() => {
    if (!isMapStyleReady(map)) {
      return;
    }

    const partialRoute = sliceRouteByProgress(route, 0);
    const headSourceId = `${sourceId}-head`;

    if (!hasMapSource(map, sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: partialRoute,
      });

      map.addLayer({
        id: `${layerId}-glow`,
        type: "line",
        source: sourceId,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": glowColor,
          "line-width": lineWidth * 2.8,
          "line-blur": 1.2,
          "line-opacity": 0.72,
        },
      });

      map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": lineColor,
          "line-width": lineWidth,
          "line-opacity": 0.96,
        },
      });

      if (showHead) {
        map.addSource(headSourceId, {
          type: "geojson",
          data: turf.featureCollection([
            turf.point(pointAlongRoute(route, 0)),
          ]),
        });

        map.addLayer({
          id: `${layerId}-head-glow`,
          type: "circle",
          source: headSourceId,
          paint: {
            "circle-color": glowColor,
            "circle-radius": 14,
            "circle-blur": 0.4,
            "circle-opacity": 0.7,
          },
        });

        map.addLayer({
          id: `${layerId}-head`,
          type: "circle",
          source: headSourceId,
          paint: {
            "circle-color": MAP_THEME.routeHead,
            "circle-radius": 6,
            "circle-stroke-color": lineColor,
            "circle-stroke-width": 3,
          },
        });
      }
    } else {
      if (hasMapLayer(map, layerId)) {
        map.setPaintProperty(layerId, "line-color", lineColor);
        map.setPaintProperty(layerId, "line-width", lineWidth);
      }
      if (hasMapLayer(map, `${layerId}-glow`)) {
        map.setPaintProperty(`${layerId}-glow`, "line-color", glowColor);
        map.setPaintProperty(`${layerId}-glow`, "line-width", lineWidth * 2.8);
      }
    }

    return () => {
      if (!isMapStyleReady(map)) {
        return;
      }

      removeMapLayer(map, `${layerId}-head`);
      removeMapLayer(map, `${layerId}-head-glow`);
      removeMapLayer(map, layerId);
      removeMapLayer(map, `${layerId}-glow`);
      removeMapSource(map, headSourceId);
      removeMapSource(map, sourceId);
    };
  }, [
    glowColor,
    layerId,
    lineColor,
    lineWidth,
    map,
    route,
    showHead,
    sourceId,
  ]);

  useEffect(() => {
    if (!isMapStyleReady(map)) {
      return;
    }

    const handle = delayRender("Rendering map route");
    const partialRoute = sliceRouteByProgress(route, progress);
    const source = map.getSource(sourceId) as GeoJSONSource | undefined;
    source?.setData(partialRoute);

    if (showHead && progress > 0.01) {
      const head = pointAlongRoute(route, progress);
      const headSource = map.getSource(`${sourceId}-head`) as
        | GeoJSONSource
        | undefined;
      headSource?.setData(turf.featureCollection([turf.point(head)]));
      if (hasMapLayer(map, `${layerId}-head`)) {
        map.setPaintProperty(`${layerId}-head`, "circle-opacity", 1);
      }
      if (hasMapLayer(map, `${layerId}-head-glow`)) {
        map.setPaintProperty(`${layerId}-head-glow`, "circle-opacity", 0.7);
      }
    } else if (showHead) {
      if (hasMapLayer(map, `${layerId}-head`)) {
        map.setPaintProperty(`${layerId}-head`, "circle-opacity", 0);
      }
      if (hasMapLayer(map, `${layerId}-head-glow`)) {
        map.setPaintProperty(`${layerId}-head-glow`, "circle-opacity", 0);
      }
    }

    const lineOpacity = interpolate(progress, [0, 0.04], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    if (hasMapLayer(map, layerId)) {
      map.setPaintProperty(layerId, "line-opacity", lineOpacity * 0.96);
    }
    if (hasMapLayer(map, `${layerId}-glow`)) {
      map.setPaintProperty(`${layerId}-glow`, "line-opacity", lineOpacity * 0.72);
    }

    map.once("idle", () => continueRender(handle));
    map.triggerRepaint();
  }, [
    continueRender,
    delayRender,
    layerId,
    map,
    progress,
    route,
    showHead,
    sourceId,
  ]);

  return null;
};
