import React, { useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Card, 
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { graphData } from '../../data/graphData';

// The graphData contains: { nodes: [], links: [] }
// But we need statistics, so let's import the whole graph object
const fullGraphData = {
  nodes: graphData.nodes,
  links: graphData.links,
  // Mock statistics for now - in a real app, these would come from the server
  statistics: {
    totalNodes: graphData.nodes.length,
    totalRelationships: graphData.links.length,
    totalComplexity: graphData.nodes.reduce((sum: number, node: any) => sum + node.complexity, 0),
    crossModuleConnections: graphData.links.filter((link: any) => {
      const sourceNode = graphData.nodes.find((n: any) => n.id === link.source);
      const targetNode = graphData.nodes.find((n: any) => n.id === link.target);
      return sourceNode?.module !== targetNode?.module;
    }).length,
    topComplexityFunctions: graphData.nodes
      .sort((a: any, b: any) => b.complexity - a.complexity)
      .slice(0, 10)
      .map((node: any) => ({
        name: node.name,
        complexity: node.complexity,
        connections: node.totalConnections
      })),
    topConnectedFunctions: graphData.nodes
      .sort((a: any, b: any) => b.totalConnections - a.totalConnections)
      .slice(0, 10)
      .map((node: any) => ({
        name: node.name,
        connections: node.totalConnections,
        complexity: node.complexity
      }))
  }
};

// Color scheme for different node groups
const groupColors = {
  'controller': '#4CAF50',
  'business-logic': '#2196F3', 
  'service': '#FF9800',
  'util': '#9C27B0',
  'entry': '#F44336',
  'external': '#607D8B',
  'model': '#E91E63',
  'config': '#795548',
  'middleware': '#00BCD4',
  'default': '#757575'
};

// Color scheme for different modules
const moduleColors = {
  'core': '#1976D2',
  'utilities': '#388E3C', 
  'external': '#F57C00',
  'auth': '#7B1FA2',
  'api': '#C2185B',
  'default': '#455A64'
};

const TestVisualization: React.FC = () => {
  // Filter states
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [complexityThreshold, setComplexityThreshold] = useState<number>(0);
  const [showCrossModuleOnly, setShowCrossModuleOnly] = useState<boolean>(false);

  // Transform the graph data into ReactFlow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    // Apply filters
    let filteredNodes = fullGraphData.nodes.filter((node: any) => {
      if (selectedModule !== 'all' && node.module !== selectedModule) return false;
      if (selectedGroup !== 'all' && node.group !== selectedGroup) return false;
      if (node.complexity < complexityThreshold) return false;
      return true;
    });

    // Create a force-directed layout similar to Neo4j
    const nodes: Node[] = filteredNodes.map((node: any, index: number) => {
      const groupColor = groupColors[node.group as keyof typeof groupColors] || groupColors.default;
      const moduleColor = moduleColors[node.module as keyof typeof moduleColors] || moduleColors.default;
      
      // Create a more organic layout like Neo4j browser
      const totalNodes = filteredNodes.length;
      const spiralRadius = Math.sqrt(totalNodes) * 30;
      const angle = (index / totalNodes) * Math.PI * 8; // Multiple spirals
      const radius = (index / totalNodes) * spiralRadius + 100;
      
      return {
        id: node.id,
        position: {
          x: Math.cos(angle) * radius + 600,
          y: Math.sin(angle) * radius + 400,
        },
        data: {
          label: (
            <div style={{ padding: '8px', minWidth: '180px', textAlign: 'center' }}>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '11px',
                marginBottom: '2px',
                color: '#fff',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}>
                {node.name}
              </div>
              <div style={{ 
                fontSize: '9px', 
                color: '#fff',
                opacity: 0.8,
                marginBottom: '2px',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}>
                {node.module}
              </div>
              <div style={{ 
                fontSize: '8px', 
                color: '#fff',
                opacity: 0.7,
                marginBottom: '3px'
              }}>
                {node.group}
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '8px',
                color: '#fff',
                opacity: 0.9
              }}>
                <span>C: {node.complexity}</span>
                <span>T: {node.totalConnections}</span>
              </div>
              {node.isEntryPoint && (
                <div style={{ 
                  fontSize: '7px',
                  color: '#FFD700',
                  fontWeight: 'bold',
                  marginTop: '2px'
                }}>
                  ENTRY POINT
                </div>
              )}
            </div>
          ),
          ...node
        },
        style: {
          background: `linear-gradient(135deg, ${groupColor}, ${moduleColor})`,
          border: `2px solid ${node.isEntryPoint ? '#FFD700' : 'transparent'}`,
          borderRadius: '8px',
          color: 'white',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          width: 220,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });

    // Filter edges based on filtered nodes and settings
    const filteredNodeIds = new Set(filteredNodes.map((n: any) => n.id));
    
    const edges: Edge[] = fullGraphData.links
      .filter((rel: any) => {
        // Only show edges between visible nodes
        const hasValidNodes = filteredNodeIds.has(rel.source) && filteredNodeIds.has(rel.target);
        if (!hasValidNodes) return false;
        
        // If showing cross-module only, filter accordingly
        if (showCrossModuleOnly) {
          const sourceNode = filteredNodes.find((n: any) => n.id === rel.source);
          const targetNode = filteredNodes.find((n: any) => n.id === rel.target);
          return sourceNode?.module !== targetNode?.module;
        }
        
        return true;
      })
      .map((rel: any, index: number) => {
        // Determine if this is a cross-module connection
        const sourceNode = filteredNodes.find((n: any) => n.id === rel.source);
        const targetNode = filteredNodes.find((n: any) => n.id === rel.target);
        const isCrossModule = sourceNode?.module !== targetNode?.module;
        
        return {
          id: `e${index}`,
          source: rel.source,
          target: rel.target,
          type: 'smoothstep',
          animated: isCrossModule,
          style: {
            strokeWidth: isCrossModule ? 3 : Math.max(1, rel.strength || 1),
            stroke: isCrossModule ? '#FF6B35' : '#666',
            strokeDasharray: isCrossModule ? '5,5' : 'none',
          },
          label: isCrossModule ? `Cross-Module (${rel.calledAtLine})` : `L${rel.calledAtLine}`,
          labelStyle: { 
            fill: isCrossModule ? '#FF6B35' : '#666', 
            fontSize: '9px',
            fontWeight: isCrossModule ? 700 : 500
          },
        };
      });

    return { nodes, edges };
  }, [selectedModule, selectedGroup, complexityThreshold, showCrossModuleOnly]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <Box sx={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Typography variant="h4" gutterBottom>
          Code Dependency Visualization - {initialNodes.length} / {fullGraphData.statistics.totalNodes} Nodes
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip label={`Showing: ${initialNodes.length} functions`} variant="outlined" color="primary" />
          <Chip label={`Connections: ${initialEdges.length}`} variant="outlined" />
          <Chip label={`Total: ${fullGraphData.statistics.totalNodes} functions`} variant="outlined" />
          <Chip label={`Cross-Module: ${initialEdges.filter((e: any) => e.animated).length}`} variant="outlined" color="warning" />
        </Box>
        
        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ mr: 2 }}>Node Types:</Typography>
          {Object.entries(groupColors).filter(([key]) => key !== 'default').map(([group, color]) => (
            <Chip 
              key={group}
              label={group}
              size="small"
              sx={{ 
                backgroundColor: color, 
                color: 'white',
                fontSize: '10px',
                height: '20px'
              }}
            />
          ))}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mr: 2 }}>Modules:</Typography>
          {Object.entries(moduleColors).filter(([key]) => key !== 'default').map(([module, color]) => (
            <Chip 
              key={module}
              label={module}
              size="small"
              variant="outlined"
              sx={{ 
                borderColor: color, 
                color: color,
                fontSize: '10px',
                height: '20px'
              }}
            />
          ))}
        </Box>

        {/* Filter Controls */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Module</InputLabel>
            <Select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              label="Module"
            >
              <MenuItem value="all">All Modules</MenuItem>
              {Object.keys(moduleColors).filter((key) => key !== 'default').map((module) => (
                <MenuItem key={module} value={module}>{module}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              label="Type"
            >
              <MenuItem value="all">All Types</MenuItem>
              {Object.keys(groupColors).filter((key) => key !== 'default').map((group) => (
                <MenuItem key={group} value={group}>{group}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ width: 200 }}>
            <Typography variant="caption" gutterBottom>
              Complexity ≥ {complexityThreshold}
            </Typography>
            <Slider
              value={complexityThreshold}
              onChange={(_, value) => setComplexityThreshold(value as number)}
              min={0}
              max={100}
              size="small"
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={showCrossModuleOnly}
                onChange={(e) => setShowCrossModuleOnly(e.target.checked)}
                size="small"
              />
            }
            label="Cross-module only"
          />
        </Box>
      </Paper>

      {/* Main visualization */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{
            padding: 0.1,
            includeHiddenNodes: false,
          }}
        >
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              const nodeData = node.data as any;
              return groupColors[nodeData.group as keyof typeof groupColors] || groupColors.default;
            }}
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
          <Background />
        </ReactFlow>
      </Box>

      {/* Statistics Panel */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Typography variant="h6" gutterBottom>Top Functions</Typography>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
          {fullGraphData.statistics.topComplexityFunctions.slice(0, 5).map((func: any, index: number) => (
            <Card key={index} sx={{ minWidth: 200, flexShrink: 0 }}>
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '11px' }}>
                  {func.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Complexity: {func.complexity} | Connections: {func.connections}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default TestVisualization;