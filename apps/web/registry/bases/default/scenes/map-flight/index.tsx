import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import type { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapMarkers } from "@/remotion/primitives/map-markers";
import { MapRoute } from "@/remotion/primitives/map-route";
import {
  createMapInstance,
  createMarkerCollection,
  DEMO_ROUTE,
  getCameraOptions,
  greatCircleLine,
  type LngLat,
} from "@/remotion/lib/map-utils";

export type MapFlightProps = {
  from?: LngLat;
  to?: LngLat;
  fromLabel?: string;
  toLabel?: string;
  backgroundColor?: string;
};

export const MapFlight: React.FC<MapFlightProps> = ({
  from = DEMO_ROUTE.from,
  to = DEMO_ROUTE.to,
  fromLabel = "Zurich",
  toLabel = "New York",
  backgroundColor = "#0c1929",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const { delayRender, continueRender } = useDelayRender();
  const { durationInFrames, width, height } = useVideoConfig();
  const [map, setMap] = useState<Map | null>(null);
  const [loadingHandle] = useState(() => delayRender("Loading MapLibre map"));

  const targetRoute = useMemo(() => greatCircleLine(from, to), [from, to]);
  const cameraRoute = useMemo(() => greatCircleLine(from, to), [from, to]);
  const markers = useMemo(
    () =>
      createMarkerCollection([
        { position: from, name: fromLabel },
        { position: to, name: toLabel },
      ]),
    [from, fromLabel, to, toLabel],
  );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const mapInstance = createMapInstance(
      containerRef.current,
      width,
      height,
      { center: from, zoom: 7 },
    );

    mapInstance.on("load", () => {
      mapInstance.jumpTo({ center: from, zoom: 7 });
      mapInstance.once("idle", () => {
        setMap(mapInstance);
        continueRender(loadingHandle);
      });
    });
  }, [continueRender, from, height, loadingHandle, width]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const handle = delayRender("Rendering MapLibre frame");
    const timelineProgress = interpolate(
      frame,
      [0, durationInFrames - 1],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
    const travelProgress = interpolate(timelineProgress, [0.2, 0.82], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
    const cameraAltitudeMeters = interpolate(
      timelineProgress,
      [0, 0.28, 0.74, 1],
      [180000, 2200000, 2200000, 180000],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      },
    );
    const cameraLatitudeOffset = interpolate(
      timelineProgress,
      [0, 0.28, 0.74, 1],
      [1.1, 8, 8, 1.1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      },
    );

    map.jumpTo(
      getCameraOptions(
        map,
        targetRoute,
        cameraRoute,
        travelProgress,
        cameraAltitudeMeters,
        cameraLatitudeOffset,
      ),
    );

    map.once("idle", () => continueRender(handle));
    map.triggerRepaint();
  }, [
    cameraRoute,
    continueRender,
    delayRender,
    durationInFrames,
    frame,
    map,
    targetRoute,
  ]);

  const timelineProgress = interpolate(
    frame,
    [0, durationInFrames - 1],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const routeProgress = interpolate(timelineProgress, [0.2, 0.82], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <div
        ref={containerRef}
        style={{ width, height, position: "absolute" }}
      />
      <MapRoute map={map} route={targetRoute} progress={routeProgress} />
      <MapMarkers map={map} markers={markers} />
    </AbsoluteFill>
  );
};
