import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Box } from '@mui/material';

interface DataPoint {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

interface LeafletPathMapProps {
  data: DataPoint[];
}

const LeafletPathMap = ({ data }: LeafletPathMapProps) => {
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

    // Create path from data points
    const latLngs = data.map(d => [d.latitude, d.longitude] as [number, number]);

    L.polyline(latLngs, {
      color: '#2196f3',
      weight: 3,
      opacity: 0.8,
      smoothFactor: 1
    }).addTo(mapRef.current);

    // Add markers at each point
    data.forEach((d, i) => {
      L.circleMarker([d.latitude, d.longitude], {
        radius: 5,
        fillColor: i === 0 ? '#4caf50' : i === data.length - 1 ? '#f44336' : '#2196f3',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(mapRef.current!);
    });

    // Fit bounds
    if (data.length > 0) {
      const bounds = L.latLngBounds(latLngs);
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

export default LeafletPathMap;

