import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Box } from '@mui/material';

interface DataPoint {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

interface D3PathMapProps {
  data: DataPoint[];
}

const D3PathMap = ({ data }: D3PathMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || data.length === 0 || mapRef.current) return;

    // Calculate center
    const lats = data.map(d => d.latitude);
    const lngs = data.map(d => d.longitude);
    const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

    // Initialize MapLibre map
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [centerLng, centerLat],
      zoom: 5,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Create GeoJSON line from points
      const lineCoordinates = data.map(d => [d.longitude, d.latitude]);

      // Add path as a line layer
      map.addSource('path-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: lineCoordinates,
          },
        },
      });

      map.addLayer({
        id: 'path-route',
        type: 'line',
        source: 'path-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#2196f3',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });

      // Add points along the path
      data.forEach((point, index) => {
        const el = document.createElement('div');
        el.className = 'd3-path-point';
        el.style.width = '12px';
        el.style.height = '12px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#1976d2';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        const popup = new maplibregl.Popup({ offset: 15 }).setText(
          `Point ${index + 1}\nLat: ${point.latitude.toFixed(4)}\nLng: ${point.longitude.toFixed(4)}`
        );

        new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([point.longitude, point.latitude])
          .setPopup(popup)
          .addTo(map);
      });

      // Add info box
      const infoEl = document.createElement('div');
      infoEl.style.position = 'absolute';
      infoEl.style.bottom = '30px';
      infoEl.style.right = '10px';
      infoEl.style.backgroundColor = 'white';
      infoEl.style.padding = '10px';
      infoEl.style.borderRadius = '5px';
      infoEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      infoEl.style.zIndex = '1';
      infoEl.style.fontSize = '12px';

      infoEl.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">Path Information</div>
        <div>Total Points: ${data.length}</div>
        <div style="margin-top: 5px;">
          <span style="display: inline-block; width: 20px; height: 3px; background: #2196f3; vertical-align: middle;"></span>
          <span style="margin-left: 5px; font-size: 11px;">Path Route</span>
        </div>
        <div style="margin-top: 3px;">
          <span style="display: inline-block; width: 12px; height: 12px; background: #1976d2; border: 2px solid white; border-radius: 50%; vertical-align: middle;"></span>
          <span style="margin-left: 5px; font-size: 11px;">Waypoints</span>
        </div>
      `;
      mapContainerRef.current?.appendChild(infoEl);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [data]);

  return (
    <Box
      ref={mapContainerRef}
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 400,
        position: 'relative',
        '& .maplibregl-ctrl-logo': { display: 'none' },
      }}
    />
  );
};

export default D3PathMap;
