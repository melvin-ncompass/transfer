import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { Box } from '@mui/material';

interface DataPoint {
  [key: string]: any;
}

interface PlotlyChartProps {
  data: DataPoint[];
  chartType: 'heatmap' | 'scatter' | 'contour' | 'choropleth' | 'path';
  valueColumn?: string;
}

const PlotlyChart = ({ data, chartType, valueColumn = 'value' }: PlotlyChartProps) => {
  const [plotData, setPlotData] = useState<any[]>([]);
  const [layout, setLayout] = useState<any>({});

  useEffect(() => {
    if (!data || data.length === 0) return;

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
            z: data.map(d => Number(d[valueColumn]) || d.value || 1),
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
        // True contour map with isolines
        if (data[0]?.latitude && data[0]?.longitude) {
          // Extract coordinates and values
          const lats = data.map(d => d.latitude);
          const lons = data.map(d => d.longitude);
          const values = data.map(d => Number(d[valueColumn]) || d.value || 1);
          
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLon = Math.min(...lons);
          const maxLon = Math.max(...lons);
          
          // Create grid for interpolation
          const gridSize = 50;
          const gridLons: number[] = [];
          const gridLats: number[] = [];
          const gridValues: number[][] = [];
          
          for (let i = 0; i < gridSize; i++) {
            gridLons.push(minLon + (i / (gridSize - 1)) * (maxLon - minLon));
            gridLats.push(minLat + (i / (gridSize - 1)) * (maxLat - minLat));
          }
          
          // Inverse Distance Weighting interpolation
          for (let i = 0; i < gridSize; i++) {
            const row: number[] = [];
            for (let j = 0; j < gridSize; j++) {
              const lat = gridLats[i];
              const lon = gridLons[j];
              
              let sumValues = 0;
              let sumWeights = 0;
              
              for (let k = 0; k < data.length; k++) {
                const distance = Math.sqrt(
                  Math.pow(data[k].latitude - lat, 2) + 
                  Math.pow(data[k].longitude - lon, 2)
                );
                
                if (distance < 0.0001) {
                  sumValues = values[k];
                  sumWeights = 1;
                  break;
                }
                
                const weight = 1 / Math.pow(distance, 2);
                sumValues += values[k] * weight;
                sumWeights += weight;
              }
              
              row.push(sumWeights > 0 ? sumValues / sumWeights : 0);
            }
            gridValues.push(row);
          }
          
          traces = [{
            type: 'contour',
            x: gridLons,
            y: gridLats,
            z: gridValues,
            colorscale: 'YlOrRd',
            contours: {
              coloring: 'heatmap',
              showlines: true,
              start: Math.min(...values),
              end: Math.max(...values),
              size: (Math.max(...values) - Math.min(...values)) / 10
            },
            colorbar: {
              title: valueColumn,
              thickness: 20,
              len: 0.7
            },
            hovertemplate: 'Lon: %{x}<br>Lat: %{y}<br>Value: %{z:.2f}<extra></extra>',
            line: {
              smoothing: 0.85,
              width: 1
            }
          }];
          
          layoutConfig.xaxis = {
            title: 'Longitude',
            showgrid: false
          };
          layoutConfig.yaxis = {
            title: 'Latitude',
            showgrid: false
          };
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
  }, [data, chartType, valueColumn]);

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
