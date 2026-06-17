import { loadFont } from "@remotion/google-fonts/Inter";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
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
  mapVignetteStyle,
  MAP_THEME,
  type LngLat,
} from "@/remotion/lib/map-utils";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

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

export const MapFlight: React.FC<MapFlightProps> = ({
  from = DEMO_ROUTE.from,
  to = DEMO_ROUTE.to,
  fromLabel,
  toLabel,
  backgroundColor = MAP_THEME.background,
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
        { position: from, name: "" },
        { position: to, name: "" },
      ]),
    [from, to],
  );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const mapInstance = createMapInstance(
      containerRef.current,
      width,
      height,
      { center: from, zoom: 5 },
    );

    mapInstance.on("load", () => {
      mapInstance.jumpTo({ center: from, zoom: 5 });
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
      easing: EASING.editorial,
    });
    const cameraAltitudeMeters = interpolate(
      timelineProgress,
      [0, 0.28, 0.74, 1],
      [180000, 2200000, 2200000, 180000],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASING.editorial,
      },
    );
    const cameraLatitudeOffset = interpolate(
      timelineProgress,
      [0, 0.28, 0.74, 1],
      [1.1, 8, 8, 1.1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASING.editorial,
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
    easing: EASING.editorial,
  });
  const safe = getSafeAreaPadding({ width, height });
  const showLabels = Boolean(fromLabel || toLabel);
  const fromReveal = interpolate(timelineProgress, [0, 0.14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });
  const toReveal = interpolate(timelineProgress, [0.78, 0.94], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <div
        ref={containerRef}
        style={{ width, height, position: "absolute" }}
      />
      <MapRoute map={map} route={targetRoute} progress={routeProgress} />
      <MapMarkers map={map} markers={markers} revealProgress={1} />
      <div style={mapVignetteStyle} />
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
            <EndpointLabel label={fromLabel} reveal={fromReveal} width={width} />
          ) : null}
          {toLabel ? (
            <EndpointLabel label={toLabel} reveal={toReveal} width={width} />
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const EndpointLabel: React.FC<{
  label: string;
  reveal: number;
  width: number;
}> = ({ label, reveal, width }) => (
  <div
    style={{
      opacity: reveal,
      transform: `translateY(${(1 - reveal) * 12}px)`,
      padding: `${scaleFont(10, width)}px ${scaleFont(18, width)}px`,
      borderRadius: 12,
      background: "rgba(8, 8, 16, 0.82)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      color: MAP_THEME.label,
      fontSize: scaleFont(26, width),
      fontWeight: 700,
      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
    }}
  >
    <span
      style={{
        display: "inline-block",
        borderBottom: `2px solid ${MAP_THEME.marker}`,
        paddingBottom: 2,
      }}
    >
      {label}
    </span>
  </div>
);
