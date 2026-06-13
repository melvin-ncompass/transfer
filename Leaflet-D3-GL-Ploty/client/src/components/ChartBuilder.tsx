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
} from '@mui/material';
import {
  Map as MapIcon,
  BarChart as BarChartIcon,
  ScatterPlot as ScatterPlotIcon,
  Close as CloseIcon,
  Whatshot as HeatmapIcon,
  Layers as ContourIcon,
  Timeline as PathIcon,
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

const ChartBuilder = ({ open, onClose, onCreateChart }: ChartBuilderProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedLibrary, setSelectedLibrary] = useState<'D3' | 'Plotly' | 'DeckGL' | 'Leaflet' | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedChartType, setSelectedChartType] = useState<ChartType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);

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

  const fetchColumns = async (tableName: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tables/${tableName}/columns`);
      setColumns(response.data);
    } catch (err: any) {
      console.error('Failed to fetch columns:', err);
    }
  };

  const handleLibrarySelect = (library: Library) => {
    setSelectedLibrary(library.id);
    setActiveStep(1);
  };

  const handleTableSelect = async (table: Table) => {
    setSelectedTable(table);
    await fetchColumns(table.table_name);
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
    onClose();
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

  const renderConfiguration = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Chart Configuration
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        You're creating a {selectedChartType?.name} visualization for the {selectedTable?.table_name} dataset.
      </Alert>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={() => setActiveStep(2)}>Back</Button>
        <Button variant="contained" color="primary" onClick={handleCreateChart}>
          Create Chart
        </Button>
      </Box>
    </Box>
  );

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
