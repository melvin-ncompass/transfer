import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Box } from '@mui/material';

interface DataPoint {
  latitude: number;
  longitude: number;
  value?: number;
  [key: string]: any;
}

interface LeafletChoroplethProps {
  data: DataPoint[];
}

const LeafletChoropleth = ({ data }: LeafletChoroplethProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || data.length === 0) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([0, 0], 2);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    // Create grid-based choropleth
    const gridSize = 0.5; // degrees
    const valueMap = new Map<string, number>();

    data.forEach(d => {
      const gridLat = Math.floor(d.latitude / gridSize) * gridSize;
      const gridLng = Math.floor(d.longitude / gridSize) * gridSize;
      const key = `${gridLat},${gridLng}`;
      valueMap.set(key, (valueMap.get(key) || 0) + (d.value || 1));
    });

    const maxValue = Math.max(...Array.from(valueMap.values()));

    // Draw rectangles for each grid cell
    valueMap.forEach((value, key) => {
      const [lat, lng] = key.split(',').map(Number);
      const normalizedValue = value / maxValue;
      
      const color = `rgba(${Math.floor(255 * normalizedValue)}, ${Math.floor(100 * (1 - normalizedValue))}, ${Math.floor(50 * (1 - normalizedValue))}, 0.6)`;

      L.rectangle(
        [[lat, lng], [lat + gridSize, lng + gridSize]],
        {
          color: color,
          fillColor: color,
          fillOpacity: 0.6,
          weight: 1
        }
      ).addTo(mapRef.current!);
    });

    // Fit bounds
    if (data.length > 0) {
      const bounds = L.latLngBounds(data.map(d => [d.latitude, d.longitude] as [number, number]));
      mapRef.current.fitBounds(bounds);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [data]);

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 400, position: 'relative' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </Box>
  );
};

export default LeafletChoropleth;


