import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as go from 'gojs';
import { 
  Box, Paper, Typography, Chip, Alert, Button, Stack, Card, CardContent, 
  CircularProgress, IconButton, Tooltip, Divider, List, ListItem, 
  ListItemText, ListItemIcon, Fab
} from '@mui/material';
import { 
  ZoomOutMap as ZoomToFitIcon, 
  Refresh as RefreshIcon, 
  ArrowBack as BackIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CenterFocusStrong as CenterIcon,
  AccountTree as TreeIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const DynamicWorkflowVisualization: React.FC = () => {
  const location = useLocation();
  const diagramRef = useRef<HTMLDivElement>(null);
  const diagramInstanceRef = useRef<go.Diagram | null>(null);
  
  const [diagram, setDiagram] = useState<go.Diagram | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [originalNodeData, setOriginalNodeData] = useState<any>(null);
  const [diagramKey, setDiagramKey] = useState<number>(0);
  const [isFullscreen] = useState<boolean>(true); // Keep for styling but remove setter
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false); // Force sidebar to show
  const [isDiagramCollapsed, setIsDiagramCollapsed] = useState<boolean>(false); // Diagram expanded by default
  const [workflowStats, setWorkflowStats] = useState<any>(null);

  // Create diagram when workflowData changes
  useEffect(() => {
    if (diagramRef.current && workflowData) {
      console.log('🎨 Creating diagram with useEffect');
      
      // Clean up existing diagram completely
      if (diagramInstanceRef.current) {
        try {
          diagramInstanceRef.current.div = null;
          diagramInstanceRef.current = null;
        } catch (e) {
          console.warn('Error during diagram cleanup:', e);
        }
      }
      
      // Clear the div completely
      const divElement = diagramRef.current;
      divElement.innerHTML = '';
      
      // Create a unique ID for this diagram instance
      const uniqueId = `diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      divElement.id = uniqueId;
      
      const $ = go.GraphObject.make;

      // Create the main diagram with unique ID
      const myDiagram = $(go.Diagram, divElement, {
        'undoManager.isEnabled': true,
        layout: $(go.LayeredDigraphLayout, {
          direction: 90,
          layerSpacing: 120,
          columnSpacing: 80,
          setsPortSpots: false
        }),
        initialContentAlignment: go.Spot.Center,
        allowHorizontalScroll: true,
        allowVerticalScroll: true,
        'toolManager.hoverDelay': 100,
        hasHorizontalScrollbar: true,
        hasVerticalScrollbar: true,
        'grid.visible': true,
        'grid.gridCellSize': new go.Size(30, 30),
        'animationManager.isEnabled': true
      });

      // Function to get node color based on category
      const getNodeColor = (category: string) => {
        const colorMap: { [key: string]: { fill: string, stroke: string } } = {
          'start': { fill: '#4CAF50', stroke: '#2E7D32' },
          'end': { fill: '#F44336', stroke: '#C62828' },
          'decision': { fill: '#FF9800', stroke: '#E65100' },
          'process': { fill: '#2196F3', stroke: '#1565C0' },
          'validation': { fill: '#9C27B0', stroke: '#6A1B9A' },
          'database': { fill: '#607D8B', stroke: '#37474F' },
          'api': { fill: '#00BCD4', stroke: '#0097A7' },
          'error': { fill: '#F44336', stroke: '#C62828' },
          'success': { fill: '#4CAF50', stroke: '#2E7D32' },
          'warning': { fill: '#FF9800', stroke: '#E65100' },
          'info': { fill: '#2196F3', stroke: '#1565C0' }
        };
        return colorMap[category] || colorMap['process'];
      };

      // Start node template
      myDiagram.nodeTemplateMap.add("start",
        $(go.Node, "Auto",
          {
            click: (_, nodeObj: any) => {
              console.log('🖱️ Start node clicked:', nodeObj.data);
              setSelectedNode(nodeObj.data);
            }
          },
          $(go.Shape, "Ellipse",
            {
              fill: "#4CAF50",
              stroke: "#2E7D32",
              strokeWidth: 3,
              width: 150,
              height: 150,
              spot1: go.Spot.TopLeft,
              spot2: go.Spot.BottomRight
            }),
          $(go.Panel, "Vertical",
            $(go.TextBlock, "🚀",
              {
                font: "bold 24px Arial",
                margin: new go.Margin(8, 0, 0, 0)
              }),
            $(go.TextBlock,
              {
                font: "bold 14px Arial",
                stroke: "white",
                maxLines: 4,
                wrap: go.TextBlock.WrapFit,
                textAlign: "center",
                maxSize: new go.Size(130, NaN)
              },
              new go.Binding("text")
            )
          )
        )
      );

      // End node template
      myDiagram.nodeTemplateMap.add("end",
        $(go.Node, "Auto",
          {
            click: (_, nodeObj: any) => {
              console.log('🖱️ End node clicked:', nodeObj.data);
              setSelectedNode(nodeObj.data);
            }
          },
          $(go.Shape, "Ellipse",
            {
              fill: "#F44336",
              stroke: "#C62828",
              strokeWidth: 3,
              width: 150,
              height: 150,
              spot1: go.Spot.TopLeft,
              spot2: go.Spot.BottomRight
            }),
          $(go.Panel, "Vertical",
            $(go.TextBlock, "🏁",
              {
                font: "bold 24px Arial",
                margin: new go.Margin(8, 0, 0, 0)
              }),
            $(go.TextBlock,
              {
                font: "bold 14px Arial",
                stroke: "white",
                maxLines: 4,
                wrap: go.TextBlock.WrapFit,
                textAlign: "center",
                maxSize: new go.Size(130, NaN)
              },
              new go.Binding("text")
            )
          )
        )
      );

      // Decision node template (Diamond shape)
      myDiagram.nodeTemplateMap.add("decision",
        $(go.Node, "Auto",
          {
            click: (_, nodeObj: any) => {
              console.log('🖱️ Decision node clicked:', nodeObj.data);
              setSelectedNode(nodeObj.data);
            }
          },
          $(go.Shape, "Diamond",
            {
              fill: "#FF9800",
              stroke: "#E65100",
              strokeWidth: 3,
              width: 180,
              height: 120
            }),
          $(go.Panel, "Vertical",
            $(go.TextBlock, "❓",
              {
                font: "bold 20px Arial",
                margin: new go.Margin(4, 0, 0, 0)
              }),
            $(go.TextBlock,
              {
                font: "bold 12px Arial",
                stroke: "white",
                maxLines: 5,
                wrap: go.TextBlock.WrapFit,
                textAlign: "center",
                maxSize: new go.Size(160, NaN)
              },
              new go.Binding("text")
            )
          )
        )
      );

      // Default process node template
      myDiagram.nodeTemplateMap.add("",
        $(go.Node, "Auto",
          {
            click: (_, nodeObj: any) => {
              console.log('🖱️ Process node clicked:', nodeObj.data);
              setSelectedNode(nodeObj.data);
            }
          },
          $(go.Shape, "RoundedRectangle",
            {
              parameter1: 15,
              strokeWidth: 3,
              minSize: new go.Size(200, 90)
            },
            new go.Binding("fill", "category", (cat) => getNodeColor(cat || 'process').fill),
            new go.Binding("stroke", "category", (cat) => getNodeColor(cat || 'process').stroke)
          ),
          $(go.Panel, "Vertical",
            $(go.TextBlock,
              {
                font: "16px Arial",
                margin: new go.Margin(2, 0, 0, 0)
              },
              new go.Binding("text", "category", (cat) => {
                const iconMap: { [key: string]: string } = {
                  'validation': '✅',
                  'database': '🗄️',
                  'api': '🌐',
                  'process': '⚙️',
                  'error': '❌',
                  'success': '✅',
                  'warning': '⚠️',
                  'info': 'ℹ️'
                };
                return iconMap[cat] || '⚙️';
              })
            ),
            $(go.TextBlock,
              {
                margin: new go.Margin(4, 8, 8, 8),
                maxSize: new go.Size(180, NaN),
                wrap: go.TextBlock.WrapFit,
                textAlign: "center",
                font: "bold 14px Arial",
                stroke: "white"
              },
              new go.Binding("text")
            )
          )
        )
      );

      // Enhanced link template with different styles
      myDiagram.linkTemplate =
        $(go.Link,
          {
            routing: go.Link.AvoidsNodes,
            curve: go.Link.JumpOver,
            corner: 10,
            toShortLength: 8,
            relinkableFrom: true,
            relinkableTo: true
          },
          $(go.Shape,
            {
              strokeWidth: 3
            },
            new go.Binding("stroke", "", (obj) => {
              // Check if this is from a decision node
              const fromNode = obj.from;
              const diagram = obj.part?.diagram;
              if (diagram) {
                const fromData = diagram.model.findNodeDataForKey(fromNode);
                if (fromData && fromData.category === 'decision') {
                  const fromNodeObj = diagram.findNodeForKey(fromNode);
                  if (fromNodeObj) {
                    const outgoingLinks = fromNodeObj.findLinksOutOf().toArray();
                    const linkIndex = outgoingLinks.indexOf(obj.part);
                    return linkIndex === 0 ? "#4CAF50" : "#F44336"; // Green for True, Red for False
                  }
                }
              }
              
              // Original category-based coloring
              const cat = obj.category;
              const linkColors: { [key: string]: string } = {
                'success': '#4CAF50',
                'error': '#F44336',
                'warning': '#FF9800',
                'info': '#2196F3',
                'yes': '#4CAF50',
                'no': '#F44336',
                'maybe': '#FF9800'
              };
              return linkColors[cat] || '#546E7A';
            })
          ),
          $(go.Shape,
            {
              toArrow: "standard",
              strokeWidth: 0,
              scale: 1.5
            },
            new go.Binding("fill", "", (obj) => {
              // Check if this is from a decision node
              const fromNode = obj.from;
              const diagram = obj.part?.diagram;
              if (diagram) {
                const fromData = diagram.model.findNodeDataForKey(fromNode);
                if (fromData && fromData.category === 'decision') {
                  const fromNodeObj = diagram.findNodeForKey(fromNode);
                  if (fromNodeObj) {
                    const outgoingLinks = fromNodeObj.findLinksOutOf().toArray();
                    const linkIndex = outgoingLinks.indexOf(obj.part);
                    return linkIndex === 0 ? "#4CAF50" : "#F44336"; // Green for True, Red for False
                  }
                }
              }
              
              // Original category-based coloring
              const cat = obj.category;
              const linkColors: { [key: string]: string } = {
                'success': '#4CAF50',
                'error': '#F44336',
                'warning': '#FF9800',
                'info': '#2196F3',
                'yes': '#4CAF50',
                'no': '#F44336',
                'maybe': '#FF9800'
              };
              return linkColors[cat] || '#546E7A';
            })
          ),
          $(go.TextBlock,
            {
              segmentIndex: 2,
              segmentFraction: 0.5,
              segmentOffset: new go.Point(0, -12),
              font: "bold 11px Arial",
              background: "white",
              stroke: "#333",
              margin: new go.Margin(2, 4, 2, 4)
            },
            new go.Binding("text", "", (obj) => {
              // If there's already a label, use it
              if (obj.label) return obj.label;
              
              // Check if this link comes from a decision node
              const fromNode = obj.from;
              const diagram = obj.part?.diagram;
              if (diagram) {
                const fromData = diagram.model.findNodeDataForKey(fromNode);
                if (fromData && fromData.category === 'decision') {
                  // For decision nodes, alternate True/False based on link index
                  const fromNodeObj = diagram.findNodeForKey(fromNode);
                  if (fromNodeObj) {
                    const outgoingLinks = fromNodeObj.findLinksOutOf().toArray();
                    const linkIndex = outgoingLinks.indexOf(obj.part);
                    return linkIndex === 0 ? "True" : "False";
                  }
                }
              }
              return "";
            }),
            new go.Binding("visible", "", (obj) => {
              // Show if there's a label or if it's from a decision node
              if (obj.label) return true;
              const fromNode = obj.from;
              const diagram = obj.part?.diagram;
              if (diagram) {
                const fromData = diagram.model.findNodeDataForKey(fromNode);
                return fromData && fromData.category === 'decision';
              }
              return false;
            }),
            new go.Binding("stroke", "", (obj) => {
              const fromNode = obj.from;
              const diagram = obj.part?.diagram;
              if (diagram) {
                const fromData = diagram.model.findNodeDataForKey(fromNode);
                if (fromData && fromData.category === 'decision') {
                  const fromNodeObj = diagram.findNodeForKey(fromNode);
                  if (fromNodeObj) {
                    const outgoingLinks = fromNodeObj.findLinksOutOf().toArray();
                    const linkIndex = outgoingLinks.indexOf(obj.part);
                    return linkIndex === 0 ? "#4CAF50" : "#F44336"; // Green for True, Red for False
                  }
                }
              }
              return "#333";
            }),
            new go.Binding("background", "", (obj) => {
              const fromNode = obj.from;
              const diagram = obj.part?.diagram;
              if (diagram) {
                const fromData = diagram.model.findNodeDataForKey(fromNode);
                if (fromData && fromData.category === 'decision') {
                  const fromNodeObj = diagram.findNodeForKey(fromNode);
                  if (fromNodeObj) {
                    const outgoingLinks = fromNodeObj.findLinksOutOf().toArray();
                    const linkIndex = outgoingLinks.indexOf(obj.part);
                    return linkIndex === 0 ? "rgba(76, 175, 80, 0.1)" : "rgba(244, 67, 54, 0.1)"; // Light green/red background
                  }
                }
              }
              return "white";
            })
          )
        );

      // Set model data
      console.log('📋 Setting model data...');
      console.log('📋 Nodes:', workflowData.nodes || []);
      console.log('📋 Links:', workflowData.links || []);

      myDiagram.model = new go.GraphLinksModel(
        workflowData.nodes || [],
        workflowData.links || []
      );

      // Calculate workflow statistics
      const stats = {
        totalSteps: workflowData.nodes?.length || 0,
        decisions: workflowData.nodes?.filter((n: any) => n.category === 'decision').length || 0,
        processes: workflowData.nodes?.filter((n: any) => n.category === 'process' || !n.category).length || 0,
        validations: workflowData.nodes?.filter((n: any) => n.category === 'validation').length || 0,
        databases: workflowData.nodes?.filter((n: any) => n.category === 'database').length || 0
      };
      setWorkflowStats(stats);

      console.log('✅ Diagram created with useEffect');
      console.log('📊 Sidebar collapsed state:', isSidebarCollapsed);
      console.log('📊 Workflow stats:', stats);
      diagramInstanceRef.current = myDiagram;
      setDiagram(myDiagram);
    }
  }, [workflowData]);

  // Get node data from navigation state
  useEffect(() => {
    const nodeData = location.state?.nodeData;
    if (nodeData) {
      setOriginalNodeData(nodeData);
      generateWorkflow(nodeData);
    } else {
      setDiagramError('No node data provided');
      setIsLoading(false);
    }
  }, [location.state]);

  const generateWorkflow = async (nodeData: any) => {
    try {
      setIsLoading(true);
      setDiagramError(null);

      // Get user session information for file access
      const username = sessionStorage.getItem('username') || 'melvin-ncompass';
      const repo = sessionStorage.getItem('selected_repo') || 'phonex-backend'; // Fallback to default
      
      // Prepare enhanced request body with parent file information
      const requestBody = {
        nodeData,
        username,
        repo,
        parentFile: nodeData?.file || nodeData?.filePath || null, // Include parent file path if available
        requestContext: {
          timestamp: new Date().toISOString(),
          source: 'dynamic-workflow-visualization'
        }
      };

      console.log('🚀 Sending enhanced workflow request:', requestBody);

      const response = await fetch('/api/flowchart/generateWorkflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      console.log('🔍 Backend Response:', result);
      console.log('🔍 Workflow Data:', result.data?.workflowData);
      console.log('📁 Parent File Analysis:', result.data?.parentFileAnalysis);

      // Check for successful response (statusCode 200 and workflowData exists)
      if (result.statusCode === 200 && result.data?.workflowData) {
        console.log('✅ Setting workflow data:', result.data.workflowData);
        
        // Log parent file analysis results
        const parentAnalysis = result.data.parentFileAnalysis;
        if (parentAnalysis) {
          if (parentAnalysis.fileFound) {
            console.log(`📄 Parent file successfully read: ${parentAnalysis.fileSize} characters`);
          } else {
            console.warn(`📄 Parent file not found: ${parentAnalysis.error || 'Unknown error'}`);
          }
        }
        
        setWorkflowData(result.data.workflowData);
        setDiagramKey(prev => prev + 1); // Force div recreation
      } else if (response.ok && result.data?.workflowData) {
        // Fallback check using HTTP response status
        console.log('✅ Setting workflow data (fallback):', result.data.workflowData);
        
        // Log parent file analysis results for fallback case too
        const parentAnalysis = result.data.parentFileAnalysis;
        if (parentAnalysis) {
          if (parentAnalysis.fileFound) {
            console.log(`📄 Parent file successfully read (fallback): ${parentAnalysis.fileSize} characters`);
          } else {
            console.warn(`📄 Parent file not found (fallback): ${parentAnalysis.error || 'Unknown error'}`);
          }
        }
        
        setWorkflowData(result.data.workflowData);
        setDiagramKey(prev => prev + 1); // Force div recreation
      } else {
        console.error('❌ Workflow generation failed:', result.message);
        console.error('❌ Full error response:', result);
        setDiagramError(result.message || 'Failed to generate workflow');
      }
    } catch (error) {
      console.error('Error generating workflow:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      setDiagramError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (diagramInstanceRef.current) {
        diagramInstanceRef.current.div = null;
        diagramInstanceRef.current = null;
      }
    };
  }, []);

  // Keyboard shortcuts for sidebar and diagram toggle
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Toggle sidebar with Ctrl + B (or Cmd + B on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      }
      // Toggle diagram with Ctrl + D (or Cmd + D on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        setIsDiagramCollapsed(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const zoomToFit = () => {
    if (diagram) {
      diagram.zoomToFit();
    }
  };

  const resetView = () => {
    if (diagram) {
      diagram.scale = 1.0;
      diagram.scrollToRect(diagram.documentBounds);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#121212'
      }}>
        <Card sx={{ p: 4, bgcolor: '#2a2a2a', color: 'white' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              🤖 Generating AI Workflow...
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Analyzing: <strong>{originalNodeData?.text}</strong>
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              This may take 10-30 seconds while our AI processes your code structure and analyzes the parent file context
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (diagramError) {
    return (
      <Box sx={{ p: 3, bgcolor: '#121212', minHeight: '100vh' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {diagramError}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<BackIcon />}
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      height: isFullscreen ? '100vh' : '100vh', 
      bgcolor: '#0a0a0a',
      position: isFullscreen ? 'fixed' : 'relative',
      top: isFullscreen ? 0 : 'auto',
      left: isFullscreen ? 0 : 'auto',
      right: isFullscreen ? 0 : 'auto',
      bottom: isFullscreen ? 0 : 'auto',
      zIndex: isFullscreen ? 9999 : 'auto'
    }}>
      {/* Enhanced Header */}
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 2 }}>
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<BackIcon />}
            onClick={() => window.history.back()}
            sx={{ 
              color: '#fff', 
              borderColor: 'rgba(255,255,255,0.3)',
              '&:hover': { borderColor: '#4CAF50', color: '#4CAF50' }
            }}
          >
            Back
          </Button>
          
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box>
                <Typography variant="h5" component="h1" sx={{ 
                  color: '#fff', 
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #4CAF50 30%, #2196F3 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                   Workflow
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                   <strong>{originalNodeData?.text || 'Selected Function'}</strong>
                </Typography>
              </Box>
              
              {workflowStats && (
                <Stack direction="row" spacing={1}>
                  <Chip 
                    icon={<TreeIcon />}
                    label={`${workflowStats.totalSteps} Steps`} 
                    size="small"
                    sx={{ bgcolor: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50' }}
                  />
                  {workflowStats.decisions > 0 && (
                    <Chip 
                      icon={<WarningIcon />}
                      label={`${workflowStats.decisions} Decisions`} 
                      size="small"
                      sx={{ bgcolor: 'rgba(255, 152, 0, 0.2)', color: '#FF9800' }}
                    />
                  )}
                  <Chip 
                    icon={<TimelineIcon />}
                    label={`${workflowStats.processes} Processes`} 
                    size="small"
                    sx={{ bgcolor: 'rgba(33, 150, 243, 0.2)', color: '#2196F3' }}
                  />
                </Stack>
              )}
            </Stack>
            
            {originalNodeData?.children && (
              <Typography variant="caption" sx={{ color: '#888' }}>
                Analyzed {originalNodeData.children.length} child dependencies
              </Typography>
            )}
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Zoom to Fit">
              <IconButton
                onClick={zoomToFit}
                sx={{ color: '#fff', '&:hover': { color: '#4CAF50' } }}
              >
                <ZoomToFitIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Reset View">
              <IconButton
                onClick={resetView}
                sx={{ color: '#fff', '&:hover': { color: '#4CAF50' } }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isDiagramCollapsed ? "Expand Diagram (Ctrl+D)" : "Collapse Diagram (Ctrl+D)"}>
              <IconButton
                onClick={() => setIsDiagramCollapsed(!isDiagramCollapsed)}
                sx={{ color: '#fff', '&:hover': { color: '#FF9800' } }}
              >
                {isDiagramCollapsed ? <ZoomToFitIcon /> : <CenterIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}>
              <IconButton
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                sx={{ color: '#fff', '&:hover': { color: '#4CAF50' } }}
              >
                {isSidebarCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'row',
        mt: '120px' // Account for header height and show start node
      }}>
        {/* Diagram area */}
        <Box sx={{ 
          flex: 1, 
          position: 'relative', 
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          overflow: 'hidden',
          width: isDiagramCollapsed ? 0 : 'auto',
          minWidth: isDiagramCollapsed ? 0 : 'auto',
          opacity: isDiagramCollapsed ? 0 : 1,
          visibility: isDiagramCollapsed ? 'hidden' : 'visible',
          transition: 'all 0.3s ease-in-out',
        }}>
          <div 
            key={diagramKey}
            ref={diagramRef}
            style={{ 
              width: '100%', 
              height: '100%',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }} 
          />
          
          {/* Floating Action Buttons - Responsive positioning */}
          {!isDiagramCollapsed && (
            <Box sx={{ 
              position: 'absolute',
              bottom: 24,
              right: isSidebarCollapsed ? 24 : 420, // Adjust position based on sidebar state
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              transition: 'right 0.3s ease-in-out', // Smooth transition
              zIndex: 1000
            }}>
            <Tooltip title="Center Diagram">
              <Fab 
                size="medium" 
                onClick={() => diagram?.zoomToFit()}
                sx={{ 
                  bgcolor: '#4CAF50',
                  '&:hover': { bgcolor: '#45a049' }
                }}
              >
                <CenterIcon />
              </Fab>
            </Tooltip>
            
            {/* Sidebar Toggle Button - Available when sidebar is collapsed */}
            {isSidebarCollapsed && (
              <Tooltip title="Expand Sidebar">
                <Fab 
                  size="medium" 
                  onClick={() => setIsSidebarCollapsed(false)}
                  sx={{ 
                    bgcolor: '#2196F3',
                    '&:hover': { bgcolor: '#1976D2' }
                  }}
                >
                  <ExpandMoreIcon />
                </Fab>
              </Tooltip>
            )}
          </Box>
          )}
        </Box>

        {/* Collapsed Sidebar Indicator */}
        {isSidebarCollapsed && (
          <Box sx={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            bgcolor: 'rgba(33, 150, 243, 0.8)',
            color: 'white',
            borderRadius: '12px 0 0 12px',
            padding: '8px 4px',
            cursor: 'pointer',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: 'rgba(33, 150, 243, 1)',
              transform: 'translateY(-50%) translateX(-4px)',
            }
          }}
          onClick={() => setIsSidebarCollapsed(false)}
          >
            <ExpandMoreIcon sx={{ fontSize: 16, transform: 'rotate(-90deg)' }} />
            <Typography variant="caption" sx={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              Details
            </Typography>
          </Box>
        )}

        {/* Center Control Panel - When both diagram and sidebar are collapsed */}
        {isDiagramCollapsed && isSidebarCollapsed && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '16px',
            padding: '24px',
            cursor: 'pointer',
            zIndex: 1002,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            minWidth: '300px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, textAlign: 'center' }}>
              🎛️ Control Panel
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 3, textAlign: 'center' }}>
              Both diagram and sidebar are collapsed. Choose what to expand:
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button 
                variant="contained"
                startIcon={<ZoomToFitIcon />}
                onClick={() => setIsDiagramCollapsed(false)}
                sx={{ 
                  bgcolor: '#FF9800',
                  '&:hover': { bgcolor: '#F57C00' }
                }}
              >
                Show Diagram
              </Button>
              <Button 
                variant="contained"
                startIcon={<ExpandMoreIcon />}
                onClick={() => setIsSidebarCollapsed(false)}
                sx={{ 
                  bgcolor: '#2196F3',
                  '&:hover': { bgcolor: '#1976D2' }
                }}
              >
                Show Details
              </Button>
            </Stack>
            <Typography variant="caption" sx={{ color: '#888', mt: 2, textAlign: 'center' }}>
              Keyboard shortcuts: Ctrl+D (Diagram) • Ctrl+B (Sidebar)
            </Typography>
          </Box>
        )}

        {/* Collapsed Diagram Indicator */}
        {isDiagramCollapsed && (
          <Box sx={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            bgcolor: 'rgba(255, 152, 0, 0.8)',
            color: 'white',
            borderRadius: '0 12px 12px 0',
            padding: '8px 4px',
            cursor: 'pointer',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: 'rgba(255, 152, 0, 1)',
              transform: 'translateY(-50%) translateX(4px)',
            }
          }}
          onClick={() => setIsDiagramCollapsed(false)}
          >
            <ExpandMoreIcon sx={{ fontSize: 16, transform: 'rotate(90deg)' }} />
            <Typography variant="caption" sx={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              Diagram
            </Typography>
          </Box>
        )}

        {/* Enhanced Sidebar - Expandable/Collapsible */}
        <Paper elevation={8} sx={{ 
          width: isSidebarCollapsed ? 0 : (isDiagramCollapsed ? '100%' : 380),
          minWidth: isSidebarCollapsed ? 0 : (isDiagramCollapsed ? 'auto' : 380),
          maxWidth: isSidebarCollapsed ? 0 : (isDiagramCollapsed ? 'none' : 380),
          bgcolor: '#1a1a2e',
          color: '#fff',
          borderLeft: isSidebarCollapsed ? 'none' : '1px solid rgba(255,255,255,0.1)',
          overflow: isSidebarCollapsed ? 'hidden' : 'auto',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
          flexShrink: 0,
          transition: 'all 0.3s ease-in-out',
          opacity: isSidebarCollapsed ? 0 : 1,
          visibility: isSidebarCollapsed ? 'hidden' : 'visible',
        }}>
            {selectedNode ? (
              <Box sx={{ p: 3 }}>
                {/* Diagram Expand Button - Available when diagram is collapsed */}
                {isDiagramCollapsed && (
                  <Card sx={{ mb: 3, bgcolor: 'rgba(255, 152, 0, 0.1)', borderLeft: '4px solid #FF9800' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#FF9800', fontWeight: 'bold' }}>
                          📊 Diagram Collapsed
                        </Typography>
                        <Button 
                          size="small"
                          onClick={() => setIsDiagramCollapsed(false)}
                          sx={{ 
                            color: '#FF9800',
                            borderColor: '#FF9800',
                            '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.1)' }
                          }}
                          variant="outlined"
                        >
                          Expand Diagram
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                )}
                
                <Typography variant="h6" gutterBottom sx={{ 
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  🔍 Step Details
                  <Chip 
                    label={selectedNode.category || 'process'} 
                    size="small"
                    sx={{ 
                      bgcolor: selectedNode.category === 'start' ? '#4CAF50' :
                               selectedNode.category === 'end' ? '#F44336' :
                               selectedNode.category === 'decision' ? '#FF9800' : '#2196F3',
                      color: 'white',
                      ml: 'auto'
                    }}
                  />
                </Typography>

                <Card sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.05)', color: '#fff' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#4CAF50' }}>
                      {selectedNode.name || selectedNode.text}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 2, color: '#b0b0b0', lineHeight: 1.6 }}>
                      {selectedNode.description || 'AI-generated workflow step based on code analysis'}
                    </Typography>

                    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                    
                    <List dense>
                      <ListItem>
                        <ListItemIcon><InfoIcon sx={{ color: '#2196F3' }} /></ListItemIcon>
                        <ListItemText 
                          primary="Type" 
                          secondary={selectedNode.type || selectedNode.category || 'Process'}
                          sx={{ '& .MuiListItemText-secondary': { color: '#b0b0b0' } }}
                        />
                      </ListItem>
                      
                      {selectedNode.level !== undefined && (
                        <ListItem>
                          <ListItemIcon><TimelineIcon sx={{ color: '#FF9800' }} /></ListItemIcon>
                          <ListItemText 
                            primary="Level" 
                            secondary={`Level ${selectedNode.level}`}
                            sx={{ '& .MuiListItemText-secondary': { color: '#b0b0b0' } }}
                          />
                        </ListItem>
                      )}
                      
                      {selectedNode.category === 'decision' && (
                        <ListItem>
                          <ListItemIcon><WarningIcon sx={{ color: '#FF9800' }} /></ListItemIcon>
                          <ListItemText 
                            primary="Decision Point" 
                            secondary="This step requires conditional logic"
                            sx={{ '& .MuiListItemText-secondary': { color: '#b0b0b0' } }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>

                <Card sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', borderLeft: '4px solid #4CAF50' }}>
                  <CardContent>
                    <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 'bold', mb: 1 }}>
                      🤖 AI Analysis
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b0b0b0', lineHeight: 1.4 }}>
                      <strong>Step Analysis:</strong> {selectedNode.category === 'start' ? 
                        `This is the entry point of the ${originalNodeData?.text || 'function'}. The workflow begins here with initial setup and parameter validation.` :
                        selectedNode.category === 'end' ? 
                        `This marks the completion of the ${originalNodeData?.text || 'function'}. All processing paths converge here with the final return value or result.` :
                        selectedNode.category === 'decision' ? 
                        `This decision node evaluates conditions within ${originalNodeData?.text || 'the function'}. Based on the evaluation, the workflow branches into different execution paths (True/False).` :
                        selectedNode.category === 'validation' ?
                        `This step performs input validation and data integrity checks for ${originalNodeData?.text || 'the function'}, ensuring all parameters meet the required criteria before processing.` :
                        selectedNode.category === 'database' ?
                        `This step handles database operations related to ${originalNodeData?.text || 'the function'}, including data retrieval, storage, or updates as part of the workflow.` :
                        `This process step executes core business logic within ${originalNodeData?.text || 'the function'}. It represents a key computational or operational task in the workflow sequence.`}
                      <br/><br/>
                      <strong>Parent Context:</strong> This step is part of the "{originalNodeData?.text || 'selected function'}" workflow, which was analyzed from your codebase structure. The AI identified this as a critical component based on code dependencies and execution patterns.
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                {/* Diagram Expand Button - Available when diagram is collapsed */}
                {isDiagramCollapsed && (
                  <Card sx={{ mb: 3, bgcolor: 'rgba(255, 152, 0, 0.1)', borderLeft: '4px solid #FF9800' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#FF9800', fontWeight: 'bold' }}>
                          📊 Diagram Collapsed
                        </Typography>
                        <Button 
                          size="small"
                          onClick={() => setIsDiagramCollapsed(false)}
                          sx={{ 
                            color: '#FF9800',
                            borderColor: '#FF9800',
                            '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.1)' }
                          }}
                          variant="outlined"
                        >
                          Expand Diagram
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                )}
                
                <TreeIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                  Select a Workflow Step
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Click on any node in the diagram to view detailed information about that workflow step.
                </Typography>
                
                {workflowStats && (
                  <Card sx={{ mt: 3, bgcolor: 'rgba(255,255,255,0.05)' }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ color: '#fff', mb: 2 }}>
                        📊 Workflow Statistics
                      </Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Total Steps:</Typography>
                          <Typography variant="body2" sx={{ color: '#4CAF50' }}>{workflowStats.totalSteps}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Decisions:</Typography>
                          <Typography variant="body2" sx={{ color: '#FF9800' }}>{workflowStats.decisions}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Processes:</Typography>
                          <Typography variant="body2" sx={{ color: '#2196F3' }}>{workflowStats.processes}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}
        </Paper>
      </Box>
    </Box>
  );
};

export default DynamicWorkflowVisualization;