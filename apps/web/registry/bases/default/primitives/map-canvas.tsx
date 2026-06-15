import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import type { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  createMapInstance,
  DEFAULT_MAP_STYLE,
  type LngLat,
  type MapInitOptions,
} from "@/remotion/lib/map-utils";

export type MapCanvasProps = {
  center: LngLat;
  zoom?: number;
  style?: string;
  onMapReady?: (map: Map) => void;
  backgroundColor?: string;
};

export const MapCanvas: React.FC<MapCanvasProps> = ({
  center,
  zoom = 7,
  style,
  onMapReady,
  backgroundColor = "#0c1220",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { delayRender, continueRender } = useDelayRender();
  const { width, height } = useVideoConfig();
  const [map, setMap] = useState<Map | null>(null);
  const [loadingHandle] = useState(() => delayRender("Loading map"));

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const options: MapInitOptions = {
      center,
      zoom,
      style: style ?? DEFAULT_MAP_STYLE,
    };
    const mapInstance = createMapInstance(
      containerRef.current,
      width,
      height,
      options,
    );

    mapInstance.on("load", () => {
      mapInstance.jumpTo({ center, zoom });
      mapInstance.once("idle", () => {
        setMap(mapInstance);
        onMapReady?.(mapInstance);
        continueRender(loadingHandle);
      });
    });
  }, [
    center,
    continueRender,
    height,
    loadingHandle,
    onMapReady,
    style,
    width,
    zoom,
  ]);

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <div
        ref={containerRef}
        style={{
          width,
          height,
          position: "absolute",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.08)",
        }}
      />
    </AbsoluteFill>
  );
};
