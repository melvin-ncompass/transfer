import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Box } from '@mui/material';

interface DataPoint {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

interface LeafletScatterMapProps {
  data: DataPoint[];
}

const LeafletScatterMap = ({ data }: LeafletScatterMapProps) => {
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

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        layer.remove();
      }
    });

    // Add scatter points
    data.forEach(d => {
      L.circleMarker([d.latitude, d.longitude], {
        radius: 6,
        fillColor: '#ff5722',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7
      }).addTo(mapRef.current!);
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

export default LeafletScatterMap;


