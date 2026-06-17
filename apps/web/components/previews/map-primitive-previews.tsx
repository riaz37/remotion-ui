"use client";

import { useCallback, useMemo, useState } from "react";
import type { Map } from "maplibre-gl";
import { AbsoluteFill } from "remotion";
import {
  MapCanvas,
  MapMarkers,
  MapRoute,
  MapFlight,
} from "../registry-exports";
import {
  createMarkerCollection,
  DEMO_MARKERS,
  DEMO_ROUTE,
  greatCircleLine,
  isMapStyleReady,
} from "../../registry/bases/default/lib/map-utils";

export const MapCanvasPreview: React.FC = () => (
  <MapCanvas center={DEMO_ROUTE.from} zoom={4} />
);

export const MapRoutePreview: React.FC = () => {
  const [map, setMap] = useState<Map | null>(null);
  const route = useMemo(
    () => greatCircleLine(DEMO_ROUTE.from, DEMO_ROUTE.to),
    [],
  );
  const onMapReady = useCallback((nextMap: Map) => {
    if (isMapStyleReady(nextMap)) {
      setMap(nextMap);
    }
  }, []);

  return (
    <AbsoluteFill>
      <MapCanvas
        center={[-30, 48]}
        zoom={2.2}
        onMapReady={onMapReady}
      />
      <MapRoute map={map} route={route} />
    </AbsoluteFill>
  );
};

export const MapMarkersPreview: React.FC = () => {
  const [map, setMap] = useState<Map | null>(null);
  const markers = useMemo(() => createMarkerCollection(DEMO_MARKERS), []);
  const onMapReady = useCallback((nextMap: Map) => {
    if (isMapStyleReady(nextMap)) {
      setMap(nextMap);
    }
  }, []);

  return (
    <AbsoluteFill>
      <MapCanvas
        center={[-20, 48]}
        zoom={2.4}
        onMapReady={onMapReady}
      />
      <MapMarkers map={map} markers={markers} />
    </AbsoluteFill>
  );
};

export const MapFlightPreview: React.FC = () => (
  <MapFlight
    from={DEMO_ROUTE.from}
    to={DEMO_ROUTE.to}
    fromLabel="Zurich"
    toLabel="New York"
  />
);
