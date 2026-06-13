import { useState, useEffect } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Paper,
  AppBar,
  Toolbar,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as RunIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import axios from 'axios';
import DynamicChart from './visualizations/DynamicChart';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Column {
  column_name: string;
  data_type: string;
  udt_name: string;
}

interface Metric {
  id: string;
  label: string;
  aggregate: 'AVG' | 'SUM' | 'COUNT' | 'MIN' | 'MAX';
  column: string;
}

interface Filter {
  id: string;
  column: string;
  operator: string;
  value: string;
}

interface ChartConfiguration {
  longitudeColumn: string;
  latitudeColumn: string;
  metrics: Metric[];
  filters: Filter[];
  rowLimit: number;
  ignoreNullLocations: boolean;
  intensity: number;
  intensityRadius: number;
  colorColumn?: string;
  sizeColumn?: string;
}

interface SupersetChartBuilderProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
}

const SupersetChartBuilder = ({ open, onClose, onSave }: SupersetChartBuilderProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedChartType, setSelectedChartType] = useState('');
  const [tables, setTables] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);

  const [config, setConfig] = useState<ChartConfiguration>({
    longitudeColumn: '',
    latitudeColumn: '',
    metrics: [],
    filters: [],
    rowLimit: 10000,
    ignoreNullLocations: true,
    intensity: 1,
    intensityRadius: 70,
  });

  const chartTypes = [
    { value: 'deckgl-heatmap', label: 'Heatmap (Deck.GL)' },
    { value: 'deckgl-scatter', label: 'Scatter (Deck.GL)' },
    { value: 'deckgl-contour', label: 'Contour (Deck.GL)' },
    { value: 'deckgl-choropleth', label: 'Choropleth (Deck.GL)' },
    { value: 'd3-heatmap', label: 'Heatmap (D3)' },
    { value: 'd3-scatter', label: 'Scatter (D3)' },
    { value: 'plotly-heatmap', label: 'Heatmap (Plotly)' },
    { value: 'plotly-scatter', label: 'Scatter (Plotly)' },
    { value: 'leaflet-heatmap', label: 'Heatmap (Leaflet)' },
    { value: 'leaflet-scatter', label: 'Scatter (Leaflet)' },
  ];

  useEffect(() => {
    if (open) {
      fetchTables();
    }
  }, [open]);

  useEffect(() => {
    if (selectedTable) {
      fetchColumns(selectedTable);
    }
  }, [selectedTable]);

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tables`);
      setTables(response.data);
    } catch (err: any) {
      setError('Failed to fetch tables');
    }
  };

  const fetchColumns = async (tableName: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tables/${tableName}/columns`);
      const cols = response.data;
      setColumns(cols);

      // Auto-detect lat/lng columns
      const latCol = cols.find((c: Column) =>
        c.column_name.toLowerCase().includes('lat') &&
        !c.column_name.toLowerCase().includes('long')
      );
      const lngCol = cols.find((c: Column) =>
        c.column_name.toLowerCase().includes('lon') ||
        c.column_name.toLowerCase().includes('lng')
      );

      setConfig((prev) => ({
        ...prev,
        latitudeColumn: latCol?.column_name || '',
        longitudeColumn: lngCol?.column_name || '',
      }));
    } catch (err) {
      console.error('Failed to fetch columns:', err);
    }
  };

  const getNumericColumns = () => {
    return columns.filter((c) =>
      ['integer', 'numeric', 'double precision', 'real', 'bigint', 'smallint', 'decimal', 'float', 'int2', 'int4', 'int8', 'float4', 'float8'].includes(
        c.udt_name.toLowerCase()
      )
    );
  };

  const addMetric = () => {
    const newMetric: Metric = {
      id: Date.now().toString(),
      label: '',
      aggregate: 'AVG',
      column: '',
    };
    setConfig((prev) => ({
      ...prev,
      metrics: [...prev.metrics, newMetric],
    }));
  };

  const updateMetric = (id: string, field: keyof Metric, value: any) => {
    setConfig((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    }));
  };

  const removeMetric = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((m) => m.id !== id),
    }));
  };

  const addFilter = () => {
    const newFilter: Filter = {
      id: Date.now().toString(),
      column: '',
      operator: '=',
      value: '',
    };
    setConfig((prev) => ({
      ...prev,
      filters: [...prev.filters, newFilter],
    }));
  };

  const updateFilter = (id: string, field: keyof Filter, value: any) => {
    setConfig((prev) => ({
      ...prev,
      filters: prev.filters.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    }));
  };

  const removeFilter = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      filters: prev.filters.filter((f) => f.id !== id),
    }));
  };

  const handleRunQuery = async () => {
    if (!selectedTable || !config.longitudeColumn || !config.latitudeColumn) {
      setError('Please select table and coordinate columns');
      return;
    }

    setPreviewLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('limit', config.rowLimit.toString());

      // Add filters
      config.filters.forEach((filter, index) => {
        if (filter.column && filter.value) {
          params.append(`configFilter${index}`, JSON.stringify(filter));
        }
      });

      const response = await axios.get(`${API_BASE_URL}/tables/${selectedTable}/data?${params.toString()}`);
      if (response.data.success) {
        setPreviewData(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSaveChart = () => {
    if (!selectedTable || !selectedChartType || !config.longitudeColumn || !config.latitudeColumn) {
      setError('Please complete all required fields');
      return;
    }

    onSave({
      id: Date.now().toString(),
      table: selectedTable,
      tableName: selectedTable,
      chartType: selectedChartType,
      title: `${chartTypes.find((ct) => ct.value === selectedChartType)?.label || 'Chart'} - ${selectedTable}`,
      config: config,
    });
    handleClose();
  };

  const handleClose = () => {
    setSelectedTable('');
    setSelectedChartType('');
    setColumns([]);
    setPreviewData([]);
    setError('');
    setConfig({
      longitudeColumn: '',
      latitudeColumn: '',
      metrics: [],
      filters: [],
      rowLimit: 10000,
      ignoreNullLocations: true,
      intensity: 1,
      intensityRadius: 70,
    });
    setActiveTab(0);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={false} fullScreen>
      {/* Top Bar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Create Chart
          </Typography>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveChart}
            sx={{ mr: 2 }}
            disabled={!selectedTable || !selectedChartType || !config.longitudeColumn || !config.latitudeColumn}
          >
            Save Chart
          </Button>
          <IconButton edge="end" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Left Panel - Configuration */}
        <Box sx={{ width: 400, borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa' }}>
          {/* Dataset and Chart Type Selection */}
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'white' }}>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Dataset</InputLabel>
              <Select
                value={selectedTable}
                label="Dataset"
                onChange={(e) => setSelectedTable(e.target.value)}
              >
                {tables.map((table) => (
                  <MenuItem key={table.table_name} value={table.table_name}>
                    {table.table_name}
                    {table.has_geometry && <Chip label="Geo" size="small" sx={{ ml: 1 }} />}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={selectedChartType}
                label="Chart Type"
                onChange={(e) => setSelectedChartType(e.target.value)}
              >
                {chartTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Tabs */}
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: 'white' }}>
            <Tab label="Data" />
            <Tab label="Customize" />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Data Tab */}
            {activeTab === 0 && (
              <Box>
                {/* Columns */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold">Columns</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Longitude</InputLabel>
                      <Select
                        value={config.longitudeColumn}
                        label="Longitude"
                        onChange={(e) => setConfig({ ...config, longitudeColumn: e.target.value })}
                      >
                        {columns.map((col) => (
                          <MenuItem key={col.column_name} value={col.column_name}>
                            {col.column_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel>Latitude</InputLabel>
                      <Select
                        value={config.latitudeColumn}
                        label="Latitude"
                        onChange={(e) => setConfig({ ...config, latitudeColumn: e.target.value })}
                      >
                        {columns.map((col) => (
                          <MenuItem key={col.column_name} value={col.column_name}>
                            {col.column_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </AccordionDetails>
                </Accordion>

                {/* Metrics */}
                <Accordion defaultExpanded sx={{ mt: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold">Metrics</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {config.metrics.map((metric) => (
                        <Paper key={metric.id} variant="outlined" sx={{ p: 1.5 }}>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <FormControl size="small" sx={{ flex: 1 }}>
                              <InputLabel>Function</InputLabel>
                              <Select
                                value={metric.aggregate}
                                label="Function"
                                onChange={(e) => updateMetric(metric.id, 'aggregate', e.target.value)}
                              >
                                <MenuItem value="AVG">AVG</MenuItem>
                                <MenuItem value="SUM">SUM</MenuItem>
                                <MenuItem value="COUNT">COUNT</MenuItem>
                                <MenuItem value="MIN">MIN</MenuItem>
                                <MenuItem value="MAX">MAX</MenuItem>
                              </Select>
                            </FormControl>
                            <IconButton size="small" onClick={() => removeMetric(metric.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                            <InputLabel>Column</InputLabel>
                            <Select
                              value={metric.column}
                              label="Column"
                              onChange={(e) => updateMetric(metric.id, 'column', e.target.value)}
                            >
                              {getNumericColumns().map((col) => (
                                <MenuItem key={col.column_name} value={col.column_name}>
                                  {col.column_name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField
                            fullWidth
                            size="small"
                            label="Label"
                            value={metric.label}
                            onChange={(e) => updateMetric(metric.id, 'label', e.target.value)}
                            placeholder={metric.column ? `${metric.aggregate}(${metric.column})` : ''}
                          />
                        </Paper>
                      ))}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={addMetric}
                        variant="outlined"
                        size="small"
                      >
                        Add Metric
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Filters */}
                <Accordion defaultExpanded sx={{ mt: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold">Filters</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {config.filters.map((filter) => (
                        <Paper key={filter.id} variant="outlined" sx={{ p: 1.5 }}>
                          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                            <InputLabel>Column</InputLabel>
                            <Select
                              value={filter.column}
                              label="Column"
                              onChange={(e) => updateFilter(filter.id, 'column', e.target.value)}
                            >
                              {columns.map((col) => (
                                <MenuItem key={col.column_name} value={col.column_name}>
                                  {col.column_name} ({col.data_type})
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <FormControl size="small" sx={{ minWidth: 100 }}>
                              <InputLabel>Operator</InputLabel>
                              <Select
                                value={filter.operator}
                                label="Operator"
                                onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
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
                              fullWidth
                              size="small"
                              label="Value"
                              value={filter.value}
                              onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                            />
                            <IconButton size="small" onClick={() => removeFilter(filter.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Paper>
                      ))}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={addFilter}
                        variant="outlined"
                        size="small"
                      >
                        Add Filter
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Row Limit */}
                <Accordion sx={{ mt: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold">Row Limit</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={config.rowLimit}
                      onChange={(e) => setConfig({ ...config, rowLimit: parseInt(e.target.value) || 10000 })}
                      inputProps={{ min: 1, max: 1000000 }}
                    />
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}

            {/* Customize Tab */}
            {activeTab === 1 && (
              <Box>
                {selectedChartType.includes('heatmap') && (
                  <>
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography fontWeight="bold">Intensity</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={config.intensity}
                          onChange={(e) => setConfig({ ...config, intensity: parseFloat(e.target.value) || 1 })}
                          inputProps={{ min: 0.1, max: 10, step: 0.1 }}
                          helperText="Controls the brightness (0.1 - 10)"
                        />
                      </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded sx={{ mt: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography fontWeight="bold">Intensity Radius</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={config.intensityRadius}
                          onChange={(e) => setConfig({ ...config, intensityRadius: parseInt(e.target.value) || 70 })}
                          inputProps={{ min: 1, max: 500 }}
                          helperText="Radius in pixels (1 - 500)"
                        />
                      </AccordionDetails>
                    </Accordion>
                  </>
                )}

                {selectedChartType.includes('scatter') && (
                  <>
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography fontWeight="bold">Color Column</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <FormControl fullWidth size="small">
                          <InputLabel>Column</InputLabel>
                          <Select
                            value={config.colorColumn || ''}
                            label="Column"
                            onChange={(e) => setConfig({ ...config, colorColumn: e.target.value })}
                          >
                            <MenuItem value="">None</MenuItem>
                            {columns.map((col) => (
                              <MenuItem key={col.column_name} value={col.column_name}>
                                {col.column_name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion sx={{ mt: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography fontWeight="bold">Size Column</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <FormControl fullWidth size="small">
                          <InputLabel>Column</InputLabel>
                          <Select
                            value={config.sizeColumn || ''}
                            label="Column"
                            onChange={(e) => setConfig({ ...config, sizeColumn: e.target.value })}
                          >
                            <MenuItem value="">None</MenuItem>
                            {getNumericColumns().map((col) => (
                              <MenuItem key={col.column_name} value={col.column_name}>
                                {col.column_name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </AccordionDetails>
                    </Accordion>
                  </>
                )}

                <Accordion sx={{ mt: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold">Data Options</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={config.ignoreNullLocations}
                          onChange={(e) => setConfig({ ...config, ignoreNullLocations: e.target.checked })}
                        />
                      }
                      label="Ignore null locations"
                    />
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
          </Box>

          {/* Run Query Button */}
          <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: 'white' }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<RunIcon />}
              onClick={handleRunQuery}
              disabled={!selectedTable || !config.longitudeColumn || !config.latitudeColumn || previewLoading}
            >
              {previewLoading ? 'Running...' : 'Run Query'}
            </Button>
          </Box>
        </Box>

        {/* Right Panel - Preview */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
          {previewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : previewData.length > 0 && selectedChartType && selectedTable ? (
            <Box sx={{ width: '100%', height: '100%' }}>
              <DynamicChart
                tableName={selectedTable}
                chartType={selectedChartType}
                config={config}
                filters={{}}
              />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: 'text.secondary',
              }}
            >
              <Typography variant="h5" gutterBottom>
                No Preview Available
              </Typography>
              <Typography variant="body2">
                Configure your chart and click "Run Query" to see a preview
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

export default SupersetChartBuilder;

