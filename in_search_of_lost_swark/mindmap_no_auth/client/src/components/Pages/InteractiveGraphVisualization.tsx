import React, { useEffect, useRef, useState } from 'react';
import * as go from 'gojs';
import { Box, Typography, Button, Stack, Paper } from '@mui/material';
import { graphData } from '../../data/graphData';

// Simple icons as SVG strings
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="m21 10-9-9-9 9"></path>
    <path d="m3 14 9 9 9-9"></path>
  </svg>
);

const CenterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="m3 12 6-6-6-6"></path>
    <path d="m21 12-6-6 6-6"></path>
    <path d="m12 3 6 6-6 6"></path>
    <path d="m12 21-6-6 6-6"></path>
  </svg>
);

const ZoomInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
    <line x1="11" y1="8" x2="11" y2="14"></line>
    <line x1="8" y1="11" x2="14" y2="11"></line>
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
    <line x1="8" y1="11" x2="14" y2="11"></line>
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const InteractiveGraphVisualization: React.FC = () => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [diagram, setDiagram] = useState<go.Diagram | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [currentQuery, setCurrentQuery] = useState('MATCH (n) RETURN n LIMIT 50');
  const [isQueryRunning, setIsQueryRunning] = useState(false);
  const [queryResults, setQueryResults] = useState({ nodes: 0, relationships: 0 });
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const diagramId = useRef(`gojs-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Initialize GoJS diagram
  useEffect(() => {
    if (!diagramRef.current) return;

    // Check if there's already a diagram instance in this div
    const existingDiagram = (diagramRef.current as any)['data-gojs-diagram'];
    if (existingDiagram) {
      setDiagram(existingDiagram);
      return;
    }

    // Small delay to ensure React has finished rendering
    const initDiagram = () => {
      try {
      const $ = go.GraphObject.make;

        if (!diagramRef.current) return;

        // Ensure the div is completely clean and remove any GoJS references
        diagramRef.current.innerHTML = '';
        diagramRef.current.style.cssText = '';
        
        // Remove any GoJS-specific properties that might exist
        const diagramDiv = diagramRef.current;
        Object.getOwnPropertyNames(diagramDiv).forEach(prop => {
          if (prop.startsWith('_gojs') || prop.includes('diagram')) {
            try {
              delete (diagramDiv as any)[prop];
            } catch (e) {
              // Ignore deletion errors
            }
          }
        });

        // Create the diagram with Neo4j-like fluid behavior
        const myDiagram = $(go.Diagram, diagramRef.current, {
          initialContentAlignment: go.Spot.Center,
          'undoManager.isEnabled': true,
          allowZoom: true,
          allowHorizontalScroll: true,
          allowVerticalScroll: true,
          hasHorizontalScrollbar: false,
          hasVerticalScrollbar: false,
          layout: $(go.ForceDirectedLayout, {
            // Enhanced ball-and-string physics parameters
            defaultSpringLength: 120, // Longer strings for better movement
            defaultElectricalCharge: 250, // Reduced repulsion for closer grouping
            defaultGravitationalMass: 15, // Lighter nodes for more fluid movement
            defaultSpringStiffness: 0.12, // More elastic springs
            
            // Continuous physics simulation for real-time interaction
            maxIterations: 800,
            epsilonDistance: 0.3, // Tighter convergence for smoother movement
            infinityDistance: 1500,
            
            // Enable ongoing layout for fluid ball-and-string movement
            isOngoing: true,
            isInitial: true,
            isViewportSized: false,
            
            // Add damping for more natural oscillation
            arrangementSpacing: new go.Size(80, 80)
          })
        });

    // Define Neo4j-style node template with physics-based movement
    myDiagram.nodeTemplate = $(
      go.Node,
      'Auto',
      {
        // Enable fluid dragging and selection
        movable: true,
        selectable: true,
        resizable: false,
        // Enhanced physics behavior for string-like movement
        // Enhanced physics interaction events
        mouseDragEnter: () => {
          // Start continuous physics when dragging begins
          if (myDiagram && myDiagram.layout) {
            (myDiagram.layout as go.ForceDirectedLayout).isOngoing = true;
          }
        },
        mouseDragLeave: () => {
          // Continue physics for a bit after drag ends
          setTimeout(() => {
            if (myDiagram && myDiagram.layout) {
              (myDiagram.layout as go.ForceDirectedLayout).isOngoing = false;
            }
          }, 2000);
        },
        // Neo4j-like hover and click behavior
        mouseEnter: (_e: go.InputEvent, node: go.GraphObject) => {
          const shape = (node as any).findObject('SHAPE') as go.Shape;
          if (shape) {
            (shape as any).strokeWidth = 4;
            (shape as any).stroke = '#FFD700';
          }
          myDiagram.currentCursor = 'pointer';
        },
        mouseLeave: (_e: go.InputEvent, node: go.GraphObject) => {
          const shape = (node as any).findObject('SHAPE') as go.Shape;
          if (shape && !(node as any).part.isSelected) {
            (shape as any).strokeWidth = 2;
            (shape as any).stroke = '#333';
          }
          myDiagram.currentCursor = '';
        },
        click: (_e: go.InputEvent, node: go.GraphObject) => {
          const nodeData = (node as any).part.data;
          setSelectedNode(nodeData);
          console.log('Node clicked:', nodeData);
        },
        // Add animation on selection
        selectionChanged: (part: go.Part) => {
          if (part.isSelected) {
            const shape = part.findObject('SHAPE') as go.Shape;
            if (shape) {
              (shape as any).strokeWidth = 4;
              (shape as any).stroke = '#4FD1C7';
            }
          } else {
            const shape = part.findObject('SHAPE') as go.Shape;
            if (shape) {
              (shape as any).strokeWidth = 2;
              (shape as any).stroke = '#333';
            }
          }
        }
      },
      // Enhanced 3D ball appearance for realistic physics visualization
      $(
        go.Shape,
        'Circle',
        {
          name: 'SHAPE',
          width: 70,
          height: 70,
          strokeWidth: 3,
          stroke: '#2D3748',
          portId: '', // Allow links to connect anywhere on the node
          cursor: 'pointer',
          // Add subtle shadow effect for 3D appearance
          opacity: 0.95
        },
        new go.Binding('fill', 'group', (group: string) => {
          const colors: { [key: string]: string } = {
            'controller': '#FF6B35',
            'business-logic': '#4ECDC4',
            'service': '#45B7D1',
            'utility': '#96CEB4',
            'model': '#FFEAA7',
            'config': '#DDA0DD',
            'default': '#FF7F50'
          };
          return colors[group] || colors.default;
        }),
        // Animate color changes
        new go.Binding('stroke', 'isSelected', (sel: boolean) => sel ? '#4FD1C7' : '#333').ofObject(),
        new go.Binding('strokeWidth', 'isSelected', (sel: boolean) => sel ? 4 : 2).ofObject()
      ),
      // Enhanced node text
      $(
        go.TextBlock,
        {
          margin: 4,
          font: 'bold 10px Segoe UI, sans-serif',
          stroke: 'white',
          textAlign: 'center',
          maxSize: new go.Size(50, NaN),
          wrap: go.TextBlock.WrapFit
        },
        new go.Binding('text', 'name', (name: string) => {
          // Better text formatting for readability
          return name.length > 12 ? name.substring(0, 10) + '...' : name;
        })
      )
    );

    // Define Neo4j-style link template with spring-like behavior
    myDiagram.linkTemplate = $(
      go.Link,
      {
        // Make links act like flexible strings/springs
        routing: go.Link.Normal,
        curve: go.Link.Bezier,
        curviness: 20,
        corner: 15,
        toShortLength: 8,
        relinkableFrom: true,
        relinkableTo: true,
        reshapable: true,
        resegmentable: true,
        selectable: true,
        // Hover effects for relationships
        mouseEnter: (_e: go.InputEvent, link: go.GraphObject) => {
          const shape = (link as any).findObject('LINKSHAPE') as go.Shape;
          if (shape) {
            (shape as any).strokeWidth = 3;
            (shape as any).stroke = '#4FD1C7';
          }
          myDiagram.currentCursor = 'pointer';
        },
        mouseLeave: (_e: go.InputEvent, link: go.GraphObject) => {
          const shape = (link as any).findObject('LINKSHAPE') as go.Shape;
          if (shape && !(link as any).part.isSelected) {
            (shape as any).strokeWidth = 2;
            (shape as any).stroke = '#68D391';
          }
          myDiagram.currentCursor = '';
        }
      },
      // Enhanced string/spring-like link appearance
      $(
        go.Shape,
        {
          name: 'LINKSHAPE',
          strokeWidth: 4,
          stroke: '#4FD1C7',
          opacity: 0.85,
          strokeDashArray: null, // Solid elastic string
          // Add subtle gradient effect for depth
          strokeCap: 'round'
        },
        new go.Binding('stroke', 'isSelected', (sel: boolean) => sel ? '#4FD1C7' : '#68D391').ofObject(),
        new go.Binding('strokeWidth', 'isSelected', (sel: boolean) => sel ? 3 : 2).ofObject()
      ),
      // Enhanced arrowhead
      $(
        go.Shape,
        {
          toArrow: 'Standard',
          strokeWidth: 0,
          fill: '#68D391',
          scale: 1.2
        },
        new go.Binding('fill', 'isSelected', (sel: boolean) => sel ? '#4FD1C7' : '#68D391').ofObject()
      ),
      // Relationship label with Neo4j styling
      $(
        go.TextBlock,
        {
          segmentIndex: 0,
          segmentFraction: 0.5,
          font: 'bold 9px Segoe UI, sans-serif',
          stroke: '#E2E8F0',
          background: 'rgba(26,32,44,0.9)',
          margin: 3
        },
        new go.Binding('text', 'relationship', (rel: string) => rel || 'DEPENDS_ON')
      )
    );

      // Store reference to prevent recreation
      (diagramRef.current as any)['data-gojs-diagram'] = myDiagram;
      setDiagram(myDiagram);

      // Load initial data
      loadData(myDiagram);

      } catch (error) {
        console.error('GoJS Diagram initialization error:', error);
        setDiagramError(`Failed to initialize diagram: ${error}`);
      }
    };

    // Initialize with a small delay to avoid React StrictMode issues
    const timeoutId = setTimeout(initDiagram, 10);

    return () => {
      clearTimeout(timeoutId);
      // Cleanup function
      if (diagramRef.current) {
        const storedDiagram = (diagramRef.current as any)['data-gojs-diagram'];
        if (storedDiagram) {
          try {
            storedDiagram.div = null;
            storedDiagram.clear();
          } catch (e) {
            console.warn('Error cleaning up diagram:', e);
          }
          delete (diagramRef.current as any)['data-gojs-diagram'];
        }
      }
      setDiagram(null);
    };
  }, []);

  // Cypher query parser and executor
  const executeCypherQuery = (query: string, targetDiagram: go.Diagram) => {
    setIsQueryRunning(true);
    
    try {
      let filteredNodes = [...graphData.nodes];
      let filteredLinks = [...graphData.links];
      let nodeLimit = 100;
      
      // Parse basic Cypher queries
      const queryUpper = query.toUpperCase().trim();
      
      // Extract LIMIT
      const limitMatch = queryUpper.match(/LIMIT\s+(\d+)/);
      if (limitMatch) {
        nodeLimit = parseInt(limitMatch[1]);
      }
      
      // Handle WHERE clauses
      if (queryUpper.includes('WHERE')) {
        // Parse complexity filter
        const complexityMatch = query.match(/complexity\s*>\s*(\d+)/i);
        if (complexityMatch) {
          const minComplexity = parseInt(complexityMatch[1]);
          filteredNodes = filteredNodes.filter(node => node.complexity > minComplexity);
        }
        
        // Parse group filter
        const groupMatch = query.match(/group\s*=\s*['"](.*?)['"]/i);
        if (groupMatch) {
          const targetGroup = groupMatch[1];
          filteredNodes = filteredNodes.filter(node => node.group === targetGroup);
        }
        
        // Parse usedByCount filter
        const usedByMatch = query.match(/usedByCount\s*>\s*(\d+)/i);
        if (usedByMatch) {
          const minUsedBy = parseInt(usedByMatch[1]);
          filteredNodes = filteredNodes.filter(node => node.usedByCount > minUsedBy);
        }
      }
      
      // Apply node limit
      filteredNodes = filteredNodes.slice(0, nodeLimit);
      
      // Filter relationships based on selected nodes
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      
      // Handle relationship queries
      if (queryUpper.includes('MATCH (N)-[R]->(M)') || queryUpper.includes('RETURN N, R, M')) {
        // Show relationships between filtered nodes
        filteredLinks = filteredLinks.filter(link => 
          nodeIds.has(link.source) && nodeIds.has(link.target)
        );
      } else if (queryUpper.includes('WHERE N.MODULE <> M.MODULE')) {
        // Cross-module relationships
        filteredLinks = filteredLinks.filter(link => {
          const sourceNode = filteredNodes.find(n => n.id === link.source);
          const targetNode = filteredNodes.find(n => n.id === link.target);
          return sourceNode && targetNode && sourceNode.module !== targetNode.module;
        });
      } else {
        // Default: show connections between nodes
        filteredLinks = filteredLinks.filter(link => 
          nodeIds.has(link.source) && nodeIds.has(link.target)
        );
      }
      
      // Convert to GoJS format with enhanced data
      const nodeDataArray = filteredNodes.map((node: any) => ({
        key: node.id,
        name: node.name,
        group: node.group,
        complexity: node.complexity,
        filePath: node.filePath,
        usedByCount: node.usedByCount,
        dependsOnCount: node.dependsOnCount,
        module: node.module || 'unknown',
        ...node
      }));

      const linkDataArray = filteredLinks.map((link: any) => ({
        from: link.source,
        to: link.target,
        relationship: link.relationship || 'DEPENDS_ON'
      }));

      console.log('Cypher Query Results:', nodeDataArray.length, 'nodes,', linkDataArray.length, 'relationships');
      
      // Update results
      setQueryResults({ 
        nodes: nodeDataArray.length, 
        relationships: linkDataArray.length 
      });

      // Apply to diagram with smooth animation
      targetDiagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
      
      // Animate the layout update
      setTimeout(() => {
        targetDiagram.layoutDiagram(true);
        targetDiagram.zoomToFit();
      }, 100);
      
    } catch (error) {
      console.error('Query execution error:', error);
    } finally {
      setIsQueryRunning(false);
    }
  };

  const loadData = (myDiagram: go.Diagram) => {
    // Load initial data with default query
    executeCypherQuery('MATCH (n) RETURN n LIMIT 50', myDiagram);
  };

  const zoomToFit = () => {
    if (diagram) {
      diagram.zoomToFit();
    }
  };

  const zoomIn = () => {
    if (diagram) {
      diagram.commandHandler.increaseZoom();
    }
  };

  const zoomOut = () => {
    if (diagram) {
      diagram.commandHandler.decreaseZoom();
    }
  };

  const resetLayout = () => {
    triggerSpringAnimation();
    if (diagram) {
      diagram.zoomToFit();
    }
  };

  const runQuery = () => {
    if (diagram && currentQuery.trim()) {
      console.log('Executing Cypher query:', currentQuery);
      executeCypherQuery(currentQuery, diagram);
    }
  };

  // Function to trigger spring animation
  const triggerSpringAnimation = () => {
    if (diagram && diagram.layout) {
      const layout = diagram.layout as go.ForceDirectedLayout;
      
      // Enable continuous physics for spring-like movement
      layout.isOngoing = true;
      
      // Add some initial energy to the system
      diagram.nodes.each((node: any) => {
        const randomOffset = 20 + Math.random() * 30;
        const angle = Math.random() * 2 * Math.PI;
        const newX = node.position.x + Math.cos(angle) * randomOffset;
        const newY = node.position.y + Math.sin(angle) * randomOffset;
        node.position = new go.Point(newX, newY);
      });
      
      // Trigger layout recalculation
      diagram.layoutDiagram(true);
      
      // Let physics settle after a few seconds
      setTimeout(() => {
        if (layout) {
          layout.isOngoing = false;
        }
      }, 3000);
    }
  };

  // Show error state if diagram failed to initialize
  if (diagramError) {
    return (
      <Box sx={{ 
        height: '100vh', 
        width: '100vw', 
        bgcolor: '#2D3748',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#E2E8F0'
      }}>
        <Paper sx={{ bgcolor: '#1A202C', p: 4, maxWidth: 500 }}>
          <Typography variant="h6" sx={{ color: '#FF6B6B', mb: 2 }}>
            GoJS Diagram Error
          </Typography>
          <Typography sx={{ color: '#E2E8F0', mb: 2 }}>
            {diagramError}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ bgcolor: '#4299E1', '&:hover': { bgcolor: '#3182CE' } }}
          >
            Reload Page
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100vw', 
      bgcolor: '#2D3748',
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* Left Control Panel */}
      <Box sx={{ 
        width: '250px', 
        bgcolor: '#1A202C',
        borderRight: '1px solid #4A5568',
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Typography variant="h6" sx={{ color: '#E2E8F0', mb: 3 }}>
          Interactive Graph (GoJS)
        </Typography>
        
        {/* Control Buttons */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<CenterIcon />}
            onClick={zoomToFit}
            sx={{ 
              bgcolor: '#4299E1', 
              '&:hover': { bgcolor: '#3182CE' },
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
              bgcolor: '#48BB78', 
              '&:hover': { bgcolor: '#38A169' },
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
                color: '#E2E8F0',
                flex: 1,
                textTransform: 'none'
              }}
            >
              Zoom In
            </Button>
            <Button
              variant="outlined"
              startIcon={<ZoomOutIcon />}
              onClick={zoomOut}
              sx={{ 
                borderColor: '#4A5568', 
                color: '#E2E8F0',
                flex: 1,
                textTransform: 'none'
              }}
            >
              Zoom Out
            </Button>
          </Stack>
        </Stack>

        {/* Node Info */}
        {selectedNode && (
          <Paper sx={{ bgcolor: '#2D3748', p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#68D391', mb: 1, fontSize: '14px' }}>
              {selectedNode.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#A0AEC0', mb: 1, fontSize: '12px' }}>
              Group: {selectedNode.group}
            </Typography>
            <Typography variant="body2" sx={{ color: '#A0AEC0', mb: 1, fontSize: '12px' }}>
              Complexity: {selectedNode.complexity}
            </Typography>
            <Typography variant="body2" sx={{ color: '#A0AEC0', fontSize: '11px' }}>
              Used by: {selectedNode.usedByCount} functions
            </Typography>
          </Paper>
        )}

        {/* Query Results */}
        <Paper sx={{ bgcolor: '#2D3748', p: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#4FD1C7', mb: 1, fontSize: '13px' }}>
            Query Results
          </Typography>
          <Typography variant="body2" sx={{ color: '#E2E8F0', fontSize: '12px', mb: 0.5 }}>
            Nodes: {queryResults.nodes}
          </Typography>
          <Typography variant="body2" sx={{ color: '#E2E8F0', fontSize: '12px' }}>
            Relationships: {queryResults.relationships}
          </Typography>
        </Paper>

        {/* Sample Queries */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#A0AEC0', mb: 1, fontSize: '12px' }}>
            Sample Cypher Queries
          </Typography>
          <Stack spacing={0.5}>
            {[
              'MATCH (n) WHERE n.complexity > 20 RETURN n',
              'MATCH (n) WHERE n.group = "controller" RETURN n',
              'MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 30',
              'MATCH (n) WHERE n.usedByCount > 5 RETURN n'
            ].map((query, index) => (
              <Button
                key={index}
                variant="text"
                size="small"
                onClick={() => setCurrentQuery(query)}
                sx={{ 
                  justifyContent: 'flex-start',
                  color: '#68D391',
                  fontSize: '10px',
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                  textAlign: 'left',
                  p: 0.5
                }}
              >
                {query.length > 30 ? query.substring(0, 30) + '...' : query}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* Instructions */}
        <Box sx={{ mt: 'auto' }}>
          <Typography variant="body2" sx={{ color: '#A0AEC0', fontSize: '12px' }}>
            • Click nodes to see details
            • Drag nodes to move them
            • Use mouse wheel to zoom
            • Drag background to pan
            • Press Enter to run query
          </Typography>
        </Box>
      </Box>

      {/* Main Graph Area */}
      <Box sx={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* Query Bar */}
        <Box sx={{ 
          height: '60px',
          bgcolor: '#1A202C',
          borderBottom: '1px solid #4A5568',
          display: 'flex',
          alignItems: 'center',
          px: 2,
          gap: 2,
          flexShrink: 0
        }}>
          <Typography sx={{ color: '#4FD1C7', fontFamily: 'monospace', fontSize: '14px' }}>
            neo4j$
          </Typography>
          <input
            type="text"
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && runQuery()}
            style={{
              flex: 1,
              backgroundColor: '#2D3748',
              border: '1px solid #4A5568',
              borderRadius: '4px',
              padding: '8px 16px',
              color: '#E2E8F0',
              fontFamily: 'monospace',
              fontSize: '13px',
              outline: 'none'
            }}
            placeholder="Enter Cypher query..."
          />
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={runQuery}
            disabled={isQueryRunning}
            sx={{ 
              bgcolor: isQueryRunning ? '#4A5568' : '#48BB78',
              '&:hover': { bgcolor: isQueryRunning ? '#4A5568' : '#38A169' },
              textTransform: 'none'
            }}
          >
            {isQueryRunning ? 'Running...' : 'Run'}
          </Button>
        </Box>

        {/* Graph Container */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <Box 
            ref={diagramRef}
            id={diagramId.current}
            key={diagramId.current}
            sx={{ 
              height: '100%', 
              width: '100%',
              bgcolor: '#2D3748',
              '& canvas': {
                outline: 'none'
              }
            }}
          />
          
          {/* Status */}
          <Box sx={{ 
            position: 'absolute',
            top: 10,
            left: 10,
            bgcolor: 'rgba(26,32,44,0.9)',
            px: 2,
            py: 1,
            borderRadius: 1,
            border: '1px solid #4A5568'
          }}>
            <Typography sx={{ color: '#4FD1C7', fontSize: '12px', fontWeight: 'bold' }}>
              Neo4j Graph Browser
            </Typography>
            <Typography sx={{ color: '#E2E8F0', fontSize: '11px' }}>
              {queryResults.nodes} nodes • {queryResults.relationships} relationships
            </Typography>
            {isQueryRunning && (
              <Typography sx={{ color: '#FFA500', fontSize: '11px' }}>
                Executing query...
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default InteractiveGraphVisualization;