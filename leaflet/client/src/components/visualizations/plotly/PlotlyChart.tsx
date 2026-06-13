import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { Box } from '@mui/material';

interface DataPoint {
  [key: string]: any;
}

interface PlotlyChartProps {
  data: DataPoint[];
  chartType: 'heatmap' | 'scatter' | 'contour' | 'choropleth' | 'path';
}

const PlotlyChart = ({ data, chartType }: PlotlyChartProps) => {
  const [plotData, setPlotData] = useState<any[]>([]);
  const [layout, setLayout] = useState<any>({});

  useEffect(() => {
    if (!data || data.length === 0) return;

    const numericColumns = Object.keys(data[0]).filter(key => 
      typeof data[0][key] === 'number' && key !== 'id'
    );
    const categoricalColumns = Object.keys(data[0]).filter(key => 
      typeof data[0][key] === 'string'
    );

    let traces: any[] = [];
    let layoutConfig: any = {
      margin: { l: 50, r: 50, t: 50, b: 50 },
      autosize: true,
    };

    switch (chartType) {
      case 'heatmap':
        // Map-based heatmap using density
        if (data[0]?.latitude && data[0]?.longitude) {
          traces = [{
            type: 'densitymapbox',
            lat: data.map(d => d.latitude),
            lon: data.map(d => d.longitude),
            z: data.map(d => d.value || 1),
            radius: 20,
            colorscale: 'Hot',
          }];
          layoutConfig.mapbox = {
            style: 'open-street-map',
            center: { lat: data[0].latitude, lon: data[0].longitude },
            zoom: 5,
          };
        }
        break;

      case 'scatter':
        // Map-based scatter
        if (data[0]?.latitude && data[0]?.longitude) {
          traces = [{
            type: 'scattermapbox',
            lat: data.map(d => d.latitude),
            lon: data.map(d => d.longitude),
            mode: 'markers',
            marker: {
              size: 10,
              color: '#ff5722',
            },
          }];
          layoutConfig.mapbox = {
            style: 'open-street-map',
            center: { lat: data[0].latitude, lon: data[0].longitude },
            zoom: 5,
          };
        }
        break;

      case 'contour':
        // Contour map
        if (data[0]?.latitude && data[0]?.longitude) {
          traces = [{
            type: 'contour',
            x: data.map(d => d.longitude),
            y: data.map(d => d.latitude),
            z: data.map(d => d.value || 1),
            colorscale: 'Viridis',
            contours: { coloring: 'heatmap' },
          }];
        }
        break;

      case 'choropleth':
        // Choropleth map
        traces = [{
          type: 'choroplethmapbox',
          geojson: 'https://raw.githubusercontent.com/python-visualization/folium/master/examples/data/world-countries.json',
          locations: data.map((_, i) => i),
          z: data.map(d => d.value || Math.random()),
          colorscale: 'Blues',
        }];
        layoutConfig.mapbox = {
          style: 'open-street-map',
          center: { lat: 0, lon: 0 },
          zoom: 1,
        };
        break;

      case 'path':
        // Path map
        if (data[0]?.latitude && data[0]?.longitude) {
          traces = [{
            type: 'scattermapbox',
            lat: data.map(d => d.latitude),
            lon: data.map(d => d.longitude),
            mode: 'lines+markers+text',
            line: { width: 3, color: '#2196f3' },
            marker: { size: 8, color: '#1976d2' },
          }];
          layoutConfig.mapbox = {
            style: 'open-street-map',
            center: { lat: data[0].latitude, lon: data[0].longitude },
            zoom: 5,
          };
        }
        break;
    }

    setPlotData(traces);
    setLayout(layoutConfig);
  }, [data, chartType]);

  if (plotData.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        No data available for this chart type
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 400 }}>
      <Plot
        data={plotData}
        layout={{
          ...layout,
          width: undefined,
          height: undefined,
        }}
        config={{
          responsive: true,
          displayModeBar: true,
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </Box>
  );
};

export default PlotlyChart;

