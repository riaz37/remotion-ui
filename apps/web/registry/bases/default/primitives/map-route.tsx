import type { Feature, LineString } from "geojson";
import { useEffect } from "react";
import { useCurrentFrame, useDelayRender, useVideoConfig } from "remotion";
import type { GeoJSONSource, Map } from "maplibre-gl";
import { interpolate } from "remotion";
import {
  clampProgress,
  sliceRouteByProgress,
} from "@/remotion/lib/map-utils";

export type MapRouteProps = {
  map: Map | null;
  route: Feature<LineString>;
  progress?: number;
  lineColor?: string;
  lineWidth?: number;
  sourceId?: string;
  layerId?: string;
};

export const MapRoute: React.FC<MapRouteProps> = ({
  map,
  route,
  progress: progressProp,
  lineColor = "#111111",
  lineWidth = 7,
  sourceId = "trace",
  layerId = "trace-line",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { delayRender, continueRender } = useDelayRender();

  const progress =
    progressProp ??
    clampProgress(
      interpolate(frame, [0, durationInFrames - 1], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    );

  useEffect(() => {
    if (!map) return;

    const partialRoute = sliceRouteByProgress(route, 0);

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: partialRoute,
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
        },
      });
    }
  }, [layerId, lineColor, lineWidth, map, route, sourceId]);

  useEffect(() => {
    if (!map) return;

    const handle = delayRender("Rendering map route");
    const partialRoute = sliceRouteByProgress(route, progress);
    const source = map.getSource(sourceId) as GeoJSONSource | undefined;
    source?.setData(partialRoute);
    map.once("idle", () => continueRender(handle));
    map.triggerRepaint();
  }, [continueRender, delayRender, map, progress, route, sourceId]);

  return null;
};
