import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Box } from '@mui/material';
import { contours } from 'd3-contour';
import { scaleSequential } from 'd3-scale';
import { interpolateYlOrRd } from 'd3-scale-chromatic';

interface DataPoint {
  latitude: number;
  longitude: number;
  value?: number;
  [key: string]: any;
}

interface LeafletContourMapProps {
  data: DataPoint[];
  valueColumn?: string;
}

const LeafletContourMap = ({ data, valueColumn = 'value' }: LeafletContourMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const contoursLayerRef = useRef<L.LayerGroup | null>(null);
  const legendRef = useRef<L.Control | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || data.length === 0) return;

    // Initialize map if not exists
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([0, 0], 2);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapRef.current);
      
      contoursLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    // Clear previous contours and legend
    if (contoursLayerRef.current) {
      contoursLayerRef.current.clearLayers();
    }
    if (legendRef.current && mapRef.current) {
      mapRef.current.removeControl(legendRef.current);
      legendRef.current = null;
    }

    // Extract values
    const points = data.map(d => ({
      lat: d.latitude,
      lon: d.longitude,
      value: Number(d[valueColumn]) || d.value || 1
    }));

    const values = points.map(p => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    // Calculate bounds
    const lats = points.map(p => p.lat);
    const lons = points.map(p => p.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    // Create grid for interpolation using Inverse Distance Weighting
    const gridWidth = 100;
    const gridHeight = 100;
    const gridData = new Array(gridWidth * gridHeight);

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const lat = minLat + (y / gridHeight) * (maxLat - minLat);
        const lon = minLon + (x / gridWidth) * (maxLon - minLon);
        
        // Inverse Distance Weighting interpolation
        let sumValues = 0;
        let sumWeights = 0;
        
        points.forEach(point => {
          const distance = Math.sqrt(
            Math.pow(point.lat - lat, 2) + Math.pow(point.lon - lon, 2)
          );
          
          if (distance < 0.0001) {
            // Point is very close, use its value directly
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
    const numLevels = 10;
    const thresholds = [];
    for (let i = 1; i <= numLevels; i++) {
      thresholds.push(minVal + (i * (maxVal - minVal) / numLevels));
    }

    const contourGenerator = contours()
      .size([gridWidth, gridHeight])
      .thresholds(thresholds);

    const contourData = contourGenerator(gridData);

    // Color scale
    const colorScale = scaleSequential(interpolateYlOrRd)
      .domain([minVal, maxVal]);

    // Add contours to map
    contourData.forEach((contour) => {
      const geoJsonContour = contourToGeoJSON(contour, minLon, maxLon, minLat, maxLat, gridWidth, gridHeight);
      
      const color = colorScale(contour.value);
      
      L.geoJSON(geoJsonContour, {
        style: {
          color: color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.2,
          opacity: 0.8
        }
      }).bindPopup(`Value: ${contour.value.toFixed(2)}`).addTo(contoursLayerRef.current!);
    });

    // Add legend
    if (mapRef.current) {
      legendRef.current = createLegend(valueColumn, minVal, maxVal, colorScale);
      legendRef.current.addTo(mapRef.current);
    }

    // Fit bounds
    if (data.length > 0) {
      const bounds = L.latLngBounds(data.map(d => [d.latitude, d.longitude] as [number, number]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [data, valueColumn]);

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 400, position: 'relative' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </Box>
  );
};

function contourToGeoJSON(
  contour: any,
  minLon: number,
  maxLon: number,
  minLat: number,
  maxLat: number,
  gridWidth: number,
  gridHeight: number
) {
  const lonRange = maxLon - minLon;
  const latRange = maxLat - minLat;

  // D3 contour coordinates are [x, y] in grid space
  // We need to convert to [lng, lat] in geographic space
  const features = contour.coordinates.map((multiPolygon: any) => {
    const rings = multiPolygon.map((ring: any) =>
      ring.map((point: any) => {
        // Convert grid coordinates to geographic coordinates
        const lng = minLon + (point[0] / gridWidth) * lonRange;
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

function createLegend(title: string, min: number, max: number, colorScale: any): L.Control {
  const legend = new L.Control({ position: 'bottomright' });
  
  legend.onAdd = function() {
    const div = L.DomUtil.create('div', 'info legend');
    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';
    div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    div.style.fontSize = '12px';
    
    const numSteps = 5;
    let html = `<div style="font-weight: bold; margin-bottom: 8px;">${title}</div>`;
    
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
    
    div.innerHTML = html;
    return div;
  };
  
  return legend;
}

export default LeafletContourMap;
