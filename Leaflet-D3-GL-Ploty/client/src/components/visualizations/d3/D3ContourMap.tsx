import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { contours } from 'd3-contour';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Box } from '@mui/material';

interface DataPoint {
  latitude: number;
  longitude: number;
  value?: number;
  [key: string]: any;
}

interface D3ContourMapProps {
  data: DataPoint[];
  valueColumn?: string;
}

const D3ContourMap = ({ data, valueColumn = 'value' }: D3ContourMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || data.length === 0 || mapRef.current) return;

    // Calculate center and bounds
    const lats = data.map(d => d.latitude);
    const lngs = data.map(d => d.longitude);
    const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Initialize MapLibre map
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [centerLng, centerLat],
      zoom: 5,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Extract values
      const points = data.map(d => ({
        lat: d.latitude,
        lng: d.longitude,
        value: Number(d[valueColumn]) || d.value || 1
      }));

      const values = points.map(p => p.value);
      const minVal = d3.min(values) || 0;
      const maxVal = d3.max(values) || 1;
      
      // Create grid using Inverse Distance Weighting
      const gridWidth = 120;
      const gridHeight = 120;
      const gridData = new Array(gridWidth * gridHeight);

      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          const lat = minLat + (y / gridHeight) * (maxLat - minLat);
          const lng = minLng + (x / gridWidth) * (maxLng - minLng);
          
          // Inverse Distance Weighting
          let sumValues = 0;
          let sumWeights = 0;
          
          points.forEach(point => {
            const distance = Math.sqrt(
              Math.pow(point.lat - lat, 2) + Math.pow(point.lng - lng, 2)
            );
            
            if (distance < 0.0001) {
              sumValues = point.value;
              sumWeights = 1;
              return;
            }
            
            const weight = 1 / Math.pow(distance, 2);
            sumValues += point.value * weight;
            sumWeights += weight;
          });
          
          gridData[y * gridWidth + x] = sumWeights > 0 ? sumValues / sumWeights : 0;
        }
      }
      
      // Generate contours
      const numLevels = 12;
      const thresholds = d3.range(minVal, maxVal, (maxVal - minVal) / numLevels).slice(1);
      
      const contourGenerator = contours()
        .size([gridWidth, gridHeight])
        .thresholds(thresholds);
      
      const contourData = contourGenerator(gridData);
      
      // Color scale
      const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain([minVal, maxVal]);
      
      // Add contours to map
      contourData.forEach((contour, i) => {
        const geoJsonContour = contourToGeoJSON(contour, minLng, maxLng, minLat, maxLat, gridWidth, gridHeight);
        
        map.addSource(`contour-${i}`, {
          type: 'geojson',
          data: geoJsonContour as any
        });
        
        // Fill layer
        map.addLayer({
          id: `contour-fill-${i}`,
          type: 'fill',
          source: `contour-${i}`,
          paint: {
            'fill-color': colorScale(contour.value),
            'fill-opacity': 0.25
          }
        });
        
        // Line layer for contour lines
        map.addLayer({
          id: `contour-line-${i}`,
          type: 'line',
          source: `contour-${i}`,
          paint: {
            'line-color': colorScale(contour.value),
            'line-width': 2,
            'line-opacity': 0.8
          }
        });
      });
      
      // Add legend
      addD3Legend(mapContainerRef.current!, valueColumn, minVal, maxVal, colorScale);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [data, valueColumn]);

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

function contourToGeoJSON(
  contour: any,
  minLng: number,
  maxLng: number,
  minLat: number,
  maxLat: number,
  gridWidth: number,
  gridHeight: number
) {
  const lngRange = maxLng - minLng;
  const latRange = maxLat - minLat;
  
  // D3 contour coordinates are [x, y] in grid space
  // Convert to GeoJSON MultiPolygon format
  const features = contour.coordinates.map((multiPolygon: any) => {
    const rings = multiPolygon.map((ring: any) =>
      ring.map((point: any) => {
        const lng = minLng + (point[0] / gridWidth) * lngRange;
        const lat = minLat + (point[1] / gridHeight) * latRange;
        // GeoJSON uses [lng, lat] order
        return [lng, lat];
      })
    );

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: rings
      },
      properties: {
        value: contour.value
      }
    };
  });
  
  return {
    type: 'FeatureCollection',
    features: features
  };
}

function addD3Legend(container: HTMLElement, title: string, min: number, max: number, colorScale: any) {
  const legendEl = document.createElement('div');
  legendEl.style.position = 'absolute';
  legendEl.style.bottom = '30px';
  legendEl.style.right = '10px';
  legendEl.style.backgroundColor = 'white';
  legendEl.style.padding = '12px';
  legendEl.style.borderRadius = '5px';
  legendEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  legendEl.style.zIndex = '1';
  legendEl.style.fontSize = '12px';

  let html = `<div style="font-weight: bold; margin-bottom: 8px;">${title}</div>`;
  
  const numSteps = 5;
  for (let i = numSteps; i >= 0; i--) {
    const value = min + (i / numSteps) * (max - min);
    const color = colorScale(value);
    html += `
      <div style="display: flex; align-items: center; margin: 3px 0;">
        <div style="width: 25px; height: 15px; background: ${color}; margin-right: 5px; border: 1px solid #ccc;"></div>
        <span style="font-size: 11px;">${value.toFixed(2)}</span>
      </div>
    `;
  }
  
  legendEl.innerHTML = html;
  container.appendChild(legendEl);
}

export default D3ContourMap;
