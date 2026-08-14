import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import type { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  createMapInstance,
  isMapStyleReady,
  mapVignetteStyle,
  MAP_THEME,
  type LngLat,
} from "@/remotion/lib/map-utils";
import { DURATION } from "@/remotion/lib/motion-tokens";
import { enterProgress } from "@/remotion/lib/timing";

export type MapCanvasProps = {
  center: LngLat;
  zoom?: number;
  style?: string;
  onMapReady?: (map: Map) => void;
  backgroundColor?: string;
  showVignette?: boolean;
  /** Fade + settle the plate in on mount. Disable when compositing under other primitives that already animate the frame. */
  animate?: boolean;
};

export const MapCanvas: React.FC<MapCanvasProps> = ({
  center,
  zoom = 7,
  style,
  onMapReady,
  backgroundColor = MAP_THEME.background,
  showVignette = true,
  animate = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  const { delayRender, continueRender } = useDelayRender();
  const { width, height } = useVideoConfig();
  const [loadingHandle] = useState(() => delayRender("Loading map"));
  const frame = useCurrentFrame();
  const reveal = animate ? enterProgress(frame, 0, DURATION.normal) : 1;

  onMapReadyRef.current = onMapReady;

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const mapInstance = createMapInstance(containerRef.current, width, height, {
      center,
      zoom,
      style,
    });
    mapRef.current = mapInstance;

    const notifyReady = () => {
      if (!isMapStyleReady(mapInstance)) {
        return;
      }

      mapInstance.jumpTo({ center, zoom });
      mapInstance.once("idle", () => {
        onMapReadyRef.current?.(mapInstance);
        continueRender(loadingHandle);
      });
    };

    if (mapInstance.loaded()) {
      notifyReady();
    } else {
      mapInstance.on("load", notifyReady);
    }
  }, [continueRender, height, loadingHandle, style, width, zoom]);

  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!isMapStyleReady(mapInstance) || !mapInstance.loaded()) {
      return;
    }

    mapInstance.jumpTo({ center, zoom });
    mapInstance.triggerRepaint();
  }, [center, zoom]);

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      <div
        ref={containerRef}
        style={{
          width,
          height,
          position: "absolute",
          opacity: reveal,
          transform: `scale(${1.045 - reveal * 0.045})`,
        }}
      />
      {showVignette ? (
        <div style={{ ...mapVignetteStyle, opacity: reveal }} />
      ) : null}
    </AbsoluteFill>
  );
};
