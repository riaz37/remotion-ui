import { loadFont } from "@remotion/google-fonts/Inter";
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
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

export type MapFlightProps = {
  from?: LngLat;
  to?: LngLat;
  fromLabel?: string;
  toLabel?: string;
  backgroundColor?: string;
};

const COLORS = {
  bg: "#0a1420",
  label: "#e4e4e7",
  muted: "#a1a1aa",
  pill: "rgba(8,12,20,0.82)",
} as const;

export const MapFlight: React.FC<MapFlightProps> = ({
  from = DEMO_ROUTE.from,
  to = DEMO_ROUTE.to,
  fromLabel,
  toLabel,
  backgroundColor = COLORS.bg,
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
        { position: from, name: fromLabel ?? "" },
        { position: to, name: toLabel ?? "" },
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
  const safe = getSafeAreaPadding({ width, height });
  const showLabels = Boolean(fromLabel || toLabel);

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <div
        ref={containerRef}
        style={{ width, height, position: "absolute" }}
      />
      <MapRoute map={map} route={targetRoute} progress={routeProgress} />
      <MapMarkers map={map} markers={markers} />
      {showLabels ? (
        <div
          style={{
            position: "absolute",
            left: safe.paddingLeft,
            right: safe.paddingRight,
            bottom: safe.paddingBottom,
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            fontFamily,
            pointerEvents: "none",
          }}
        >
          {fromLabel ? (
            <div
              style={{
                padding: `${scaleFont(10, width)}px ${scaleFont(18, width)}px`,
                borderRadius: 999,
                background: COLORS.pill,
                color: COLORS.label,
                fontSize: scaleFont(26, width),
                fontWeight: 700,
              }}
            >
              {fromLabel}
            </div>
          ) : null}
          {toLabel ? (
            <div
              style={{
                padding: `${scaleFont(10, width)}px ${scaleFont(18, width)}px`,
                borderRadius: 999,
                background: COLORS.pill,
                color: COLORS.label,
                fontSize: scaleFont(26, width),
                fontWeight: 700,
              }}
            >
              {toLabel}
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
