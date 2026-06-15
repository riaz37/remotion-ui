import type { FeatureCollection, Point } from "geojson";
import { useEffect } from "react";
import type { GeoJSONSource, Map } from "maplibre-gl";

export type MapMarkersProps = {
  map: Map | null;
  markers: FeatureCollection<Point>;
  dotColor?: string;
  dotRadius?: number;
  labelSize?: number;
  sourceId?: string;
};

export const MapMarkers: React.FC<MapMarkersProps> = ({
  map,
  markers,
  dotColor = "#6366f1",
  dotRadius = 10,
  labelSize = 26,
  sourceId = "city-markers",
}) => {
  useEffect(() => {
    if (!map) return;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: markers,
      });

      map.addLayer({
        id: `${sourceId}-dots`,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-color": dotColor,
          "circle-radius": dotRadius,
          "circle-stroke-color": "#f8fafc",
          "circle-stroke-width": 3,
          "circle-blur": 0.2,
        },
      });

      map.addLayer({
        id: `${sourceId}-labels`,
        type: "symbol",
        source: sourceId,
        layout: {
          "text-allow-overlap": true,
          "text-anchor": "top",
          "text-field": ["get", "name"],
          "text-offset": [0, 0.9],
          "text-size": labelSize,
        },
        paint: {
          "text-color": "#f8fafc",
          "text-halo-color": "#0c1220",
          "text-halo-width": 2.5,
        },
      });
    } else {
      const source = map.getSource(sourceId) as GeoJSONSource | undefined;
      source?.setData(markers);
    }
  }, [dotColor, dotRadius, labelSize, map, markers, sourceId]);

  return null;
};
