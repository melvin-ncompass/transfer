import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Box } from '@mui/material';

interface DataPoint {
  latitude: number;
  longitude: number;
  value?: number;
  [key: string]: any;
}

interface LeafletContourMapProps {
  data: DataPoint[];
}

const LeafletContourMap = ({ data }: LeafletContourMapProps) => {
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

    // Create contour-like circles with varying sizes based on value
    data.forEach(d => {
      const value = d.value || 1;
      const maxValue = Math.max(...data.map(p => p.value || 1));
      const normalizedValue = value / maxValue;

      // Create multiple rings for contour effect
      for (let i = 3; i >= 1; i--) {
        L.circle([d.latitude, d.longitude], {
          radius: (normalizedValue * 5000 * i),
          fillColor: `rgba(0, 123, 255, ${0.2 / i})`,
          color: `rgba(0, 123, 255, ${0.5 / i})`,
          weight: 1,
          fillOpacity: 0.3 / i
        }).addTo(mapRef.current!);
      }
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

export default LeafletContourMap;


