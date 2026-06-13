import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemButton,
  IconButton,
  Chip,
  Badge,
} from '@mui/material';
import { 
  Assessment as AddChartIcon,
  Delete as DeleteIcon,
  DeleteSweep as ClearAllIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';
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

interface FiltersProps {
  onCreateChart?: (config: any) => void;
  charts?: ChartConfig[];
  selectedChartId?: string | null;
  onRemoveChart?: (chartId: string) => void;
  onSelectChart?: (chartId: string) => void;
  onShowAllCharts?: () => void;
  onClearAllCharts?: () => void;
}

const Filters = ({ 
  onCreateChart, 
  charts = [], 
  selectedChartId,
  onRemoveChart, 
  onSelectChart,
  onShowAllCharts,
  onClearAllCharts 
}: FiltersProps) => {
  const [chartBuilderOpen, setChartBuilderOpen] = useState(false);

  const handleCreateChart = (config: any) => {
    if (onCreateChart) {
      onCreateChart(config);
    }
  };

  const getChartIcon = () => {
    return <ChartIcon fontSize="small" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Create Chart Button */}
      <Button
        variant="contained"
        fullWidth
        startIcon={<AddChartIcon />}
        onClick={() => setChartBuilderOpen(true)}
        color="primary"
        size="large"
      >
        Create New Chart
      </Button>

      <Typography variant="caption" sx={{ display: 'block', mt: 1, mb: 2, color: 'text.secondary' }}>
        Build visualizations from your database tables
      </Typography>


      {/* Charts List Section */}
      {charts && charts.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ 
            bgcolor: '#f5f5f5', 
            p: 2, 
            borderRadius: 2,
            mb: 2
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#333' }}>
                 My Charts
              </Typography>
              <Badge badgeContent={charts.length} color="primary" max={99}>
                <ChartIcon fontSize="small" />
              </Badge>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              Click to view • {selectedChartId ? '1 selected' : 'Showing all'}
            </Typography>
            {selectedChartId && onShowAllCharts && (
              <Button
                variant="text"
                size="small"
                onClick={onShowAllCharts}
                fullWidth
                sx={{ mt: 1, fontSize: '11px' }}
              >
                Show All Charts
              </Button>
            )}
          </Box>

          <Box sx={{ 
            flex: 1, 
            minHeight: 200,
            maxHeight: 400,
            overflow: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            bgcolor: 'background.paper'
          }}>
            <List dense sx={{ p: 0 }}>
              {charts.map((chart, index) => {
                const isSelected = selectedChartId === chart.id;
                return (
                  <ListItem
                    key={chart.id}
                    disablePadding
                    sx={{
                      borderBottom: index < charts.length - 1 ? '1px solid #f0f0f0' : 'none',
                      bgcolor: isSelected ? '#e3f2fd' : 'transparent',
                      borderLeft: isSelected ? '4px solid #1976d2' : '4px solid transparent',
                      '&:hover': { bgcolor: isSelected ? '#e3f2fd' : '#f9f9f9' }
                    }}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveChart && onRemoveChart(chart.id);
                        }}
                        sx={{ color: '#d32f2f' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      onClick={() => onSelectChart && onSelectChart(chart.id)}
                      sx={{ 
                        py: 1.5,
                        pl: isSelected ? 1.5 : 2
                      }}
                      selected={isSelected}
                    >
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {getChartIcon()}
                        <Typography 
                          variant="body2" 
                          fontWeight={isSelected ? "bold" : "medium"}
                          sx={{ 
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: isSelected ? '#1976d2' : 'inherit'
                          }}
                        >
                          {chart.title}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                        <Chip 
                          label={chart.chartType} 
                          size="small" 
                          sx={{ 
                            height: 18, 
                            fontSize: '10px',
                            bgcolor: '#e3f2fd',
                            color: '#1976d2'
                          }} 
                        />
                        <Chip 
                          label={chart.table} 
                          size="small" 
                          sx={{ 
                            height: 18, 
                            fontSize: '10px',
                            bgcolor: '#f3e5f5',
                            color: '#7b1fa2'
                          }} 
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '10px' }}>
                        {formatDate(chart.createdAt)}
                      </Typography>
                    </Box>
                  </ListItemButton>
                </ListItem>
                );
              })}
            </List>
          </Box>

          {onClearAllCharts && (
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ClearAllIcon />}
              onClick={onClearAllCharts}
              color="error"
              size="small"
              sx={{ mt: 2 }}
            >
              Clear All Charts
            </Button>
          )}
        </>
      )}

      {/* Chart Builder Dialog */}
      <ChartBuilder
        open={chartBuilderOpen}
        onClose={() => setChartBuilderOpen(false)}
        onCreateChart={handleCreateChart}
      />

    </Box>
  );
};

export default Filters;

