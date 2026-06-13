import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface DataPoint {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

interface DeckGLPathMapProps {
  data: DataPoint[];
}

const DeckGLPathMap = ({ data }: DeckGLPathMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    containerRef.current.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    // Create path from all points
    const pathData = [{
      path: data.map(d => [d.longitude, d.latitude]),
      name: 'Path',
      color: [255, 0, 128]
    }];

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
          const {DeckGL, PathLayer, ScatterplotLayer} = deck;
          
          const pathData = ${JSON.stringify(pathData)};
          const points = ${JSON.stringify(data)};
          
          const pathLayer = new PathLayer({
            id: 'path-layer',
            data: pathData,
            getPath: d => d.path,
            getColor: d => d.color,
            getWidth: 5,
            widthMinPixels: 3,
            pickable: true,
            billboard: false
          });

          const scatterLayer = new ScatterplotLayer({
            id: 'scatter-layer',
            data: points,
            getPosition: d => [d.longitude, d.latitude],
            getFillColor: [0, 128, 255],
            getRadius: 3000,
            pickable: true
          });

          new DeckGL({
            container: 'container',
            mapStyle: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
            initialViewState: {
              longitude: ${data[0]?.longitude || 36.8219},
              latitude: ${data[0]?.latitude || -1.2921},
              zoom: 9,
              pitch: 0,
              bearing: 0
            },
            controller: true,
            layers: [pathLayer, scatterLayer],
            getTooltip: ({object}) => object && (object.name || 'Point')
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

export default DeckGLPathMap;

