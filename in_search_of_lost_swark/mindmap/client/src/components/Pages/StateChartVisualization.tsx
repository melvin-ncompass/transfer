import React, { useEffect, useRef, useState } from 'react';
import * as go from 'gojs';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Stack,
  TextField,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitScreenIcon,
  PlayArrow as PlayIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { graphData } from '../../data/graphData';

interface StateChartVisualizationProps {
  projectName?: string;
  username?: string;
}

const StateChartVisualization: React.FC<StateChartVisualizationProps> = ({
  projectName = 'phonex',
  username = 'saahithi-ncompass'
}) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [diagram, setDiagram] = useState<go.Diagram | null>(null);
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateChartData, setStateChartData] = useState<any>(null);

  const $ = go.GraphObject.make;

  // Transform graphData to state chart format (synchronous like Neo4jVisualization)
  const transformStateChartData = () => {
    try {
      console.log('Starting data transformation...');
      
      if (!graphData || !graphData.nodes || !graphData.links) {
        throw new Error('GraphData is not available or invalid');
      }
      
      console.log('GraphData available:', graphData.nodes.length, 'nodes,', graphData.links.length, 'links');
      
      const transformedData = {
        class: "GraphLinksModel",
        linkFromPortIdProperty: "fromPort",
        linkToPortIdProperty: "toPort", 
        nodeDataArray: graphData.nodes.slice(0, 50).map((node: any, index: number) => {
          // Determine node type based on node properties
          let type = "Process";
          if (node.name.includes("get") || node.name.includes("fetch")) type = "Service";
          if (node.name.includes("validate") || node.name.includes("check")) type = "Decision";
          if (node.group === "controller") type = "Process";
          if (index === 0) type = "Start";
          if (index === 49) type = "End";
          
          return {
            key: node.id,
            text: node.name.length > 25 ? node.name.substring(0, 25) + "..." : node.name,
            type: type,
            color: type === "Start" ? "#4ade80" : 
                   type === "End" ? "#f87171" :
                   type === "Decision" ? "#fbbf24" :
                   type === "Service" ? "#60a5fa" : "#a78bfa"
          };
        }),
        linkDataArray: graphData.links.slice(0, 30).map((link: any) => ({
          from: link.source,
          to: link.target,
          text: "",
          progress: Math.random() * 100
        }))
      };

      console.log('Data transformation completed:', transformedData.nodeDataArray.length, 'nodes');
      return transformedData;
    } catch (error) {
      console.error('Error transforming state chart data:', error);
      setDiagramError(`Failed to transform data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  // Initialize GoJS State Chart (synchronous like Neo4jVisualization)
  const initializeDiagram = () => {
    if (!diagramRef.current) return;

    try {
      setLoading(true);
      
      // Clear previous diagram
      diagramRef.current.innerHTML = '';
      
      // Create unique diagram ID
      const diagramId = `state-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      diagramRef.current.id = diagramId;

      // Transform data
      const data = transformStateChartData();
      if (!data) {
        console.error('No data returned from transformStateChartData');
        setLoading(false);
        return;
      }
      console.log('Data loaded successfully:', data);
      setStateChartData(data);

      // Create the state chart diagram
      const myDiagram = $(go.Diagram, diagramRef.current, {
        "animationManager.initialAnimationStyle": go.AnimationManager.None,
        initialContentAlignment: go.Spot.Center,
        "undoManager.isEnabled": true,
        allowZoom: true,
        allowHorizontalScroll: true,
        allowVerticalScroll: true,
        hasHorizontalScrollbar: false,
        hasVerticalScrollbar: false,
        // State chart specific layout
        layout: $(go.LayeredDigraphLayout, {
          direction: 0,
          layerSpacing: 100,
          columnSpacing: 50,
          setsPortSpots: false
        })
      });

      // Define state node template based on the reference image
      myDiagram.nodeTemplate = $(
        go.Node,
        "Auto",
        {
          locationSpot: go.Spot.Center,
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides,
          isShadowed: true,
          shadowBlur: 1,
          shadowOffset: new go.Point(0, 1),
          shadowColor: "rgba(0, 0, 0, .14)"
        },
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        // Define different shapes based on node type
        $(go.Shape, "RoundedRectangle",
          {
            fill: "#79C7E3",
            stroke: "#00A9C9",
            strokeWidth: 2,
            parameter1: 20
          },
          new go.Binding("fill", "type", (type) => {
            switch (type) {
              case "Start": return "#90EE90";
              case "End": return "#FFB6C1";
              case "Process": return "#87CEEB";
              case "Service": return "#DDA0DD";
              case "Data": return "#F0E68C";
              default: return "#87CEEB";
            }
          }),
          new go.Binding("stroke", "type", (type) => {
            switch (type) {
              case "Start": return "#228B22";
              case "End": return "#DC143C";
              case "Process": return "#4682B4";
              case "Service": return "#8B4B9F";
              case "Data": return "#B8860B";
              default: return "#4682B4";
            }
          }),
          new go.Binding("figure", "type", (type) => {
            if (type === "Start" || type === "End") return "Circle";
            return "RoundedRectangle";
          })
        ),
        $(go.TextBlock,
          {
            font: "bold 11pt Helvetica, Arial, sans-serif",
            stroke: "whitesmoke",
            margin: 8,
            maxSize: new go.Size(160, NaN),
            wrap: go.TextBlock.WrapFit,
            editable: false
          },
          new go.Binding("text", "text").makeTwoWay()
        )
      );

      // Define link template for state transitions
      myDiagram.linkTemplate = $(
        go.Link,
        {
          routing: go.Link.AvoidsNodes,
          curve: go.Link.JumpOver,
          corner: 5,
          toShortLength: 4,
          relinkableFrom: true,
          relinkableTo: true,
          reshapable: true,
          resegmentable: true
        },
        new go.Binding("points").makeTwoWay(),
        new go.Binding("curviness", "curviness"),
        $(go.Shape,
          { strokeWidth: 2, stroke: "#555" },
          new go.Binding("stroke", "progress", (progress) => 
            progress ? "#52ce60" : "#faa21b"
          ),
          new go.Binding("strokeWidth", "progress", (progress) => 
            progress ? 2.5 : 2
          ),
          new go.Binding("strokeDashArray", "progress", (progress) => 
            progress ? null : [5, 6]
          )
        ),
        $(go.Shape,
          { toArrow: "standard", strokeWidth: 0, scale: 1.3 },
          new go.Binding("fill", "progress", (progress) => 
            progress ? "#52ce60" : "#faa21b"
          )
        ),
        $(go.Panel, "Auto",
          $(go.Shape, "RoundedRectangle",
            { fill: "#F8F8F8", stroke: null, strokeWidth: 0 },
            new go.Binding("fill", "progress", (progress) => 
              progress ? "#E8F5E8" : "#FFF4E6"
            )
          ),
          $(go.TextBlock,
            {
              textAlign: "center",
              font: "10pt helvetica, arial, sans-serif",
              stroke: "#333",
              margin: 2,
              minSize: new go.Size(10, NaN),
              editable: false
            },
            new go.Binding("text", "text").makeTwoWay()
          )
        )
      );

      // Load the model data
      myDiagram.model = go.Model.fromJson(JSON.stringify(data));

      setDiagram(myDiagram);
      setDiagramError(null);
      setLoading(false);
      
    } catch (error: any) {
      console.error('Error initializing state chart:', error);
      setDiagramError(`Failed to initialize state chart: ${error.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeDiagram();
    
    return () => {
      if (diagram) {
        diagram.div = null;
      }
    };
  }, [projectName, username]);

  // Control functions
  const zoomIn = () => {
    if (diagram) diagram.commandHandler.increaseZoom();
  };

  const zoomOut = () => {
    if (diagram) diagram.commandHandler.decreaseZoom();
  };

  const fitToScreen = () => {
    if (diagram) diagram.zoomToFit();
  };

  const resetLayout = () => {
    if (diagram) {
      diagram.layoutDiagram(true);
      diagram.zoomToFit();
    }
  };

  const animateFlow = () => {
    if (diagram) {
      // Animate through the flow
      diagram.startTransaction("animate");
      let delay = 0;
      diagram.links.each((link: any) => {
        if (link.data.progress) {
          setTimeout(() => {
            link.highlight();
            setTimeout(() => link.clearHighlight(), 1000);
          }, delay);
          delay += 500;
        }
      });
      diagram.commitTransaction("animate");
    }
  };

  // Debug information
  console.log('Component render - graphData available:', !!graphData);
  if (graphData) {
    console.log('GraphData structure:', {
      hasNodes: !!graphData.nodes,
      hasLinks: !!graphData.links,
      nodeCount: graphData.nodes?.length || 0,
      linkCount: graphData.links?.length || 0
    });
  }

  if (diagramError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={initializeDiagram}>
              Retry
            </Button>
          }
        >
          <div>
            <div>{diagramError}</div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              GraphData available: {graphData ? 'Yes' : 'No'}
              {graphData && (
                <>
                  <br />Nodes: {graphData.nodes?.length || 0}
                  <br />Links: {graphData.links?.length || 0}
                </>
              )}
            </div>
          </div>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2D3748' }}>
            State Chart Visualization
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip 
              label={`Project: ${projectName}`} 
              variant="outlined" 
              sx={{ bgcolor: '#E2E8F0' }} 
            />
            <Chip 
              label={`User: ${username}`} 
              variant="outlined" 
              sx={{ bgcolor: '#E2E8F0' }} 
            />
          </Stack>
        </Box>
        
        {/* Debug Info */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <div>
            <strong>Data Status:</strong><br />
            GraphData Available: {graphData ? 'Yes' : 'No'}<br />
            {graphData && (
              <>
                Nodes: {graphData.nodes?.length || 0}<br />
                Links: {graphData.links?.length || 0}<br />
                Loading: {loading ? 'Yes' : 'No'}<br />
                State Chart Data: {stateChartData ? 'Ready' : 'Not loaded'}
              </>
            )}
          </div>
        </Alert>

        {/* Controls */}
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search states..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200, bgcolor: 'white' }}
          />
          
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={animateFlow}
            sx={{ 
              bgcolor: '#48BB78', 
              '&:hover': { bgcolor: '#38A169' },
              textTransform: 'none'
            }}
          >
            Animate Flow
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<FitScreenIcon />}
            onClick={fitToScreen}
            sx={{ 
              borderColor: '#4A5568', 
              color: '#4A5568',
              textTransform: 'none'
            }}
          >
            Fit to Screen
          </Button>
          
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={resetLayout}
            sx={{ 
              bgcolor: '#4299E1', 
              '&:hover': { bgcolor: '#3182CE' },
              textTransform: 'none'
            }}
          >
            Reset Layout
          </Button>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ZoomInIcon />}
              onClick={zoomIn}
              sx={{ 
                borderColor: '#4A5568', 
                color: '#4A5568',
                minWidth: 'auto',
                px: 2
              }}
            >
            </Button>
            <Button
              variant="outlined"
              startIcon={<ZoomOutIcon />}
              onClick={zoomOut}
              sx={{ 
                borderColor: '#4A5568', 
                color: '#4A5568',
                minWidth: 'auto',
                px: 2
              }}
            >
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* State Chart Container */}
      <Paper 
        sx={{ 
          flex: 1, 
          p: 2, 
          borderRadius: 2,
          bgcolor: 'white',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%' 
          }}>
            <Typography variant="h6" color="text.secondary">
              Loading state chart...
            </Typography>
          </Box>
        ) : (
          <div
            ref={diagramRef}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#fafafa',
              border: '1px solid #e0e0e0',
              borderRadius: '8px'
            }}
          />
        )}
      </Paper>

      {/* Footer Info */}
      {stateChartData && (
        <Paper sx={{ p: 1, mt: 1, bgcolor: '#2D3748', color: 'white' }}>
          <Typography variant="caption" sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Nodes: {stateChartData.nodeDataArray?.length || 0}</span>
            <span>Links: {stateChartData.linkDataArray?.length || 0}</span>
            <span>Generated: {stateChartData.metadata?.generatedAt ? new Date(stateChartData.metadata.generatedAt).toLocaleTimeString() : 'N/A'}</span>
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default StateChartVisualization;