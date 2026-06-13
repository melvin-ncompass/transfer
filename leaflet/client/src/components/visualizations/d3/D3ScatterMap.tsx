import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Box } from '@mui/material';

interface DataPoint {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

interface D3ScatterMapProps {
  data: DataPoint[];
}

const D3ScatterMap = ({ data }: D3ScatterMapProps) => {
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
      // Add scatter points
      data.forEach((point) => {
        const el = document.createElement('div');
        el.className = 'd3-scatter-point';
        el.style.width = '10px';
        el.style.height = '10px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#ff5722';
        el.style.border = '2px solid white';
        el.style.opacity = '0.8';
        el.style.cursor = 'pointer';
        el.style.transition = 'all 0.2s';

        el.addEventListener('mouseenter', () => {
          el.style.width = '16px';
          el.style.height = '16px';
          el.style.opacity = '1';
        });

        el.addEventListener('mouseleave', () => {
          el.style.width = '10px';
          el.style.height = '10px';
          el.style.opacity = '0.8';
        });

        new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([point.longitude, point.latitude])
          .addTo(map);
      });
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

export default D3ScatterMap;
