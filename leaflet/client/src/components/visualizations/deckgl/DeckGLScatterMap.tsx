import { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl';
import { Box } from '@mui/material';
import maplibregl from 'maplibre-gl';

interface DataPoint {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

interface DeckGLScatterMapProps {
  data: DataPoint[];
}

const DeckGLScatterMap = ({ data }: DeckGLScatterMapProps) => {
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
    new ScatterplotLayer({
      id: 'scatter-layer',
      data,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 6,
      radiusMinPixels: 3,
      radiusMaxPixels: 100,
      lineWidthMinPixels: 1,
      getPosition: (d: DataPoint) => [d.longitude, d.latitude],
      getRadius: () => 100,
      getFillColor: [255, 87, 34],
      getLineColor: [255, 255, 255],
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
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        />
      </DeckGL>
    </Box>
  );
};

export default DeckGLScatterMap;


