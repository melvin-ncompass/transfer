import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface DataPoint {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

interface DeckGLContourMapProps {
  data: DataPoint[];
  valueColumn?: string;
}

const DeckGLContourMap = ({ data, valueColumn = 'value' }: DeckGLContourMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    containerRef.current.innerHTML = '';

    // Extract values and calculate thresholds
    const values = data.map(d => Number(d[valueColumn]) || d.value || 1);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const step = (maxVal - minVal) / 8;

    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://unpkg.com/deck.gl@8.9.0/dist.min.js"></script>
        <script src="https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.js"></script>
        <link href="https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.css" rel="stylesheet" />
        <style>
          body { margin: 0; padding: 0; overflow: hidden; font-family: Arial, sans-serif; }
          #container { width: 100vw; height: 100vh; position: relative; }
          #legend {
            position: absolute;
            bottom: 30px;
            right: 10px;
            background: white;
            padding: 12px;
            border-radius: 5px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            z-index: 1;
            font-size: 12px;
          }
          .legend-item {
            display: flex;
            align-items: center;
            margin: 3px 0;
          }
          .legend-color {
            width: 25px;
            height: 15px;
            margin-right: 5px;
            border: 1px solid #ccc;
          }
        </style>
      </head>
      <body>
        <div id="container"></div>
        <div id="legend"></div>
        <script>
          const {DeckGL, ContourLayer} = deck;
          
          const rawData = ${JSON.stringify(data)};
          const valueColumn = '${valueColumn}';
          
          // Prepare data
          const values = rawData.map(d => Number(d[valueColumn]) || d.value || 1);
          const minVal = ${minVal};
          const maxVal = ${maxVal};
          const step = ${step};
          
          const pointsData = rawData.map(d => ({
            position: [d.longitude, d.latitude],
            weight: Number(d[valueColumn]) || d.value || 1
          }));
          
          // Color interpolation function (Yellow-Orange-Red)
          function getColor(value, min, max) {
            const t = (value - min) / (max - min);
            if (t < 0.2) return [255, 255, 178];  // Light yellow
            if (t < 0.4) return [254, 204, 92];   // Yellow
            if (t < 0.6) return [253, 141, 60];   // Orange
            if (t < 0.8) return [240, 59, 32];    // Red-orange
            return [189, 0, 38];                  // Dark red
          }
          
          // Generate contour configuration
          const contourLevels = [];
          for (let i = 1; i <= 8; i++) {
            const threshold = minVal + (i * step);
            const color = getColor(threshold, minVal, maxVal);
            contourLevels.push({
              threshold: threshold,
              color: color,
              strokeWidth: 2
            });
          }
          
          const contourLayer = new ContourLayer({
            id: 'contour-layer',
            data: pointsData,
            getPosition: d => d.position,
            getWeight: d => d.weight,
            contours: contourLevels,
            cellSize: 2000,
            aggregation: 'SUM',
            gpuAggregation: true
          });

          // Calculate map center
          const lats = rawData.map(d => d.latitude);
          const lngs = rawData.map(d => d.longitude);
          const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
          const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

          new DeckGL({
            container: 'container',
            mapStyle: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
            initialViewState: {
              longitude: centerLng,
              latitude: centerLat,
              zoom: 6,
              pitch: 0,
              bearing: 0
            },
            controller: true,
            layers: [contourLayer]
          });
          
          // Create legend
          const legend = document.getElementById('legend');
          let legendHTML = '<div style="font-weight: bold; margin-bottom: 8px;">${valueColumn}</div>';
          
          for (let i = 5; i >= 0; i--) {
            const value = minVal + (i / 5) * (maxVal - minVal);
            const color = getColor(value, minVal, maxVal);
            const colorStr = 'rgb(' + color.join(',') + ')';
            legendHTML += '<div class="legend-item">';
            legendHTML += '<div class="legend-color" style="background: ' + colorStr + ';"></div>';
            legendHTML += '<span style="font-size: 11px;">' + value.toFixed(2) + '</span>';
            legendHTML += '</div>';
          }
          
          legend.innerHTML = legendHTML;
        </script>
      </body>
      </html>
    `;

    iframe.srcdoc = html;
    containerRef.current.appendChild(iframe);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [data, valueColumn]);

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        minHeight: 400 
      }}
    />
  );
};

export default DeckGLContourMap;
