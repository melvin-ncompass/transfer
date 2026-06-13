import { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl';
import { Box } from '@mui/material';
import maplibregl from 'maplibre-gl';

interface DataPoint {
  latitude: number;
  longitude: number;
  value?: number;
  [key: string]: any;
}

interface DeckGLChoroplethProps {
  data: DataPoint[];
}

const DeckGLChoropleth = ({ data }: DeckGLChoroplethProps) => {
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 2,
    pitch: 0,
    bearing: 0,
  });

  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(worldData => {
        if ((window as any).topojson) {
          const countries = (window as any).topojson.feature(worldData, worldData.objects.countries);
          setGeoData(countries);
        }
      });
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      const avgLat = data.reduce((sum, d) => sum + d.latitude, 0) / data.length;
      const avgLng = data.reduce((sum, d) => sum + d.longitude, 0) / data.length;
      setViewState(prev => ({
        ...prev,
        latitude: avgLat,
        longitude: avgLng,
        zoom: 4,
      }));
    }
  }, [data]);

  const layers = geoData ? [
    new GeoJsonLayer({
      id: 'geojson-layer',
      data: geoData,
      pickable: true,
      stroked: true,
      filled: true,
      extruded: false,
      lineWidthScale: 20,
      lineWidthMinPixels: 1,
      getFillColor: () => [Math.random() * 200 + 55, Math.random() * 100 + 100, 200, 180],
      getLineColor: [80, 80, 80],
      getLineWidth: 1,
    }),
  ] : [];

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

export default DeckGLChoropleth;


