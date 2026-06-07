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
  dotColor = "#f03b20",
  dotRadius = 12,
  labelSize = 28,
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
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 4,
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
          "text-color": "#111111",
          "text-halo-color": "#ffffff",
          "text-halo-width": 3,
        },
      });
    } else {
      const source = map.getSource(sourceId) as GeoJSONSource | undefined;
      source?.setData(markers);
    }
  }, [dotColor, dotRadius, labelSize, map, markers, sourceId]);

  return null;
};
