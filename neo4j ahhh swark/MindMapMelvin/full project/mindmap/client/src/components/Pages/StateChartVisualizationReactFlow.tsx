import React, { useMemo } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  Alert,
} from '@mui/material';
import { graphData } from '../../data/graphData';

const StateChartVisualizationReactFlow: React.FC = () => {
  // Transform graphData to ReactFlow format (like Neo4jVisualization)
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    console.log('Transforming graphData:', graphData.nodes.length, 'nodes,', graphData.links.length, 'links');
    
    // Create nodes (limit to 50 for performance)
    const nodes = graphData.nodes.slice(0, 50).map((node: any, index: number) => {
      // Determine node type and style
      let nodeType = 'default';
      let backgroundColor = '#a78bfa'; // purple
      let label = node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name;
      
      if (node.name.includes('get') || node.name.includes('fetch')) {
        backgroundColor = '#60a5fa'; // blue - Service
        nodeType = 'Service';
      } else if (node.name.includes('validate') || node.name.includes('check')) {
        backgroundColor = '#fbbf24'; // yellow - Decision  
        nodeType = 'Decision';
      } else if (node.group === 'controller') {
        backgroundColor = '#a78bfa'; // purple - Process
        nodeType = 'Process';
      }
      
      // Start and End nodes
      if (index === 0) {
        backgroundColor = '#4ade80'; // green
        nodeType = 'Start';
        label = 'START';
      } else if (index === 49) {
        backgroundColor = '#f87171'; // red
        nodeType = 'End';
        label = 'END';
      }
      
      return {
        id: node.id,
        data: { 
          label: label,
          type: nodeType,
          group: node.group,
          complexity: node.complexity || 0
        },
        position: { 
          x: Math.random() * 800, 
          y: Math.random() * 600 
        },
        style: {
          background: backgroundColor,
          color: 'white',
          border: '2px solid #333',
          borderRadius: nodeType === 'Decision' ? '50%' : '8px',
          padding: '10px',
          fontSize: '12px',
          fontWeight: 'bold',
        },
        type: nodeType === 'Start' || nodeType === 'End' ? 'default' : 'default'
      };
    });

    // Create edges (limit to 30 for performance)  
    const edges = graphData.links.slice(0, 30).map((link: any, index: number) => ({
      id: `edge-${index}`,
      source: link.source,
      target: link.target,
      animated: true,
      style: {
        stroke: '#64748b',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#64748b',
      },
    }));

    return { nodes, edges };
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2D3748' }}>
            State Chart Visualization (ReactFlow)
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip 
              label={`Project: phonex`} 
              variant="outlined" 
              sx={{ bgcolor: '#E2E8F0' }} 
            />
            <Chip 
              label={`User: saahithi-ncompass`} 
              variant="outlined" 
              sx={{ bgcolor: '#E2E8F0' }} 
            />
          </Stack>
        </Box>
        
        {/* Data Status */}
        <Alert severity="success" sx={{ mb: 2 }}>
          <div>
            <strong>Data Status:</strong><br />
            GraphData Available: Yes<br />
            Nodes: {graphData.nodes?.length || 0}<br />
            Links: {graphData.links?.length || 0}<br />
            Displayed: {nodes.length} nodes, {edges.length} edges
          </div>
        </Alert>
      </Paper>

      {/* ReactFlow Chart */}
      <Box sx={{ flex: 1, border: '2px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            connectionLineType={'smoothstep' as any}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          </ReactFlow>
        </ReactFlowProvider>
      </Box>

      {/* Legend */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>Legend</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Chip label="Start" sx={{ bgcolor: '#4ade80', color: 'white' }} />
          <Chip label="End" sx={{ bgcolor: '#f87171', color: 'white' }} />
          <Chip label="Process" sx={{ bgcolor: '#a78bfa', color: 'white' }} />
          <Chip label="Service" sx={{ bgcolor: '#60a5fa', color: 'white' }} />
          <Chip label="Decision" sx={{ bgcolor: '#fbbf24', color: 'white' }} />
        </Stack>
      </Paper>
    </Box>
  );
};

export default StateChartVisualizationReactFlow;