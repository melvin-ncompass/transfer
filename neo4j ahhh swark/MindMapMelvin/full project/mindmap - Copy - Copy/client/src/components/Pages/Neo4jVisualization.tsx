import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import type { Node, Edge, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Typography,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  TextField,
  Button,
  Stack,
  Divider,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  CenterFocusStrong as CenterIcon,
} from '@mui/icons-material';
import { graphData } from '../../data/graphData';

// Enhanced Neo4j Node with better styling and colors
const Neo4jNode = ({ data, selected }: NodeProps) => {
  const getNodeColor = (group: string) => {
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
  };

  return (
    <div
      style={{
        background: getNodeColor(data.group),
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: selected ? '3px solid #FFD700' : '2px solid #333',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: '8px',
          textAlign: 'center',
          lineHeight: 1,
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        }}
      >
        {data.label}
      </Typography>
      
      {/* Function name label below node */}
      <div
        style={{
          position: 'absolute',
          top: '55px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#E2E8F0',
          fontSize: '9px',
          fontWeight: '500',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          maxWidth: '100px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: '2px 4px',
          borderRadius: '3px',
        }}
      >
        {data.name}
      </div>
    </div>
  );
};

// Custom Edge Component for guaranteed visibility
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, style, markerEnd }: any) => {
  const edgePath = `M${sourceX},${sourceY} L${targetX},${targetY}`;
  
  return (
    <g>
      <path
        id={id}
        style={{
          stroke: '#E2E8F0',
          strokeWidth: 3,
          opacity: 0.9,
          ...style
        }}
        d={edgePath}
        markerEnd={markerEnd}
      />
    </g>
  );
};

const nodeTypes = {
  neo4jNode: Neo4jNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

// Cypher queries that work with our data
const cypherQueries = [
  'MATCH (n) RETURN n LIMIT 100',
  'MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 50', 
  'MATCH (n) WHERE n.complexity > 20 RETURN n',
  'MATCH (n) WHERE n.group = "controller" RETURN n',
  'MATCH (n) WHERE n.usedByCount > 5 RETURN n',
  'MATCH (n)-[r]->(m) WHERE n.module <> m.module RETURN n, r, m',
];

const Neo4jVisualizationContent: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(true);
  const [currentQuery, setCurrentQuery] = useState(cypherQueries[0]);
  const [filterGroup, setFilterGroup] = useState('all');
  const [minComplexity, setMinComplexity] = useState(0);
  const reactFlowInstance = useReactFlow();

  // Create proper force-directed layout with all connections visible
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    // Filter nodes based on current filters
    let filteredNodes = graphData.nodes;
    
    if (filterGroup !== 'all') {
      filteredNodes = filteredNodes.filter((node: any) => node.group === filterGroup);
    }
    
    if (minComplexity > 0) {
      filteredNodes = filteredNodes.filter((node: any) => node.complexity >= minComplexity);
    }

    // Get node IDs for filtering edges
    const nodeIds = new Set(filteredNodes.map((node: any) => node.id));
    const filteredLinks = graphData.links.filter((link: any) => 
      nodeIds.has(link.source) && nodeIds.has(link.target)
    );

    // Create nodes with improved force-directed positioning
    const nodes: Node[] = filteredNodes.map((node: any, index: number) => {
      // Calculate connections for each node
      const connections = filteredLinks.filter((link: any) => 
        link.source === node.id || link.target === node.id
      ).length;

      // Circular layout for better edge visibility
      const centerX = 800;
      const centerY = 400;
      const baseRadius = 300;
      
      // Create layers based on connections
      const layer = Math.floor(connections / 3); // Group by connection count
      const nodesInLayer = filteredNodes.filter((n: any) => {
        const nConnections = filteredLinks.filter((link: any) => 
          link.source === n.id || link.target === n.id
        ).length;
        return Math.floor(nConnections / 3) === layer;
      }).length;
      
      const layerIndex = filteredNodes.filter((n: any, i: number) => {
        if (i >= index) return false;
        const nConnections = filteredLinks.filter((link: any) => 
          link.source === n.id || link.target === n.id
        ).length;
        return Math.floor(nConnections / 3) === layer;
      }).length;
      
      const angle = (layerIndex / Math.max(nodesInLayer, 1)) * 2 * Math.PI;
      const radius = baseRadius + (layer * 150);
      
      return {
        id: node.id,
        type: 'neo4jNode',
        position: {
          x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
          y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 50,
        },
        data: {
          label: node.name.replace(/([A-Z])/g, ' $1').trim().split(' ').slice(0, 2).join(''),
          name: node.name,
          group: node.group,
          complexity: node.complexity,
          connections: connections,
          ...node,
        },
      };
    });

    // Create edges with MAXIMUM VISIBILITY
    const edges: Edge[] = filteredLinks.map((link: any, index: number) => ({
      id: `edge-${index}`,
      source: link.source,
      target: link.target,
      type: 'custom',
      animated: false,
      style: { 
        stroke: '#E2E8F0', 
        strokeWidth: 3,
        opacity: 0.9,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#E2E8F0',
        width: 25,
        height: 25,
      },
      label: 'DEPENDS_ON',
      labelStyle: {
        fill: '#68D391',
        fontSize: '12px',
        fontWeight: 700,
      },
      labelBgStyle: {
        fill: 'rgba(26,32,44,0.95)',
        fillOpacity: 0.95,
        rx: 4,
        ry: 4,
      },
    }));

    console.log('DEBUG - Nodes:', nodes.length, 'Edges:', edges.length);
    console.log('DEBUG - Sample edge:', edges[0]);
    console.log('DEBUG - Filtered links:', filteredLinks.length);

    return { nodes, edges };
  }, [filterGroup, minComplexity]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when filters change
  useEffect(() => {
    console.log('UPDATING NODES AND EDGES:', initialNodes.length, initialEdges.length);
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data);
    setPropertiesPanelOpen(true);
  }, []);

  const executeQuery = useCallback(() => {
    // Simulate query execution by applying filters based on query
    if (currentQuery.includes('complexity > 20')) {
      setMinComplexity(20);
    } else if (currentQuery.includes('controller')) {
      setFilterGroup('controller');
    } else if (currentQuery.includes('usedByCount > 5')) {
      setMinComplexity(15);
    } else {
      setFilterGroup('all');
      setMinComplexity(0);
    }
  }, [currentQuery]);

  const resetView = useCallback(() => {
    setFilterGroup('all');
    setMinComplexity(0);
    setCurrentQuery(cypherQueries[0]);
    setTimeout(() => {
      reactFlowInstance.fitView();
    }, 100);
  }, [reactFlowInstance]);

  const centerView = useCallback(() => {
    reactFlowInstance.fitView();
  }, [reactFlowInstance]);

  const uniqueGroups = useMemo(() => {
    const groups = [...new Set(graphData.nodes.map((node: any) => node.group))];
    return groups.filter(Boolean);
  }, []);

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
        width: '280px', 
        bgcolor: '#1A202C',
        borderRight: '1px solid #4A5568',
        display: 'flex',
        flexDirection: 'column',
        p: 2
      }}>
        <Typography variant="h6" sx={{ color: '#E2E8F0', mb: 2, fontSize: '16px' }}>
          Neo4j Browser
        </Typography>
        
        {/* Filter Controls */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel sx={{ color: '#A0AEC0' }}>Filter by Group</InputLabel>
          <Select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            sx={{ 
              color: '#E2E8F0', 
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4A5568' },
              '& .MuiSvgIcon-root': { color: '#A0AEC0' }
            }}
          >
            <MenuItem value="all">All Groups</MenuItem>
            {uniqueGroups.map(group => (
              <MenuItem key={group} value={group}>
                {group}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Min Complexity"
          type="number"
          value={minComplexity}
          onChange={(e) => setMinComplexity(Number(e.target.value))}
          sx={{ 
            mb: 2,
            '& .MuiInputLabel-root': { color: '#A0AEC0' },
            '& .MuiOutlinedInput-root': { 
              color: '#E2E8F0',
              '& fieldset': { borderColor: '#4A5568' },
              '&:hover fieldset': { borderColor: '#718096' },
            }
          }}
        />

        {/* Action Buttons */}
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={resetView}
            sx={{ 
              bgcolor: '#4299E1', 
              '&:hover': { bgcolor: '#3182CE' },
              textTransform: 'none'
            }}
          >
            Reset View
          </Button>
          <Button
            variant="outlined"
            startIcon={<CenterIcon />}
            onClick={centerView}
            sx={{ 
              borderColor: '#4A5568', 
              color: '#E2E8F0',
              '&:hover': { borderColor: '#718096', bgcolor: 'rgba(255,255,255,0.05)' },
              textTransform: 'none'
            }}
          >
            Center Graph
          </Button>
        </Stack>

        {/* Quick Queries */}
        <Typography variant="subtitle2" sx={{ color: '#A0AEC0', mb: 1 }}>
          Quick Queries
        </Typography>
        <Stack spacing={1} sx={{ mb: 2 }}>
          {cypherQueries.slice(1).map((query, index) => (
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
                textAlign: 'left'
              }}
            >
              {query.length > 35 ? query.substring(0, 35) + '...' : query}
            </Button>
          ))}
        </Stack>

        {/* Statistics */}
        <Divider sx={{ my: 2, borderColor: '#4A5568' }} />
        <Typography variant="subtitle2" sx={{ color: '#A0AEC0', mb: 1 }}>
          Current View
        </Typography>
        <Paper sx={{ bgcolor: '#2D3748', p: 1.5, mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#E2E8F0', fontSize: '12px', mb: 0.5 }}>
            <strong>Nodes:</strong> {nodes.length}
          </Typography>
          <Typography variant="body2" sx={{ color: '#E2E8F0', fontSize: '12px' }}>
            <strong>Relationships:</strong> {edges.length}
          </Typography>
        </Paper>
      </Box>

      {/* Main Graph Area */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {/* Top Query Bar */}
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: propertiesPanelOpen ? '350px' : 0,
          height: '60px',
          bgcolor: '#1A202C',
          borderBottom: '1px solid #4A5568',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          px: 2,
          gap: 2
        }}>
          <Typography sx={{ color: '#4FD1C7', fontFamily: 'monospace', fontSize: '14px', minWidth: '60px' }}>
            neo4j$
          </Typography>
          <TextField
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            variant="outlined"
            size="small"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#E2E8F0',
                fontFamily: 'monospace',
                bgcolor: '#2D3748',
                fontSize: '13px',
                '& fieldset': { borderColor: '#4A5568' },
                '&:hover fieldset': { borderColor: '#718096' },
                '&.Mui-focused fieldset': { borderColor: '#4299E1' },
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={executeQuery}
            sx={{ 
              bgcolor: '#48BB78',
              '&:hover': { bgcolor: '#38A169' },
              minWidth: '90px',
              textTransform: 'none'
            }}
          >
            Run
          </Button>
        </Box>

        {/* ReactFlow Container */}
        <Box sx={{ 
          height: '100%', 
          pt: '60px',
          '& .react-flow': {
            backgroundColor: '#2D3748'
          },
          '& .react-flow__edge': {
            zIndex: 1000,
          },
          '& .react-flow__edge-path': {
            stroke: '#E2E8F0 !important',
            strokeWidth: '2px !important',
            opacity: '0.8 !important',
          },
          '& .react-flow__edge-text': {
            fill: '#68D391 !important',
            fontSize: '10px !important',
            fontWeight: '600 !important',
          },
          '& .react-flow__arrowhead': {
            fill: '#E2E8F0 !important',
          }
        }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionLineType={ConnectionLineType.Straight}
            fitView
            attributionPosition="bottom-left"
            minZoom={0.1}
            maxZoom={3}
            defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
            edgesUpdatable={false}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
          >
            <Controls 
              style={{
                background: '#1A202C',
                border: '1px solid #4A5568',
              }}
              showInteractive={false}
            />
            <Background 
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#4A5568"
            />
          </ReactFlow>
        </Box>
      </Box>

      {/* Right Properties Panel */}
      {propertiesPanelOpen && (
        <Box sx={{ 
          width: '350px', 
          bgcolor: '#1A202C',
          borderLeft: '1px solid #4A5568',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          {/* Panel Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid #4A5568',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6" sx={{ color: '#E2E8F0', fontSize: '16px' }}>
              Node Properties
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => setPropertiesPanelOpen(false)}
              sx={{ color: '#A0AEC0' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Node Details */}
          {selectedNode ? (
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {/* Node Type and Complexity */}
              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  label={selectedNode.group || 'function'}
                  sx={{ 
                    bgcolor: '#FF6B35',
                    color: 'white',
                    fontSize: '11px'
                  }}
                />
                <Chip 
                  label={`Complexity: ${selectedNode.complexity}`}
                  variant="outlined"
                  sx={{ 
                    borderColor: '#4A5568',
                    color: '#E2E8F0',
                    fontSize: '11px'
                  }}
                />
                <Chip 
                  label={`Connections: ${selectedNode.connections}`}
                  variant="outlined"
                  sx={{ 
                    borderColor: '#4A5568',
                    color: '#4ECDC4',
                    fontSize: '11px'
                  }}
                />
              </Stack>

              {/* Function Name */}
              <Typography variant="h6" sx={{ color: '#68D391', mb: 1, fontSize: '14px' }}>
                {selectedNode.name}
              </Typography>

              {/* File Path */}
              <Typography variant="body2" sx={{ color: '#A0AEC0', mb: 2, fontSize: '11px' }}>
                {selectedNode.filePath}
              </Typography>

              {/* Key Metrics */}
              <Paper sx={{ bgcolor: '#2D3748', p: 2, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#E2E8F0', mb: 1, fontSize: '13px' }}>
                  Key Metrics
                </Typography>
                <List dense>
                  <ListItem sx={{ px: 0, py: 0.3 }}>
                    <ListItemText
                      primary={<Typography sx={{ color: '#68D391', fontSize: '11px' }}>Used By Count</Typography>}
                      secondary={<Typography sx={{ color: '#E2E8F0', fontSize: '11px' }}>{selectedNode.usedByCount}</Typography>}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 0.3 }}>
                    <ListItemText
                      primary={<Typography sx={{ color: '#68D391', fontSize: '11px' }}>Depends On Count</Typography>}
                      secondary={<Typography sx={{ color: '#E2E8F0', fontSize: '11px' }}>{selectedNode.dependsOnCount}</Typography>}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 0.3 }}>
                    <ListItemText
                      primary={<Typography sx={{ color: '#68D391', fontSize: '11px' }}>Lines of Code</Typography>}
                      secondary={<Typography sx={{ color: '#E2E8F0', fontSize: '11px' }}>{selectedNode.ends - selectedNode.starts}</Typography>}
                    />
                  </ListItem>
                </List>
              </Paper>

              {/* All Properties */}
              <Accordion defaultExpanded sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ color: '#A0AEC0' }} />}
                  sx={{ 
                    bgcolor: 'transparent',
                    '& .MuiAccordionSummary-content': { margin: 0 }
                  }}
                >
                  <Typography sx={{ color: '#E2E8F0', fontSize: '13px' }}>
                    All Properties
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <List dense>
                    {Object.entries(selectedNode)
                      .filter(([key]) => !['label', 'name', 'connections'].includes(key))
                      .map(([key, value]) => (
                      <ListItem key={key} sx={{ px: 0, py: 0.3 }}>
                        <ListItemText
                          primary={
                            <Typography sx={{ color: '#68D391', fontSize: '11px' }}>
                              {key}
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{ color: '#E2E8F0', fontSize: '11px', mt: 0.5 }}>
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            </Box>
          ) : (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#A0AEC0'
            }}>
              <Typography>Click a node to view properties</Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const Neo4jVisualization: React.FC = () => {
  return (
    <ReactFlowProvider>
      <Neo4jVisualizationContent />
    </ReactFlowProvider>
  );
};

export default Neo4jVisualization;