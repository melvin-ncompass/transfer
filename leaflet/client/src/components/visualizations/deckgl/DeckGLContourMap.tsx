import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface DataPoint {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

interface DeckGLContourMapProps {
  data: DataPoint[];
}

const DeckGLContourMap = ({ data }: DeckGLContourMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    containerRef.current.innerHTML = '';

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
          body { margin: 0; padding: 0; overflow: hidden; }
          #container { width: 100vw; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="container"></div>
        <script>
          const {DeckGL, ContourLayer} = deck;
          
          const data = ${JSON.stringify(data.map(d => [d.longitude, d.latitude, 1]))};
          
          const contourLayer = new ContourLayer({
            id: 'contour-layer',
            data: data,
            getPosition: d => [d[0], d[1]],
            getWeight: d => d[2],
            contours: [
              {threshold: 1, color: [255, 0, 0], strokeWidth: 4},
              {threshold: 5, color: [0, 255, 0], strokeWidth: 3},
              {threshold: 10, color: [0, 0, 255], strokeWidth: 2}
            ],
            cellSize: 200,
            gpuAggregation: true
          });

          new DeckGL({
            container: 'container',
            mapStyle: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
            initialViewState: {
              longitude: ${data[0]?.longitude || 36.8219},
              latitude: ${data[0]?.latitude || -1.2921},
              zoom: 10,
              pitch: 0,
              bearing: 0
            },
            controller: true,
            layers: [contourLayer]
          });
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
  }, [data]);

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

