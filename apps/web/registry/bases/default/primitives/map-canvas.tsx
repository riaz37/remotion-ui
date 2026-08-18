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

const cameraKey = (center: LngLat, zoom: number) =>
  `${center[0].toFixed(5)},${center[1].toFixed(5)}@${zoom.toFixed(4)}`;

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

  const [lng, lat] = center;
  /** Camera the instance was built with, so a moving camera does not rebuild it. */
  const initialCameraRef = useRef({ center, zoom });
  /** Last camera actually applied, so a static camera costs nothing per frame. */
  const appliedCameraRef = useRef<string | null>(null);

  onMapReadyRef.current = onMapReady;

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const initialCamera = initialCameraRef.current;
    const mapInstance = createMapInstance(containerRef.current, width, height, {
      center: initialCamera.center,
      zoom: initialCamera.zoom,
      style,
    });
    mapRef.current = mapInstance;

    const notifyReady = () => {
      if (!isMapStyleReady(mapInstance)) {
        return;
      }

      mapInstance.jumpTo(initialCamera);
      mapInstance.once("idle", () => {
        appliedCameraRef.current = cameraKey(
          initialCamera.center,
          initialCamera.zoom,
        );
        onMapReadyRef.current?.(mapInstance);
        continueRender(loadingHandle);
      });
    };

    if (mapInstance.loaded()) {
      notifyReady();
    } else {
      mapInstance.on("load", notifyReady);
    }

    return () => {
      mapRef.current = null;
      appliedCameraRef.current = null;
      mapInstance.remove();
    };
  }, [continueRender, height, loadingHandle, style, width]);

  /**
   * A camera driven off the frame has to hold the render open until MapLibre
   * has drawn the new tiles — `jumpTo` alone captures the previous view. The
   * key check keeps a fixed camera off this path entirely.
   */
  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!isMapStyleReady(mapInstance) || !mapInstance.loaded()) {
      return;
    }

    const key = cameraKey([lng, lat], zoom);
    if (appliedCameraRef.current === key) {
      return;
    }
    appliedCameraRef.current = key;

    const handle = delayRender("Settling map camera");
    mapInstance.jumpTo({ center: [lng, lat], zoom });
    mapInstance.once("idle", () => continueRender(handle));
    mapInstance.triggerRepaint();
  }, [continueRender, delayRender, lat, lng, zoom]);

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      <div
        ref={containerRef}
        style={{
          width,
          height,
          position: "absolute",
          opacity: reveal,
          scale: `${1.045 - reveal * 0.045}`,
        }}
      />
      {showVignette ? (
        <div style={{ ...mapVignetteStyle, opacity: reveal }} />
      ) : null}
    </AbsoluteFill>
  );
};
