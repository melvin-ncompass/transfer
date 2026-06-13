import { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Grid,
  Paper,
  Alert,
  Snackbar,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  CloudUpload as UploadIcon,
  Assessment as AddChartIcon,
  Fullscreen as FullscreenIcon,
  Close as CloseIcon,
  Description as CsvIcon,
  Map as GeoJsonIcon,
} from '@mui/icons-material';
import Filters from './Filters';
import DynamicChart from './visualizations/DynamicChart';
import CSVUpload from './CSVUpload';
import GeoJSONUpload from './GeoJSONUpload';
import ChartBuilder from './ChartBuilder';

interface ChartConfig {
  id: string;
  table: string;
  chartType: string;
  title: string;
  filters?: Record<string, any>;
  layers?: Array<{ tableName: string; color: string; name: string }>;
  overlayTypes?: string[];
  createdAt?: string;
}

const STORAGE_KEY = 'leaflet_dashboard_charts';

const Dashboard = () => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [createdCharts, setCreatedCharts] = useState<ChartConfig[]>([]);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);
  const [fullscreenChart, setFullscreenChart] = useState<ChartConfig | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [geoJsonUploadOpen, setGeoJsonUploadOpen] = useState(false);
  const [chartBuilderOpen, setChartBuilderOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMenuAnchor, setUploadMenuAnchor] = useState<null | HTMLElement>(null);

  // Load charts from localStorage on mount
  useEffect(() => {
    try {
      const savedCharts = localStorage.getItem(STORAGE_KEY);
      if (savedCharts) {
        const charts = JSON.parse(savedCharts);
        setCreatedCharts(charts);
        console.log('Loaded', charts.length, 'charts from storage');
      }
    } catch (err) {
      console.error('Failed to load charts from storage:', err);
    }
  }, []);

  // Save charts to localStorage whenever they change
  useEffect(() => {
    try {
      if (createdCharts.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(createdCharts));
        console.log('Saved', createdCharts.length, 'charts to storage');
      }
    } catch (err) {
      console.error('Failed to save charts to storage:', err);
    }
  }, [createdCharts]);

  const handleCreateChart = (config: any) => {
    let title = `${config.chartType} - ${config.table}`;
    let message = `Chart created from table: ${config.table}`;

    if (config.chartType === 'multi-layer-map') {
      title = `Multi-Layer Map (${config.layers?.length || 0} layers)`;
      message = `Multi-layer map created with ${config.layers?.length || 0} layers`;
    } else if (config.chartType === 'overlay') {
      title = `Overlay Chart (${config.overlayTypes?.length || 0} layers) - ${config.table}`;
      message = `Overlay chart created with ${config.overlayTypes?.length || 0} visualization types`;
    }

    const newChart: ChartConfig = {
      id: `chart-${Date.now()}`,
      table: config.table,
      chartType: config.chartType,
      title: title,
      filters: {},
      layers: config.layers,
      overlayTypes: config.overlayTypes,
      createdAt: new Date().toISOString(),
    };
    setCreatedCharts(prev => [...prev, newChart]);
    
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleRemoveAllCharts = () => {
    if (window.confirm('Are you sure you want to remove all charts? This cannot be undone.')) {
      setCreatedCharts([]);
      localStorage.removeItem(STORAGE_KEY);
      setSnackbarMessage('All charts removed');
      setSnackbarOpen(true);
    }
  };

  const handleSelectChart = (chartId: string) => {
    setSelectedChartId(chartId);
  };

  const handleShowAllCharts = () => {
    setSelectedChartId(null);
  };

  const handleUpdateChartFilters = (chartId: string, filters: Record<string, any>) => {
    setCreatedCharts(prev =>
      prev.map(chart =>
        chart.id === chartId ? { ...chart, filters } : chart
      )
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
             Geospatial Data Visualization Dashboard
          </Typography>
          
          {/* Upload Menu Button */}
          <Button
            color="inherit"
            startIcon={<UploadIcon />}
            onClick={(e) => setUploadMenuAnchor(e.currentTarget)}
            sx={{ 
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Upload
          </Button>
          
          {/* Upload Dropdown Menu */}
          <Menu
            anchorEl={uploadMenuAnchor}
            open={Boolean(uploadMenuAnchor)}
            onClose={() => setUploadMenuAnchor(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem 
              onClick={() => {
                setUploadMenuAnchor(null);
                setUploadDialogOpen(true);
              }}
            >
              <ListItemIcon>
                <CsvIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Upload CSV</ListItemText>
            </MenuItem>
            <MenuItem 
              onClick={() => {
                setUploadMenuAnchor(null);
                setGeoJsonUploadOpen(true);
              }}
            >
              <ListItemIcon>
                <GeoJsonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Upload GeoJSON</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Filters Drawer */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            mt: 8,
          },
        }}
      >
        <Box sx={{ p: 2, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Actions</Typography>
          </Box>
          <Filters 
            onCreateChart={handleCreateChart}
            charts={createdCharts}
            selectedChartId={selectedChartId}
            onRemoveChart={(chartId) => {
              setCreatedCharts(prev => prev.filter(c => c.id !== chartId));
              if (selectedChartId === chartId) {
                setSelectedChartId(null);
              }
              setSnackbarMessage('Chart removed');
              setSnackbarOpen(true);
            }}
            onSelectChart={handleSelectChart}
            onShowAllCharts={handleShowAllCharts}
            onClearAllCharts={handleRemoveAllCharts}
          />
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: drawerOpen ? 0 : '-280px',
          transition: 'margin 0.3s',
          overflow: 'auto',
          backgroundColor: '#f5f5f5',
        }}
      >
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Created Charts Section */}
        {createdCharts.length > 0 ? (
          <>
            {/* Display selected chart or all charts */}
            {selectedChartId ? (
              // Single Chart View
              (() => {
                const selectedChart = createdCharts.find(c => c.id === selectedChartId);
                if (!selectedChart) return null;
                
                return (
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h5" gutterBottom>
                        {selectedChart.title}
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={handleShowAllCharts}
                        size="small"
                      >
                        Show All Charts
                      </Button>
                    </Box>
                    <Paper
                      elevation={3}
                      sx={{
                        height: 'calc(100vh - 200px)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {selectedChart.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip label={selectedChart.chartType} size="small" color="primary" />
                            <Chip label={selectedChart.table} size="small" color="secondary" />
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setFullscreenChart(selectedChart)}
                            title="Fullscreen"
                          >
                            <FullscreenIcon />
                          </IconButton>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => {
                              setCreatedCharts(prev => prev.filter(c => c.id !== selectedChart.id));
                              setSelectedChartId(null);
                            }}
                          >
                            Remove
                          </Button>
                        </Box>
                      </Box>
                      <Box sx={{ height: 'calc(100% - 80px)' }}>
                        <DynamicChart
                          tableName={selectedChart.table}
                          chartType={selectedChart.chartType}
                          title={selectedChart.title}
                          filters={selectedChart.filters}
                          onFilterChange={(filters) => handleUpdateChartFilters(selectedChart.id, filters)}
                          layers={selectedChart.layers}
                          overlayTypes={selectedChart.overlayTypes}
                        />
                      </Box>
                    </Paper>
                  </Box>
                );
              })()
            ) : (
              // All Charts Grid View
              <>
                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                  Your Visualizations ({createdCharts.length})
                </Typography>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {createdCharts.map((chart) => (
                    <Grid item xs={12} lg={6} key={chart.id} id={`chart-${chart.id}`}>
                      <Paper
                        elevation={3}
                        sx={{
                          height: 500,
                          position: 'relative',
                          overflow: 'hidden',
                          scrollMarginTop: '100px',
                        }}
                      >
                        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {chart.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setFullscreenChart(chart)}
                              title="Fullscreen"
                            >
                              <FullscreenIcon />
                            </IconButton>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => setCreatedCharts(prev => prev.filter(c => c.id !== chart.id))}
                            >
                              Remove
                            </Button>
                          </Box>
                        </Box>
                        <Box sx={{ height: 'calc(100% - 60px)' }}>
                          <DynamicChart
                            tableName={chart.tableName || chart.table}
                            chartType={chart.chartType}
                            filters={chart.filters || {}}
                            onFilterChange={(filters) => handleUpdateChartFilters(chart.id, filters)}
                          />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              textAlign: 'center',
              p: 4,
            }}
          >
            <Typography variant="h4" gutterBottom color="text.secondary">
              No Visualizations Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Get started by uploading your data and creating charts
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Upload CSV File
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddChartIcon />}
                onClick={() => setChartBuilderOpen(true)}
              >
                Create Chart
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* CSV Upload Dialog */}
      <CSVUpload
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={(tableName) => {
          setSnackbarMessage(`CSV uploaded successfully to table: ${tableName}`);
          setSnackbarOpen(true);
        }}
      />

      {/* GeoJSON Upload Dialog */}
      <GeoJSONUpload
        open={geoJsonUploadOpen}
        onClose={() => setGeoJsonUploadOpen(false)}
        onSuccess={(tableName) => {
          setSnackbarMessage(`GeoJSON uploaded successfully to table: ${tableName}`);
          setSnackbarOpen(true);
        }}
      />

      {/* Chart Builder Dialog */}
      <ChartBuilder
        open={chartBuilderOpen}
        onClose={() => setChartBuilderOpen(false)}
        onCreateChart={handleCreateChart}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />

      {/* Fullscreen Chart Dialog */}
      <Dialog
        open={!!fullscreenChart}
        onClose={() => setFullscreenChart(null)}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            width: '95vw',
            height: '95vh',
            maxWidth: 'none',
          },
        }}
      >
        {fullscreenChart && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: '1px solid #e0e0e0',
            }}>
              <Typography variant="h6">{fullscreenChart.title}</Typography>
              <IconButton onClick={() => setFullscreenChart(null)} size="large">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0, height: 'calc(100% - 64px)' }}>
              <Box sx={{ width: '100%', height: '100%' }}>
                <DynamicChart
                  tableName={fullscreenChart.table}
                  chartType={fullscreenChart.chartType}
                  title={fullscreenChart.title}
                  filters={fullscreenChart.filters}
                  onFilterChange={(filters) => handleUpdateChartFilters(fullscreenChart.id, filters)}
                  layers={fullscreenChart.layers}
                  overlayTypes={fullscreenChart.overlayTypes}
                />
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Dashboard;

