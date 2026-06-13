import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Map as MapIcon,
  BarChart as BarChartIcon,
  ScatterPlot as ScatterPlotIcon,
  Close as CloseIcon,
  Whatshot as HeatmapIcon,
  Layers as ContourIcon,
  Timeline as PathIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Table {
  table_name: string;
  column_count: number;
  has_geometry: boolean;
  size: string;
}

interface Column {
  column_name: string;
  data_type: string;
  udt_name: string;
}

interface ChartType {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  requiresGeometry: boolean;
  requiresNumeric: boolean;
  library: 'D3' | 'Plotly' | 'DeckGL' | 'Leaflet';
}

interface Library {
  id: 'D3' | 'Plotly' | 'DeckGL' | 'Leaflet';
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

interface ChartBuilderProps {
  open: boolean;
  onClose: () => void;
  onCreateChart: (config: any) => void;
}

const libraries: Library[] = [
  {
    id: 'D3',
    name: 'D3.js',
    description: 'Powerful data-driven visualizations with SVG',
    color: '#f9a03c',
    icon: <BarChartIcon fontSize="large" />,
  },
  {
    id: 'Plotly',
    name: 'Plotly',
    description: 'Interactive scientific and statistical charts',
    color: '#3f51b5',
    icon: <ScatterPlotIcon fontSize="large" />,
  },
  {
    id: 'DeckGL',
    name: 'Deck.GL',
    description: 'WebGL-powered large-scale data visualization',
    color: '#00acc1',
    icon: <ContourIcon fontSize="large" />,
  },
  {
    id: 'Leaflet',
    name: 'Leaflet',
    description: 'Traditional mapping with markers and layers',
    color: '#4caf50',
    icon: <MapIcon fontSize="large" />,
  },
];

const chartTypes: ChartType[] = [
  // ========== D3.js Visualizations ==========
  {
    id: 'd3-heatmap',
    name: 'Heatmap',
    icon: <HeatmapIcon />,
    description: 'D3-based density heatmap',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'D3',
  },
  {
    id: 'd3-scatter',
    name: 'Scatter Map',
    icon: <ScatterPlotIcon />,
    description: 'D3-based scatter point map',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'D3',
  },
  {
    id: 'd3-contour',
    name: 'Contour/Isoline Map',
    icon: <ContourIcon />,
    description: 'D3 contour and isoline visualization',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'D3',
  },
  {
    id: 'd3-choropleth',
    name: 'Choropleth Map',
    icon: <MapIcon />,
    description: 'D3-based choropleth regional map',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'D3',
  },
  {
    id: 'd3-path',
    name: 'Path Map',
    icon: <PathIcon />,
    description: 'D3-based path and trajectory visualization',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'D3',
  },
  
  // ========== Plotly Visualizations ==========
  {
    id: 'plotly-heatmap',
    name: 'Heatmap',
    icon: <HeatmapIcon />,
    description: 'Interactive density heatmap',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'Plotly',
  },
  {
    id: 'plotly-scatter',
    name: 'Scatter Map',
    icon: <ScatterPlotIcon />,
    description: 'Interactive scatter point map',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'Plotly',
  },
  {
    id: 'plotly-contour',
    name: 'Contour/Isoline Map',
    icon: <ContourIcon />,
    description: 'Plotly contour visualization',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'Plotly',
  },
  {
    id: 'plotly-choropleth',
    name: 'Choropleth Map',
    icon: <MapIcon />,
    description: 'Interactive choropleth regional map',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'Plotly',
  },
  {
    id: 'plotly-path',
    name: 'Path Map',
    icon: <PathIcon />,
    description: 'Interactive path visualization',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'Plotly',
  },
  
  // ========== Deck.GL Visualizations ==========
  {
    id: 'deckgl-heatmap',
    name: 'Heatmap',
    icon: <HeatmapIcon />,
    description: 'WebGL-powered density heatmap',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'DeckGL',
  },
  {
    id: 'deckgl-scatter',
    name: 'Scatter Map',
    icon: <ScatterPlotIcon />,
    description: 'WebGL-powered scatter plot',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'DeckGL',
  },
  {
    id: 'deckgl-contour',
    name: 'Contour/Isoline Map',
    icon: <ContourIcon />,
    description: 'Deck.GL contour lines visualization',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'DeckGL',
  },
  {
    id: 'deckgl-choropleth',
    name: 'Choropleth Map',
    icon: <MapIcon />,
    description: 'WebGL-powered choropleth map',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'DeckGL',
  },
  {
    id: 'deckgl-path',
    name: 'Path Map',
    icon: <PathIcon />,
    description: 'WebGL path and trajectory visualization',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'DeckGL',
  },
  
  // ========== Leaflet Visualizations ==========
  {
    id: 'leaflet-heatmap',
    name: 'Heatmap',
    icon: <HeatmapIcon />,
    description: 'Smooth density heatmap',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'Leaflet',
  },
  {
    id: 'leaflet-scatter',
    name: 'Scatter Map',
    icon: <ScatterPlotIcon />,
    description: 'Leaflet scatter point map',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'Leaflet',
  },
  {
    id: 'leaflet-contour',
    name: 'Contour/Isoline Map',
    icon: <ContourIcon />,
    description: 'Leaflet contour visualization',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'Leaflet',
  },
  {
    id: 'leaflet-choropleth',
    name: 'Choropleth Map',
    icon: <MapIcon />,
    description: 'Leaflet choropleth regional map',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'Leaflet',
  },
  {
    id: 'leaflet-path',
    name: 'Path Map',
    icon: <PathIcon />,
    description: 'Leaflet path and trajectory visualization',
    requiresGeometry: true,
    requiresNumeric: false,
    library: 'Leaflet',
  },
];

interface ChartConfiguration {
  longitudeColumn: string;
  latitudeColumn: string;
  weightColumn: string;
  weightFunction: 'AVG' | 'SUM' | 'COUNT' | 'MIN' | 'MAX' | 'NONE';
  rowLimit: number;
  ignoreNullLocations: boolean;
  filters: Array<{ column: string; operator: string; value: string }>;
  intensity: number;
  intensityRadius: number;
  colorColumn?: string;
  sizeColumn?: string;
}

const ChartBuilder = ({ open, onClose, onCreateChart }: ChartBuilderProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedLibrary, setSelectedLibrary] = useState<'D3' | 'Plotly' | 'DeckGL' | 'Leaflet' | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedChartType, setSelectedChartType] = useState<ChartType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  
  // Configuration state
  const [config, setConfig] = useState<ChartConfiguration>({
    longitudeColumn: '',
    latitudeColumn: '',
    weightColumn: '',
    weightFunction: 'NONE',
    rowLimit: 10000,
    ignoreNullLocations: true,
    filters: [],
    intensity: 1,
    intensityRadius: 70,
  });

  const steps = ['Choose Library', 'Choose Dataset', 'Choose Chart Type', 'Configure'];

  useEffect(() => {
    if (open) {
      fetchTables();
    }
  }, [open]);

  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/tables`);
      setTables(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const fetchColumns = async (tableName: string): Promise<Column[] | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tables/${tableName}/columns`);
      setColumns(response.data);
      return response.data;
    } catch (err: any) {
      console.error('Failed to fetch columns:', err);
      return null;
    }
  };

  const handleLibrarySelect = (library: Library) => {
    setSelectedLibrary(library.id);
    setActiveStep(1);
  };

  const handleTableSelect = async (table: Table) => {
    setSelectedTable(table);
    const cols = await fetchColumns(table.table_name);
    
    // Auto-detect latitude and longitude columns
    if (cols) {
      const latCol = cols.find(c => 
        c.column_name.toLowerCase().includes('lat') && 
        !c.column_name.toLowerCase().includes('long')
      );
      const lngCol = cols.find(c => 
        c.column_name.toLowerCase().includes('lon') || 
        c.column_name.toLowerCase().includes('lng')
      );
      
      setConfig(prev => ({
        ...prev,
        latitudeColumn: latCol?.column_name || '',
        longitudeColumn: lngCol?.column_name || '',
      }));
    }
    
    setActiveStep(2);
  };

  const handleChartTypeSelect = (chartType: ChartType) => {
    setSelectedChartType(chartType);
    setActiveStep(3);
  };

  const handleCreateChart = () => {
    if (selectedTable && selectedChartType) {
      onCreateChart({
        id: Date.now().toString(),
        table: selectedTable.table_name,
        tableName: selectedTable.table_name,
        chartType: selectedChartType.id,
        title: `${selectedChartType.name} - ${selectedTable.table_name}`,
        config: config, // Pass the configuration
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedLibrary(null);
    setSelectedTable(null);
    setSelectedChartType(null);
    setColumns([]);
    setError(null);
    // Reset configuration
    setConfig({
      longitudeColumn: '',
      latitudeColumn: '',
      weightColumn: '',
      weightFunction: 'NONE',
      rowLimit: 10000,
      ignoreNullLocations: true,
      filters: [],
      intensity: 1,
      intensityRadius: 70,
    });
    onClose();
  };
  
  const addFilter = () => {
    setConfig(prev => ({
      ...prev,
      filters: [...prev.filters, { column: '', operator: '=', value: '' }],
    }));
  };

  const updateFilter = (index: number, field: 'column' | 'operator' | 'value', value: string) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.map((f, i) => i === index ? { ...f, [field]: value } : f),
    }));
  };

  const removeFilter = (index: number) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index),
    }));
  };
  
  const getNumericColumns = () => {
    return columns.filter(c =>
      ['integer', 'numeric', 'double precision', 'real', 'bigint', 'smallint', 'decimal', 'float', 'int2', 'int4', 'int8', 'float4', 'float8'].includes(c.udt_name.toLowerCase())
    );
  };

  const getAvailableChartTypes = () => {
    if (!selectedLibrary) return [];
    return chartTypes.filter(ct => ct.library === selectedLibrary);
  };

  const renderLibrarySelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select a Visualization Library
      </Typography>
      <Grid container spacing={3}>
        {libraries.map((library) => (
          <Grid item xs={12} sm={6} key={library.id}>
            <Card
              elevation={2}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardActionArea onClick={() => handleLibrarySelect(library)}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ color: library.color, mr: 2 }}>
                      {library.icon}
                    </Box>
                    <Typography variant="h6" sx={{ color: library.color }}>
                      {library.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {library.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderTableSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select a Dataset
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={2}>
          {tables.map((table) => (
            <Grid item xs={12} sm={6} md={4} key={table.table_name}>
              <Card
                elevation={2}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardActionArea onClick={() => handleTableSelect(table)}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {table.table_name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={`${table.column_count} columns`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      {table.has_geometry && (
                        <Chip
                          label="Geospatial"
                          size="small"
                          color="success"
                          icon={<MapIcon fontSize="small" />}
                        />
                      )}
                      <Chip
                        label={table.size}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderChartTypeSelection = () => {
    const availableChartTypes = getAvailableChartTypes();

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Choose Visualization Type
        </Typography>
        <Grid container spacing={2}>
          {availableChartTypes.map((chartType) => {
            const isDisabled =
              (chartType.requiresGeometry && !selectedTable?.has_geometry) ||
              (chartType.requiresNumeric && columns.filter(c =>
                ['integer', 'numeric', 'double precision', 'real'].includes(c.udt_name)
              ).length === 0);

            return (
              <Grid item xs={12} sm={6} md={4} key={chartType.id}>
                <Card
                  elevation={2}
                  sx={{
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.5 : 1,
                    transition: 'all 0.3s',
                    '&:hover': !isDisabled
                      ? {
                          transform: 'translateY(-4px)',
                          boxShadow: 6,
                        }
                      : {},
                  }}
                >
                  <CardActionArea
                    onClick={() => !isDisabled && handleChartTypeSelect(chartType)}
                    disabled={isDisabled}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                          {chartType.icon}
                        </Box>
                        <Typography variant="h6">{chartType.name}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {chartType.description}
                      </Typography>
                      {isDisabled && (
                        <Chip
                          label={
                            chartType.requiresGeometry
                              ? 'Requires geospatial data'
                              : 'Requires numeric data'
                          }
                          size="small"
                          color="warning"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  const renderConfiguration = () => {
    const numericColumns = getNumericColumns();
    const allColumns = columns;
    
    return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Chart Configuration
      </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
        You're creating a {selectedChartType?.name} visualization for the {selectedTable?.table_name} dataset.
      </Alert>
        
        <Grid container spacing={3}>
          {/* Longitude & Latitude */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Longitude & Latitude
                </Typography>
                <Tooltip title="Select the columns containing longitude and latitude coordinates">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Longitude</InputLabel>
                    <Select
                      value={config.longitudeColumn}
                      label="Longitude"
                      onChange={(e) => setConfig(prev => ({ ...prev, longitudeColumn: e.target.value }))}
                    >
                      {allColumns.map(col => (
                        <MenuItem key={col.column_name} value={col.column_name}>
                          {col.column_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Latitude</InputLabel>
                    <Select
                      value={config.latitudeColumn}
                      label="Latitude"
                      onChange={(e) => setConfig(prev => ({ ...prev, latitudeColumn: e.target.value }))}
                    >
                      {allColumns.map(col => (
                        <MenuItem key={col.column_name} value={col.column_name}>
                          {col.column_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Weight */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Weight
                </Typography>
                <Tooltip title="Optional: Apply an aggregation function to a numeric column to weight the visualization">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Function</InputLabel>
                    <Select
                      value={config.weightFunction}
                      label="Function"
                      onChange={(e) => setConfig(prev => ({ ...prev, weightFunction: e.target.value as any }))}
                    >
                      <MenuItem value="NONE">None</MenuItem>
                      <MenuItem value="AVG">AVG</MenuItem>
                      <MenuItem value="SUM">SUM</MenuItem>
                      <MenuItem value="COUNT">COUNT</MenuItem>
                      <MenuItem value="MIN">MIN</MenuItem>
                      <MenuItem value="MAX">MAX</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={8}>
                  <FormControl fullWidth size="small" disabled={config.weightFunction === 'NONE'}>
                    <InputLabel>Column</InputLabel>
                    <Select
                      value={config.weightColumn}
                      label="Column"
                      onChange={(e) => setConfig(prev => ({ ...prev, weightColumn: e.target.value }))}
                    >
                      {numericColumns.map(col => (
                        <MenuItem key={col.column_name} value={col.column_name}>
                          {col.column_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              {config.weightFunction !== 'NONE' && config.weightColumn && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Formula: {config.weightFunction}({config.weightColumn})
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Row Limit */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Row Limit
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.rowLimit}
                onChange={(e) => setConfig(prev => ({ ...prev, rowLimit: parseInt(e.target.value) || 10000 }))}
                inputProps={{ min: 1, max: 1000000 }}
              />
            </Box>
          </Grid>

          {/* Ignore Null Locations */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Data Options
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={config.ignoreNullLocations}
                    onChange={(e) => setConfig(prev => ({ ...prev, ignoreNullLocations: e.target.checked }))}
                  />
                }
                label="Ignore null locations"
              />
            </Box>
          </Grid>

          {/* Filters */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Filters
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addFilter}
                  variant="outlined"
                >
                  Add Filter
                </Button>
              </Box>
              
              {config.filters.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No filters applied. Click "Add Filter" to add conditions.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {config.filters.map((filter, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel>Column</InputLabel>
                        <Select
                          value={filter.column}
                          label="Column"
                          onChange={(e) => updateFilter(index, 'column', e.target.value)}
                        >
                          {allColumns.map(col => (
                            <MenuItem key={col.column_name} value={col.column_name}>
                              {col.column_name} ({col.data_type})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={filter.operator}
                          label="Operator"
                          onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                        >
                          <MenuItem value="=">=</MenuItem>
                          <MenuItem value="!=">!=</MenuItem>
                          <MenuItem value=">">{'>'}</MenuItem>
                          <MenuItem value="<">{'<'}</MenuItem>
                          <MenuItem value=">=">{'>='}</MenuItem>
                          <MenuItem value="<=">{'<='}</MenuItem>
                          <MenuItem value="LIKE">LIKE</MenuItem>
                          <MenuItem value="IN">IN</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        label="Value"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeFilter(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Grid>

          {/* Intensity (for heatmaps) */}
          {selectedChartType?.id.includes('heatmap') && (
            <>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Intensity
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={config.intensity}
                    onChange={(e) => setConfig(prev => ({ ...prev, intensity: parseFloat(e.target.value) || 1 }))}
                    inputProps={{ min: 0.1, max: 10, step: 0.1 }}
                    helperText="Controls the brightness of the heatmap (0.1 - 10)"
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Intensity Radius
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={config.intensityRadius}
                    onChange={(e) => setConfig(prev => ({ ...prev, intensityRadius: parseInt(e.target.value) || 70 }))}
                    inputProps={{ min: 1, max: 500 }}
                    helperText="Radius of influence in pixels (1 - 500)"
                  />
                </Box>
              </Grid>
            </>
          )}

          {/* Color & Size Columns (for scatter maps) */}
          {selectedChartType?.id.includes('scatter') && (
            <>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Color Column (Optional)
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>Column</InputLabel>
                    <Select
                      value={config.colorColumn || ''}
                      label="Column"
                      onChange={(e) => setConfig(prev => ({ ...prev, colorColumn: e.target.value }))}
                    >
                      <MenuItem value="">None</MenuItem>
                      {allColumns.map(col => (
                        <MenuItem key={col.column_name} value={col.column_name}>
                          {col.column_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Size Column (Optional)
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>Column</InputLabel>
                    <Select
                      value={config.sizeColumn || ''}
                      label="Column"
                      onChange={(e) => setConfig(prev => ({ ...prev, sizeColumn: e.target.value }))}
                    >
                      <MenuItem value="">None</MenuItem>
                      {numericColumns.map(col => (
                        <MenuItem key={col.column_name} value={col.column_name}>
                          {col.column_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
            </>
          )}
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => setActiveStep(2)} variant="outlined">
            Back
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleCreateChart}
            disabled={!config.longitudeColumn || !config.latitudeColumn}
          >
          Create Chart
        </Button>
      </Box>
    </Box>
  );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Create New Chart</Typography>
          <Button onClick={handleClose} startIcon={<CloseIcon />}>
            Close
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && renderLibrarySelection()}
        {activeStep === 1 && renderTableSelection()}
        {activeStep === 2 && renderChartTypeSelection()}
        {activeStep === 3 && renderConfiguration()}
      </DialogContent>
    </Dialog>
  );
};

export default ChartBuilder;
