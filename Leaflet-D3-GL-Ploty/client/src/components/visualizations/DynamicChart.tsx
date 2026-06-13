import { useEffect, useState } from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Alert, 
  Button, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField 
} from '@mui/material';
// D3 visualizations
import D3Heatmap from './d3/D3Heatmap';
import D3ScatterMap from './d3/D3ScatterMap';
import D3ContourMap from './d3/D3ContourMap';
import D3Choropleth from './d3/D3Choropleth';
import D3PathMap from './d3/D3PathMap';

// Plotly visualizations
import PlotlyChart from './plotly/PlotlyChart';

// Leaflet visualizations
import LeafletHeatmap from './leaflet/Heatmap';
import LeafletScatterMap from './leaflet/LeafletScatterMap';
import LeafletContourMap from './leaflet/LeafletContourMap';
import LeafletChoropleth from './leaflet/LeafletChoropleth';
import LeafletPathMap from './leaflet/LeafletPathMap';

// DeckGL visualizations
import DeckGLHeatmap from './deckgl/DeckGLHeatmap';
import DeckGLScatterMap from './deckgl/DeckGLScatterMap';
import DeckGLContourMap from './deckgl/DeckGLContourMap';
import DeckGLChoropleth from './deckgl/DeckGLChoropleth';
import DeckGLPathMap from './deckgl/DeckGLPathMap';
import axios from 'axios';
import { Download as DownloadIcon } from '@mui/icons-material';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DynamicChartProps {
  tableName: string;
  chartType: string;
  filters?: Record<string, any>;
  onFilterChange?: (filters: Record<string, any>) => void;
}

const DynamicChart = ({ tableName, chartType, filters = {}, onFilterChange }: DynamicChartProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasGeometry, setHasGeometry] = useState(false);
  const [columns, setColumns] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<Record<string, any>>(filters || {});
  const [columnValues, setColumnValues] = useState<Record<string, string[]>>({});
  const [exporting, setExporting] = useState(false);
  const [valueColumn, setValueColumn] = useState<string>(''); // For contour maps

  useEffect(() => {
    fetchColumns();
  }, [tableName]);

  useEffect(() => {
    if (columns.length > 0 && showFilters) {
      fetchColumnValues();
    }
  }, [columns, showFilters, tableName]);

  useEffect(() => {
    fetchTableData();
  }, [tableName, JSON.stringify(filters)]);

  // Sync localFilters with filters prop
  useEffect(() => {
    setLocalFilters(filters || {});
  }, [JSON.stringify(filters)]);

  const fetchColumns = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tables/${tableName}/columns`);
      const cols = response.data || [];
      setColumns(cols);
      
      // Auto-select first numeric column for contour maps (exclude id and created_at)
      const numericCols = cols.filter((col: any) => {
        if (['geometry', 'geom', 'id', 'created_at'].includes(col.column_name?.toLowerCase())) {
          return false;
        }
        const udtName = col.udt_name?.toLowerCase() || '';
        const dataType = col.data_type?.toLowerCase() || '';
        return ['integer', 'numeric', 'double precision', 'real', 'float', 'int4', 'int8', 'int2', 'float4', 'float8', 'decimal', 'smallint', 'bigint'].includes(udtName) ||
               ['integer', 'numeric', 'double precision', 'real', 'float', 'decimal', 'smallint', 'bigint'].includes(dataType);
      });
      if (numericCols.length > 0 && !valueColumn) {
        setValueColumn(numericCols[0].column_name);
      }
    } catch (err) {
      console.error('Failed to fetch columns:', err);
    }
  };

  const fetchColumnValues = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tables/${tableName}/column-values`);
      setColumnValues(response.data || {});
    } catch (err) {
      console.error('Failed to fetch column values:', err);
    }
  };

  const fetchTableData = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query params with filters
      const params = new URLSearchParams();
      const activeFilters: string[] = [];
      
      Object.keys(filters || {}).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
          activeFilters.push(`${key}=${filters[key]}`);
        }
      });

      console.log('Fetching data with filters:', activeFilters);

      const response = await axios.get(`${API_BASE_URL}/tables/${tableName}/data?${params.toString()}`);
      if (response.data.success) {
        console.log('Filtered data received:', response.data.count, 'records');
        setData(response.data.data);
        setHasGeometry(response.data.hasGeometry);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err: any) {
      console.error('Error fetching filtered data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    if (onFilterChange) {
      onFilterChange(localFilters);
    }
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  const handleFilterChange = (column: string, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tables/${tableName}/export/geojson`,
        { responseType: 'blob' }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tableName}_export.geojson`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export failed:', err);
      alert('Failed to export data. Make sure the table has geometry data.');
    } finally {
      setExporting(false);
    }
  };

  // Get text columns for filtering
  const textColumns = columns.filter(col =>
    !['geometry', 'geom'].includes(col.column_name.toLowerCase()) &&
    ['character varying', 'text', 'varchar'].includes(col.data_type.toLowerCase())
  );

  // Get numeric columns for contour value selection
  const numericColumns = columns.filter(col => {
    if (['geometry', 'geom', 'id', 'created_at'].includes(col.column_name.toLowerCase())) {
      return false;
    }
    
    const udtName = col.udt_name?.toLowerCase() || '';
    const dataType = col.data_type?.toLowerCase() || '';
    
    // Check for actual numeric types
    const isNumericType = [
      'integer', 'numeric', 'double precision', 'real', 'float', 
      'int4', 'int8', 'int2', 'float4', 'float8', 'decimal', 'smallint', 'bigint'
    ].includes(udtName) || [
      'integer', 'numeric', 'double precision', 'real', 'float', 'decimal', 'smallint', 'bigint'
    ].includes(dataType);
    
    // Also check if TEXT column contains numeric data (for backward compatibility)
    if (!isNumericType && (udtName === 'text' || dataType === 'text' || dataType === 'character varying')) {
      // Check if first data value is numeric
      if (data.length > 0 && data[0][col.column_name] !== undefined) {
        const sampleValue = String(data[0][col.column_name]);
        const num = parseFloat(sampleValue);
        return !isNaN(num) && isFinite(num);
      }
    }
    
    return isNumericType;
  });

  // Check if current chart is a contour map
  const isContourMap = chartType?.includes('contour');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4, gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          {Object.keys(filters || {}).filter(k => filters[k]).length > 0 ? 'Applying filters...' : 'Loading data...'}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
        <Typography color="text.secondary">No data available</Typography>
      </Box>
    );
  }

  const renderChart = () => {
    if (!hasGeometry) {
      return <Alert severity="warning">This table doesn't have geometry data for mapping</Alert>;
    }

    // Render based on chart type
    switch (chartType) {
      // D3 Visualizations
      case 'd3-heatmap':
        return <D3Heatmap data={data} />;
      case 'd3-scatter':
        return <D3ScatterMap data={data} />;
      case 'd3-contour':
        return <D3ContourMap data={data} valueColumn={valueColumn} />;
      case 'd3-choropleth':
        return <D3Choropleth data={data} />;
      case 'd3-path':
        return <D3PathMap data={data} />;

      // Plotly Visualizations
      case 'plotly-heatmap':
        return <PlotlyChart data={data} chartType="heatmap" />;
      case 'plotly-scatter':
        return <PlotlyChart data={data} chartType="scatter" />;
      case 'plotly-contour':
        return <PlotlyChart data={data} chartType="contour" valueColumn={valueColumn} />;
      case 'plotly-choropleth':
        return <PlotlyChart data={data} chartType="choropleth" />;
      case 'plotly-path':
        return <PlotlyChart data={data} chartType="path" />;

      // Leaflet Visualizations
      case 'leaflet-heatmap':
        return <LeafletHeatmap data={data} />;
      case 'leaflet-scatter':
        return <LeafletScatterMap data={data} />;
      case 'leaflet-contour':
        return <LeafletContourMap data={data} valueColumn={valueColumn} />;
      case 'leaflet-choropleth':
        return <LeafletChoropleth data={data} />;
      case 'leaflet-path':
        return <LeafletPathMap data={data} />;

      // DeckGL Visualizations
      case 'deckgl-heatmap':
        return <DeckGLHeatmap data={data} />;
      case 'deckgl-scatter':
        return <DeckGLScatterMap data={data} />;
      case 'deckgl-contour':
        return <DeckGLContourMap data={data} valueColumn={valueColumn} />;
      case 'deckgl-choropleth':
        return <DeckGLChoropleth data={data} />;
      case 'deckgl-path':
        return <DeckGLPathMap data={data} />;

      default:
        return <Typography>Unknown chart type: {chartType}</Typography>;
    }
  };

  // Render filter panel and chart
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Filter Panel */}
      {onFilterChange && (
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#fafafa' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: showFilters ? 2 : 0 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {Object.keys(filters || {}).filter(k => filters[k]).length} filter(s) applied • {data.length} records
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={handleExport}
                variant="outlined"
                startIcon={<DownloadIcon />}
                disabled={exporting || !hasGeometry}
                color="success"
              >
                {exporting ? 'Exporting...' : 'Export GeoJSON'}
              </Button>
              <Button
                size="small"
                onClick={() => setShowFilters(!showFilters)}
                variant="outlined"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </Box>
          </Box>

          {/* Value Column Selector for Contour Maps */}
          {isContourMap && numericColumns.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 250 }}>
                <InputLabel>Contour Value Column</InputLabel>
                <Select
                  value={valueColumn}
                  label="Contour Value Column"
                  onChange={(e) => setValueColumn(e.target.value)}
                >
                  {numericColumns.map((col) => (
                    <MenuItem key={col.column_name} value={col.column_name}>
                      {col.column_name} ({col.data_type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                Select the numeric column to use for contour values
              </Typography>
            </Box>
          )}
          
          {showFilters && textColumns.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {textColumns.map(col => {
                  const values = columnValues[col.column_name] || [];
                  const hasValues = values.length > 0 && values.length <= 100; // Use dropdown if <= 100 unique values
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={col.column_name}>
                      {hasValues ? (
                        <FormControl fullWidth size="small">
                          <InputLabel>{col.column_name}</InputLabel>
                          <Select
                            value={localFilters[col.column_name] || ''}
                            label={col.column_name}
                            onChange={(e) => handleFilterChange(col.column_name, e.target.value)}
                          >
                            <MenuItem value="">
                              <em>All</em>
                            </MenuItem>
                            {values.map((value, idx) => (
                              <MenuItem key={idx} value={value}>
                                {value || '(empty)'}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <TextField
                          fullWidth
                          size="small"
                          label={col.column_name}
                          placeholder={`Filter ${col.column_name}...`}
                          value={localFilters[col.column_name] || ''}
                          onChange={(e) => handleFilterChange(col.column_name, e.target.value)}
                        />
                      )}
                    </Grid>
                  );
                })}
              </Grid>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleApplyFilters}
                  disabled={loading}
                >
                  {loading ? 'Applying...' : 'Apply Filters'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleClearFilters}
                  disabled={loading}
                >
                  Clear All
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Chart Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {renderChart()}
      </Box>
    </Box>
  );
};

export default DynamicChart;

