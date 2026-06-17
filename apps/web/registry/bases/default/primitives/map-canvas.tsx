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
  isMapStyleReady,
  mapVignetteStyle,
  MAP_THEME,
  type LngLat,
} from "@/remotion/lib/map-utils";

export type MapCanvasProps = {
  center: LngLat;
  zoom?: number;
  style?: string;
  onMapReady?: (map: Map) => void;
  backgroundColor?: string;
  showVignette?: boolean;
};

export const MapCanvas: React.FC<MapCanvasProps> = ({
  center,
  zoom = 7,
  style,
  onMapReady,
  backgroundColor = MAP_THEME.background,
  showVignette = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  const { delayRender, continueRender } = useDelayRender();
  const { width, height } = useVideoConfig();
  const [loadingHandle] = useState(() => delayRender("Loading map"));

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
    <AbsoluteFill style={{ backgroundColor }}>
      <div
        ref={containerRef}
        style={{
          width,
          height,
          position: "absolute",
        }}
      />
      {showVignette ? <div style={mapVignetteStyle} /> : null}
    </AbsoluteFill>
  );
};
