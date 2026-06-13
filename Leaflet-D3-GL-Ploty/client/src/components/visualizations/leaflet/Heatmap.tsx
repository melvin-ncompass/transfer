// Note: This file needs to be recreated based on the original Heatmap.tsx from earlier in the conversation
// For now, create a placeholder that will be completed

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { Box } from '@mui/material';

interface DataPoint {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

interface HeatmapProps {
  data: DataPoint[];
}

const Heatmap = ({ data }: HeatmapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || data.length === 0) return;

    // Initialize map if not already initialized
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([0, 0], 2);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    // Center map on data
    if (data.length > 0) {
      const latLngs = data.map(d => [d.latitude, d.longitude] as [number, number]);
      const bounds = L.latLngBounds(latLngs.map(ll => L.latLng(ll[0], ll[1])));
      mapRef.current.fitBounds(bounds);
    }

    // Add heatmap layer
    const heatData = data.map(d => [d.latitude, d.longitude, 1] as [number, number, number]);
    
    (L as any).heatLayer(heatData, {
      radius: 80,
      blur: 50,
      maxZoom: 17,
      max: 1.0,
      minOpacity: 0.05,
      gradient: {
        0.0: 'rgba(0, 0, 0, 0)',
        0.1: 'rgba(75, 0, 130, 0.15)',
        0.2: 'rgba(139, 0, 0, 0.25)',
        0.3: 'rgba(255, 0, 0, 0.35)',
        0.4: 'rgba(255, 69, 0, 0.45)',
        0.5: 'rgba(255, 140, 0, 0.55)',
        0.6: 'rgba(255, 165, 0, 0.65)',
        0.7: 'rgba(255, 215, 0, 0.75)',
        0.8: 'rgba(255, 255, 0, 0.85)',
        1.0: 'rgba(255, 255, 224, 0.95)',
      },
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [data]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: 400 }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          bgcolor: 'white',
          p: 2,
          borderRadius: 1,
          boxShadow: 2,
          zIndex: 1000,
        }}
      >
        <Box sx={{ fontWeight: 'bold', mb: 1 }}>Density Heatmap</Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4B0082' }} />
            <Box sx={{ fontSize: '12px' }}>Low</Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FF0000' }} />
            <Box sx={{ fontSize: '12px' }}>Med</Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FFA500' }} />
            <Box sx={{ fontSize: '12px' }}>High</Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FFFF00' }} />
            <Box sx={{ fontSize: '12px' }}>Max</Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Heatmap;


