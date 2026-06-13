import { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Map } from 'react-map-gl';
import { Box } from '@mui/material';
import maplibregl from 'maplibre-gl';

interface DataPoint {
  latitude: number;
  longitude: number;
  value?: number;
  [key: string]: any;
}

interface DeckGLHeatmapProps {
  data: DataPoint[];
}

const DeckGLHeatmap = ({ data }: DeckGLHeatmapProps) => {
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 2,
    pitch: 0,
    bearing: 0,
  });

  useEffect(() => {
    if (data.length > 0) {
      const avgLat = data.reduce((sum, d) => sum + d.latitude, 0) / data.length;
      const avgLng = data.reduce((sum, d) => sum + d.longitude, 0) / data.length;
      setViewState(prev => ({
        ...prev,
        latitude: avgLat,
        longitude: avgLng,
        zoom: 6,
      }));
    }
  }, [data]);

  const layers = [
    new HeatmapLayer({
      id: 'heatmap-layer',
      data,
      pickable: false,
      getPosition: (d: DataPoint) => [d.longitude, d.latitude],
      getWeight: (d: DataPoint) => d.value || 1,
      radiusPixels: 60,
      intensity: 1,
      threshold: 0.05,
    }),
  ];

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 400, position: 'relative' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
      >
        <Map
          mapLib={maplibregl}
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        />
      </DeckGL>
    </Box>
  );
};

export default DeckGLHeatmap;


