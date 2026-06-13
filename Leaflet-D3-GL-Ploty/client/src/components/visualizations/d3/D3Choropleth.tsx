import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Box } from '@mui/material';

interface DataPoint {
  latitude: number;
  longitude: number;
  value?: number;
  region?: string;
  [key: string]: any;
}

interface D3ChoroplethProps {
  data: DataPoint[];
}

const D3Choropleth = ({ data }: D3ChoroplethProps) => {
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
      // Create color scale
      const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, d3.max(data, d => d.value || 1) || 1]);

      // Add region markers with color-coded backgrounds
      data.forEach((point) => {
        const el = document.createElement('div');
        el.className = 'd3-choropleth-marker';
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.backgroundColor = colorScale(point.value || 1);
        el.style.opacity = '0.7';
        el.style.border = '2px solid #333';
        el.style.borderRadius = '3px';
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';

        const popup = new maplibregl.Popup({ offset: 25 }).setText(
          `${point.region || 'Region'}: ${point.value || 'N/A'}`
        );

        new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([point.longitude, point.latitude])
          .setPopup(popup)
          .addTo(map);
      });

      // Add legend
      const legendEl = document.createElement('div');
      legendEl.style.position = 'absolute';
      legendEl.style.bottom = '30px';
      legendEl.style.right = '10px';
      legendEl.style.backgroundColor = 'white';
      legendEl.style.padding = '10px';
      legendEl.style.borderRadius = '5px';
      legendEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      legendEl.style.zIndex = '1';

      const maxVal = d3.max(data, d => d.value || 1) || 1;
      legendEl.innerHTML = `
        <div style="font-size: 12px; font-weight: bold; margin-bottom: 5px;">Region Values</div>
        <div style="display: flex; align-items: center; margin: 3px 0;">
          <div style="width: 20px; height: 20px; background: ${colorScale(0)}; border: 1px solid #333; margin-right: 8px;"></div>
          <span style="font-size: 11px;">Low</span>
        </div>
        <div style="display: flex; align-items: center; margin: 3px 0;">
          <div style="width: 20px; height: 20px; background: ${colorScale(maxVal * 0.5)}; border: 1px solid #333; margin-right: 8px;"></div>
          <span style="font-size: 11px;">Medium</span>
        </div>
        <div style="display: flex; align-items: center; margin: 3px 0;">
          <div style="width: 20px; height: 20px; background: ${colorScale(maxVal)}; border: 1px solid #333; margin-right: 8px;"></div>
          <span style="font-size: 11px;">High</span>
        </div>
      `;
      mapContainerRef.current?.appendChild(legendEl);
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

export default D3Choropleth;
